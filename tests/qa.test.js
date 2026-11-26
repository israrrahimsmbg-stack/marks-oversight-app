import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  checksForModule, checkStatus, validateSubmission, STATE, ownerRole, tally,
  moduleAccess, canRecordLevel, hasCap, DEFAULT_MATRIX, ROLES,
  checkAlerts, actionFlags, actionAlerts, digests, mondayReport, mondayText,
} from "../src/qa/index.js";

const config = JSON.parse(readFileSync(new URL("../config/qa-modules.json", import.meta.url)));
const mod = k => config.modules.find(m => m.key === k);
const fin = mod("finance");

// Invented people and an invented home (CLAUDE.md rule 3)
const users = {
  tl: { id: "tl", name: "Tia Leader", role: "team_leader", homes: ["H1"] },
  dm: { id: "dm", name: "Dev Deputy", role: "deputy_manager", homes: ["H1"] },
  sm: { id: "sm", name: "Sam Manager", role: "service_manager", homes: ["H1"] },
  sw: { id: "sw", name: "Sid Support", role: "support_worker", homes: ["H1"] },
  dir: { id: "dir", name: "Dana Director", role: "director" },
  qa: { id: "qa", name: "Quinn Compliance", role: "head_compliance" },
  fi: { id: "fi", name: "Fran Finance", role: "finance" },
  ops: { id: "ops", name: "Olly Ops", role: "operations" },
  adm: { id: "adm", name: "Ash Admin", role: "super_admin" },
};
const home = { id: "H1", name: "Service A", order: 1, status: "live", quarterStart: "2026-10-05",
  modules: { finance: true, medication: true }, staff: { team_leader: ["tl"], deputy_manager: ["dm"], service_manager: ["sm"], support_worker: ["sw"] } };
const checks = checksForModule(config, home, fin);
const byId = Object.fromEntries(checks.map(c => [c.id, c]));
const full = (n, bad = 0) => ({ submitted: true, evidence: bad ? "found issues" : "", answers: Object.fromEntries(Array.from({ length: n }, (_, i) => [i, i < bad ? "Not met" : "Met"])) });
const status = (id, rec, today, records = {}) => checkStatus(byId[id], rec, { config, module: fin, today, recordOf: x => records[x] });

test("finance quarter: 13 weekly, 3 monthly, 1 quarterly with the right due dates", () => {
  assert.equal(checks.filter(c => c.level === "weekly").length, 13);
  assert.equal(byId["H1|finance|weekly|1"].due, "2026-10-11");
  assert.equal(byId["H1|finance|weekly|13"].start, "2026-12-28");
  assert.deepEqual(byId["H1|finance|monthly|2"].deps, ["H1|finance|weekly|5", "H1|finance|weekly|6", "H1|finance|weekly|7", "H1|finance|weekly|8"]);
  assert.equal(byId["H1|finance|monthly|1"].due, "2026-11-04");
  assert.equal(byId["H1|finance|quarterly|1"].deps.length, 3);
});

test("weekly: heads-up 2 days before, Pending on the due day, Outstanding from 1 day late", () => {
  assert.equal(status("H1|finance|weekly|7", null, "2026-11-19").state, STATE.UPCOMING);
  assert.equal(status("H1|finance|weekly|7", null, "2026-11-20").state, STATE.DUE_SOON);
  assert.equal(status("H1|finance|weekly|7", null, "2026-11-22").state, STATE.PENDING);
  const s = status("H1|finance|weekly|7", null, "2026-11-23");
  assert.equal(s.state, STATE.OUTSTANDING);
  assert.equal(s.daysLate, 1);
});

test("a blank template is never complete (Week 4, 26 Oct 2026)", () => {
  const blank = { submitted: true, answers: {} };
  assert.equal(status("H1|finance|weekly|4", blank, "2026-11-26").state, STATE.OUTSTANDING);
  const v = validateSubmission(config, fin, "weekly", blank);
  assert.equal(v.ok, false);
  assert.match(v.errors[0], /18 of 18 questions are not answered/);
});

test("partly answered is still outstanding after the due date", () => {
  const part = { answers: { 0: "Met", 1: "Met" }, submitted: false };
  const s = status("H1|finance|weekly|5", part, "2026-11-26");
  assert.equal(s.state, STATE.OUTSTANDING);
  assert.match(s.reason, /2 of 18 answered/);
});

test("'Not met' answers are a deficit, not overdue (Hamida, 25 Nov)", () => {
  const s = status("H1|finance|weekly|6", full(18, 3), "2026-11-26");
  assert.equal(s.state, STATE.COMPLETE);
  assert.equal(s.tally.bad, 3);
  const al = checkAlerts({ check: byId["H1|finance|weekly|6"], status: s, module: fin, home }, { config, users, today: "2026-11-26" });
  assert.equal(al.length, 0);
});

test("not met answers need a comment; mostly N/A needs a reason", () => {
  const r = full(18, 2); r.evidence = "";
  assert.equal(validateSubmission(config, fin, "weekly", r).ok, false);
  const na = { answers: Object.fromEntries(Array.from({ length: 18 }, (_, i) => [i, i < 10 ? "N/A" : "Met"])) };
  assert.match(validateSubmission(config, fin, "weekly", na).errors.join(" "), /half the answers are N\/A/);
  na.naReason = "No transactions this week";
  assert.equal(validateSubmission(config, fin, "weekly", na).ok, true);
});

test("monthly waits for its four weekly audits; then it can be outstanding", () => {
  const recs = {};
  assert.equal(status("H1|finance|monthly|1", null, "2026-11-26", recs).state, STATE.BLOCKED);
  [1, 2, 3, 4].forEach(n => (recs[`H1|finance|weekly|${n}`] = full(18)));
  assert.equal(status("H1|finance|monthly|1", null, "2026-11-26", recs).state, STATE.OUTSTANDING);
});

test("on hold pauses a check until its review date", () => {
  const rec = { onHold: { reason: "Resident in hospital", review: "2026-11-30" } };
  assert.equal(status("H1|finance|weekly|7", rec, "2026-11-26").state, STATE.ON_HOLD);
  assert.equal(status("H1|finance|weekly|7", rec, "2026-12-01").state, STATE.OUTSTANDING);
});

test("infection control is softer: first alert only 7 days late", () => {
  const ipc = mod("infection_control");
  const [q] = checksForModule(config, home, ipc);
  const st = d => checkStatus(q, null, { config, module: ipc, today: d });
  assert.equal(st(q.due).state, STATE.PENDING);
  assert.equal(st("2027-01-15").state, STATE.PENDING); // 5 days late
  assert.equal(st("2027-01-17").state, STATE.OUTSTANDING); // 7 days late
});

test("owner falls back up the ladder when a home has no deputy", () => {
  assert.equal(ownerRole(fin, "monthly", config, home), "deputy_manager");
  const noDeputy = { ...home, staff: { team_leader: ["tl"], service_manager: ["sm"] } };
  assert.equal(ownerRole(fin, "monthly", config, noDeputy), "service_manager");
});

test("alerts: owner + line manager + head office copied; support workers never", () => {
  const c = byId["H1|finance|weekly|7"];
  const s = status(c.id, null, "2026-11-23");
  const [al] = checkAlerts({ check: c, status: s, module: fin, home }, { config, users, today: "2026-11-23" });
  const ids = al.recipients.map(r => r.userId).sort();
  assert.deepEqual(ids, ["dir", "dm", "fi", "qa", "tl"]);
  assert.ok(!ids.includes("sw"));
  const off = checkAlerts({ check: c, status: s, module: fin, home }, { config, users, today: "2026-11-23", settings: { headOfficeFrom: "escalation" } })[0];
  assert.deepEqual(off.recipients.map(r => r.userId).sort(), ["dm", "tl"]);
});

test("alerts repeat daily for 999 items and escalate to the service manager at 7 days", () => {
  const c = byId["H1|finance|weekly|7"];
  for (const d of ["2026-11-24", "2026-11-25"]) assert.equal(checkAlerts({ check: c, status: status(c.id, null, d), module: fin, home }, { config, users, today: d }).length, 1);
  const [al] = checkAlerts({ check: c, status: status(c.id, null, "2026-11-29"), module: fin, home }, { config, users, today: "2026-11-29" });
  assert.equal(al.kind, "escalated");
  assert.ok(al.recipients.some(r => r.userId === "sm"));
});

test("shadow mode sends only to the builder and compliance lead", () => {
  const c = byId["H1|finance|weekly|7"];
  const sh = { ...home, status: "shadow" };
  const [al] = checkAlerts({ check: c, status: status(c.id, null, "2026-11-23"), module: fin, home: sh }, { config, users, today: "2026-11-23" });
  assert.deepEqual(al.recipients.map(r => r.userId).sort(), ["adm", "qa"]);
  const planned = { ...home, status: "planned" };
  assert.equal(checkAlerts({ check: c, status: status(c.id, null, "2026-11-23"), module: fin, home: planned }, { config, users, today: "2026-11-23" }).length, 0);
});

test("leave cover: alerts go to the delegate", () => {
  const u = { ...users, tl: { ...users.tl, onLeave: true, delegate: "dm" } };
  const c = byId["H1|finance|weekly|7"];
  const [al] = checkAlerts({ check: c, status: status(c.id, null, "2026-11-23"), module: fin, home }, { config, users: u, today: "2026-11-23", settings: { headOfficeFrom: "escalation" } });
  assert.deepEqual(al.recipients.map(r => r.userId), ["dm"]);
});

test("action flags: deadline required, overdue, due soon, mid-point update, on hold", () => {
  const a = { id: "a1", ref: "A-1", homeId: "H1", status: "Not started", identified: "2026-11-01", ownerId: "sm" };
  assert.equal(actionFlags(a, "2026-11-26").noDeadline, true);
  const b = { ...a, target: "2026-11-20" };
  assert.equal(actionFlags(b, "2026-11-26").overdue, true);
  assert.equal(actionFlags(b, "2026-11-26").daysOver, 6);
  assert.equal(actionFlags({ ...b, target: "2026-12-01" }, "2026-11-26").dueSoon, true);
  assert.equal(actionFlags({ ...b, target: "2026-12-01" }, "2026-11-26").updateDue, true); // mid-point 16 Nov passed, no note
  assert.equal(actionFlags({ ...b, status: "On hold" }, "2026-11-26").overdue, false);
  assert.equal(actionFlags({ ...b, status: "Completed" }, "2026-11-26").open, false);
});

test("overdue action alerts the owner and service manager; digest groups per person", () => {
  const a = { id: "a1", ref: "A-1", homeId: "H1", status: "In progress", identified: "2026-11-01", target: "2026-11-25", ownerId: "dm", finding: "Missing receipt", priority: "High" };
  const al = actionAlerts(a, { users, today: "2026-11-26", homes: { H1: home } });
  assert.equal(al.length, 1);
  const d = digests(al, users);
  assert.deepEqual(d.map(x => x.user.id).sort(), ["dm", "sm"]);
});

test("access: home staff see only their homes; team leaders cannot do monthly checks", () => {
  assert.equal(moduleAccess(users.tl, "finance", "H1", DEFAULT_MATRIX, home), "record");
  assert.equal(moduleAccess(users.tl, "finance", "H2", DEFAULT_MATRIX), "none");
  assert.equal(moduleAccess(users.tl, "occupancy", "H1", DEFAULT_MATRIX, { ...home, modules: { occupancy: true } }), "none");
  assert.equal(moduleAccess(users.dir, "medication", "H1", DEFAULT_MATRIX, { ...home, modules: { medication: false } }), "none"); // switched off
  assert.equal(canRecordLevel(users.tl, "weekly", "team_leader", "record"), true);
  assert.equal(canRecordLevel(users.tl, "monthly", "deputy_manager", "record"), false);
  assert.equal(canRecordLevel(users.sm, "weekly", "team_leader", "record"), true);
  assert.equal(moduleAccess(users.sw, "finance", "H1", DEFAULT_MATRIX, home), "none");
  assert.equal(hasCap(users.sw, "monday"), false);
  assert.equal(hasCap(users.adm, "matrix"), true);
  assert.equal(hasCap(users.sm, "matrix"), false);
  assert.ok(Object.keys(DEFAULT_MATRIX).every(r => ROLES[r]));
});

test("Monday report lists not-done checks, deficits and actions by home", () => {
  const records = { "H1|finance|weekly|6": full(18, 2) };
  const evaluated = checks.map(c => ({ check: c, module: fin, home, status: checkStatus(c, records[c.id], { config, module: fin, today: "2026-11-30", recordOf: x => records[x] }) }));
  const actions = [{ id: "a", ref: "A-1", homeId: "H1", status: "Not started", identified: "2026-11-01", target: "2026-11-20", finding: "Receipt missing", ownerId: "sm" }];
  const rep = mondayReport({ homes: { H1: home }, evaluated, actions, today: "2026-11-30" });
  assert.equal(rep.rows.length, 1);
  assert.ok(rep.totals.outstanding >= 6);
  assert.equal(rep.totals.deficits, 1);
  assert.equal(rep.totals.overdueActions, 1);
  assert.match(mondayText(rep), /Service A/);
});

test("every module in config is well formed", () => {
  for (const m of config.modules) {
    assert.ok(m.key && m.label && m.basis && m.wave, m.key);
    for (const lvl of m.chain || []) assert.ok(config.levels[lvl] || lvl === "weekly_update", `${m.key} ${lvl}`);
    if (m.checks) for (const lvl of Object.keys(m.checks)) assert.ok(tally(m, lvl, {}, config).total > 0);
  }
  assert.equal(fin.checks.weekly.questions.length, 18);
});
