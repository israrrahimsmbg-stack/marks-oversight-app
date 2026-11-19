import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  addInterval, daysBetween, rag, RAG, withDefaults, isManaged,
  escalationLevel, recipients, shouldSend, LEVEL, NEVER_NOTIFY, buildReport, renderText,
} from "../src/rules/index.js";
import { rulesTable } from "../scripts/build-rules-doc.mjs";

const config = JSON.parse(readFileSync(new URL("../config/rules.json", import.meta.url)));
const rule = key => withDefaults(config.rules.find(r => r.key === key), config.defaults);

test("dates: month and year intervals clamp to month end", () => {
  assert.equal(addInterval("2026-01-31", { unit: "month", n: 1 }), "2026-02-28");
  assert.equal(addInterval("2028-02-29", { unit: "year", n: 1 }), "2029-02-28");
  assert.equal(addInterval("2026-11-01", { unit: "day", n: 14 }), "2026-11-15");
  assert.equal(daysBetween("2026-10-24", "2026-10-26"), 2); // across the BST change
});

test("certificate: expired is RED, inside amber window is AMBER, else GREEN", () => {
  const gas = rule("gas_safety");
  assert.equal(rag({ expires: "2026-11-18" }, gas, "2026-11-30").status, RAG.RED);
  assert.equal(rag({ expires: "2026-12-20" }, gas, "2026-11-30").status, RAG.AMBER);
  assert.equal(rag({ expires: "2027-06-01" }, gas, "2026-11-30").status, RAG.GREEN);
  assert.equal(rag({ expires: "2026-11-30" }, gas, "2026-11-30").status, RAG.AMBER);
});

test("missing date is NOT_RECORDED, never GREEN (BR-13)", () => {
  assert.equal(rag({ expires: null }, rule("fire_risk_assessment"), "2026-11-30").status, RAG.NOT_RECORDED);
  assert.equal(rag({}, rule("fire_alarm_weekly_test"), "2026-11-30").status, RAG.NOT_RECORDED);
});

test("not applicable is NA", () => {
  assert.equal(rag({ applicable: false }, rule("loler_hoist"), "2026-11-30").status, RAG.NA);
});

test("weekly fire log: grace day then RED (the Aug 2026 missed-log case)", () => {
  const fire = rule("fire_alarm_weekly_test");
  assert.equal(rag({ last_done: "2026-11-23" }, fire, "2026-11-30").status, RAG.AMBER); // due today
  assert.equal(rag({ last_done: "2026-11-22" }, fire, "2026-11-30").status, RAG.AMBER); // 1 day over, in grace
  assert.equal(rag({ last_done: "2026-11-21" }, fire, "2026-11-30").status, RAG.RED);
  assert.equal(rag({ last_done: "2026-11-27" }, fire, "2026-11-30").status, RAG.GREEN);
});

test("explicit expiry on the item beats the calculated interval (e.g. short EICR)", () => {
  assert.equal(rag({ last_done: "2025-01-01", expires: "2026-11-01" }, rule("eicr"), "2026-11-30").status, RAG.RED);
});

test("managed means open action with owner and dated next step", () => {
  assert.equal(isManaged({ actions: [{ owner: "X", next_step: "Y", next_step_date: "2026-12-01", status: "open" }] }), true);
  assert.equal(isManaged({ actions: [{ owner: "X", next_step: "Y", status: "open" }] }), false);
  assert.equal(isManaged({}), false);
});

test("escalation ladder: team → manager at 7 days → head office at 14 days", () => {
  const r = rule("fire_alarm_weekly_test");
  assert.equal(escalationLevel({ status: RAG.GREEN, daysOverdue: -3 }, r), LEVEL.NONE);
  assert.equal(escalationLevel({ status: RAG.RED, daysOverdue: 3 }, r), LEVEL.SERVICE_TEAM);
  assert.equal(escalationLevel({ status: RAG.RED, daysOverdue: 7 }, r), LEVEL.SERVICE_MANAGER);
  assert.equal(escalationLevel({ status: RAG.RED, daysOverdue: 14 }, r), LEVEL.HEAD_OFFICE);
});

test("support workers are never notified, at any level", () => {
  const svc = { people: [
    { name: "M", role: "service_manager" }, { name: "D", role: "deputy_manager" },
    { name: "T", role: "team_leader" }, { name: "S", role: "support_worker" },
  ] };
  for (const level of Object.values(LEVEL)) {
    const names = recipients(level, svc, [{ name: "HO", role: "director" }]).map(p => p.role);
    for (const banned of NEVER_NOTIFY) assert.ok(!names.includes(banned), `level ${level} included ${banned}`);
  }
  assert.deepEqual(recipients(LEVEL.HEAD_OFFICE, svc, [{ name: "HO", role: "director" }]).map(p => p.name), ["M", "D", "T", "HO"]);
  assert.deepEqual(recipients(LEVEL.SERVICE_MANAGER, svc).map(p => p.name), ["M", "D"]);
});

test("manager on leave: delegate is notified instead", () => {
  const svc = { people: [{ name: "M", role: "service_manager", on_leave: true, delegate: "D" }, { name: "D", role: "deputy_manager" }] };
  assert.deepEqual(recipients(LEVEL.SERVICE_MANAGER, svc).map(p => p.name), ["D"]);
});

test("reminders repeat weekly, or at once when the level rises", () => {
  const r = rule("gas_safety");
  assert.equal(shouldSend({ level: LEVEL.SERVICE_MANAGER, lastLevel: LEVEL.SERVICE_MANAGER, lastSentOn: "2026-11-27", today: "2026-11-30", rule: r }), false);
  assert.equal(shouldSend({ level: LEVEL.SERVICE_MANAGER, lastLevel: LEVEL.SERVICE_MANAGER, lastSentOn: "2026-11-23", today: "2026-11-30", rule: r }), true);
  assert.equal(shouldSend({ level: LEVEL.HEAD_OFFICE, lastLevel: LEVEL.SERVICE_MANAGER, lastSentOn: "2026-11-29", today: "2026-11-30", rule: r }), true);
});

test("sample report: unmanaged reds come first; forward look counts", () => {
  const { services } = JSON.parse(readFileSync(new URL("../data/sample/services.json", import.meta.url)));
  const items = JSON.parse(readFileSync(new URL("../data/sample/items.json", import.meta.url)));
  const rep = buildReport(config, services, items, "2026-11-30");
  assert.ok(rep.totals.RED > 0);
  assert.equal(rep.reds[0].managed, false);
  assert.ok(rep.unmanaged.every(r => !r.managed));
  assert.match(renderText(rep, services), /WEEKLY OVERSIGHT REPORT/);
});

test("config: every rule is complete and starts UNVERIFIED or has a verifier", () => {
  const keys = new Set();
  for (const r of config.rules) {
    for (const f of ["key", "label", "category", "kind", "interval", "basis", "legal_ref", "duty_holder", "status", "last_checked"]) assert.ok(r[f] !== undefined, `${r.key} missing ${f}`);
    assert.ok(["legal", "guidance", "policy"].includes(r.basis), `${r.key} basis`);
    assert.ok(["certificate", "recurring"].includes(r.kind), `${r.key} kind`);
    assert.ok(r.status === "UNVERIFIED" || (r.status === "VERIFIED" && r.verified_by), `${r.key}: VERIFIED needs verified_by`);
    assert.ok(!keys.has(r.key), `duplicate ${r.key}`); keys.add(r.key);
  }
});

test("docs/COMPLIANCE_RULES.md table matches config/rules.json (run `npm run rules:doc`)", () => {
  const doc = readFileSync(new URL("../docs/COMPLIANCE_RULES.md", import.meta.url), "utf8");
  assert.ok(doc.includes(rulesTable(config)), "COMPLIANCE_RULES.md is out of date: run `npm run rules:doc`");
});
