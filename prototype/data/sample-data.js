// SAMPLE DATA ONLY. Invented services and invented people (NFR / CLAUDE.md rule 3:
// no real personal data in this repo). Deterministic: the same dataset every build,
// generated from a small seeded pseudo-random sequence so dates look realistic but
// never change between runs.

// Stripped out by prototype/build.mjs, which inlines the engine instead.
import { rag, withDefaults } from "../../src/rules/rag.js";

export const TODAY = "2026-11-23";

export const SERVICES = [
  { id: "S01", name: "Beechwood House", kind: "Supported living", beds: 6, landlord: "Housing partner 1" },
  { id: "S02", name: "Oakfield Lodge", kind: "Supported living", beds: 5, landlord: "Housing partner 1" },
  { id: "S03", name: "Mill Road", kind: "Supported living", beds: 4, landlord: "Housing partner 2" },
  { id: "S04", name: "Hazel Court", kind: "Registered care", beds: 8, landlord: "Owned" },
  { id: "S05", name: "Fernbank", kind: "Supported living", beds: 5, landlord: "Housing partner 2" },
  { id: "S06", name: "Larch Avenue", kind: "Supported living", beds: 3, landlord: "Housing partner 3" },
  { id: "S07", name: "Priory Gardens", kind: "Registered care", beds: 10, landlord: "Owned" },
  { id: "S08", name: "Willow Bank", kind: "Supported living", beds: 6, landlord: "Housing partner 1" },
  { id: "S09", name: "Elm Terrace", kind: "Supported living", beds: 4, landlord: "Housing partner 3" },
  { id: "S10", name: "Marsh Lane", kind: "Supported living", beds: 5, landlord: "Housing partner 2" },
  { id: "S11", name: "Sycamore House", kind: "Supported living", beds: 7, landlord: "Housing partner 1" },
  { id: "S12", name: "Chapel Row", kind: "Supported living", beds: 4, landlord: "Housing partner 3" },
  { id: "S13", name: "Rowan Close", kind: "Supported living", beds: 5, landlord: "Housing partner 2" },
  { id: "S14", name: "Bramble Hill", kind: "Registered care", beds: 9, landlord: "Owned" },
];

// Invented staff. role values must match src/rules/escalation.js.
const FIRST = ["Alex", "Priya", "Sam", "Nadia", "Chris", "Leanne", "Omar", "Beth", "Tomas", "Ruth", "Dan", "Aisha", "Joel", "Mei"];
const LAST = ["Barker", "Chowdhury", "Doyle", "Ellis", "Frost", "Gill", "Hart", "Ibbotson", "Jenner", "Kaur", "Lund", "Mason", "Nolan", "Okafor"];

export const HEAD_OFFICE = [
  { name: "Director (South)", role: "director", email: "director@example.invalid", receives_monday: true, receives_escalations: true },
  { name: "Compliance & QA lead", role: "qa_lead", email: "qa@example.invalid", receives_monday: true, receives_escalations: true },
  { name: "Operations lead", role: "ops_lead", email: "ops@example.invalid", receives_monday: true, receives_escalations: false },
];

/** Tiny deterministic generator (mulberry32). Same output on every build. */
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const MS_DAY = 86400000;
const shift = (iso, n) => new Date(Date.parse(iso + "T00:00:00Z") + n * MS_DAY).toISOString().slice(0, 10);

/** People for each service: one manager, one deputy, one or two team leaders, support workers. */
export function buildPeople() {
  const r = rng(7);
  return Object.fromEntries(SERVICES.map((s, i) => {
    const nm = () => `${FIRST[Math.floor(r() * FIRST.length)]} ${LAST[Math.floor(r() * LAST.length)]}`;
    const people = [
      { name: nm(), role: "service_manager", email: `manager.${s.id.toLowerCase()}@example.invalid` },
      { name: nm(), role: "deputy_manager", email: `deputy.${s.id.toLowerCase()}@example.invalid` },
      { name: nm(), role: "team_leader", email: `tl.${s.id.toLowerCase()}@example.invalid` },
      { name: nm(), role: "support_worker", email: `sw.${s.id.toLowerCase()}@example.invalid` },
    ];
    // Two services have a manager on leave, with the deputy covering (BR-17).
    if (i === 1 || i === 9) {
      people[0].on_leave = true;
      people[0].delegate = people[1].name;
    }
    return [s.id, people];
  }));
}

const NEXT_STEPS = [
  "Engineer booked",
  "Landlord chasing contractor",
  "Visit booked with compliance lead",
  "Manager to complete and upload evidence",
  "Awaiting certificate from contractor",
  "Review meeting arranged",
  "Agency quote requested",
  "Escalated to landlord's maintenance team",
];

/**
 * One TrackerItem per applicable rule per service, plus person-level items
 * (referenced by code only, never a name — NFR-01).
 */
export function buildItems(rules, defaults = {}) {
  const r = rng(42);
  const pick = arr => arr[Math.floor(r() * arr.length)];
  const items = [];
  let n = 0;

  for (const s of SERVICES) {
    for (const rule of rules) {
      // Some rules only apply to some services.
      if (rule.key === "loler_hoist" && s.kind !== "Registered care") {
        items.push({ id: `I${++n}`, service: s.id, type: rule.key, applicable: false, history: [] });
        continue;
      }
      if (rule.key === "gas_safety" && r() < 0.25) continue;         // no gas appliances
      if (rule.key === "hmo_licence" && s.kind === "Registered care") continue;
      if (rule.key === "fire_extinguisher_service" && r() < 0.1) continue;
      const personLevel = ["support_plan_review", "risk_assessment_review", "care_act_review", "funding_package_review", "dols_authorisation"].includes(rule.key);
      const copies = personLevel ? Math.max(1, Math.round(s.beds * 0.6)) : 1;

      for (let c = 0; c < copies; c++) {
        const ref = personLevel ? `${s.id}-P${String(c + 1).padStart(2, "0")}` : null;
        const item = { id: `I${++n}`, service: s.id, type: rule.key, history: [] };
        const roll = r();
        const cert = rule.kind === "certificate";
        const span = rule.interval.unit === "day" ? rule.interval.n
          : rule.interval.unit === "week" ? rule.interval.n * 7
          : rule.interval.unit === "month" ? rule.interval.n * 30
          : rule.interval.n * 365;

        if (roll < 0.04) {
          // Nothing recorded at all: "Not recorded", never green (BR-13).
        } else if (roll < 0.14) {
          // Overdue / expired.
          const over = 1 + Math.floor(r() * Math.min(60, Math.max(3, span / 2)));
          if (cert) item.expires = shift(TODAY, -over);
          else item.last_done = shift(TODAY, -(span + over));
        } else if (roll < 0.32) {
          // Coming up inside the amber window.
          const inDays = Math.max(0, Math.floor(r() * (rule.amber_days ?? 30)));
          if (cert) item.expires = shift(TODAY, inDays);
          else item.last_done = shift(TODAY, -(span - inDays));
        } else {
          // In date.
          const inDays = (rule.amber_days ?? 30) + 1 + Math.floor(r() * Math.max(10, span * 0.6));
          if (cert) item.expires = shift(TODAY, inDays);
          else item.last_done = shift(TODAY, -Math.max(0, span - inDays));
        }

        if (ref) item.ref = ref;
        if (item.last_done) {
          item.history.push({ on: item.last_done, by: "Service manager", what: "Marked done in the app" });
          const prev = shift(item.last_done, -span);
          item.history.push({ on: prev, by: "Team leader", what: "Marked done in the app" });
        }
        if (item.expires) {
          item.history.push({ on: shift(item.expires, -(span)), by: "Compliance & QA lead", what: `Certificate recorded, expires ${item.expires}` });
        }
        items.push(item);
      }
    }
  }

  // Give roughly two thirds of the red and not-recorded items a real plan, so the rest
  // show up as "reds with no owner and no next step" — the ones Mark sees first (BR-15).
  const r2 = rng(99);
  for (const item of items) {
    const rule = withDefaults(rules.find(x => x.key === item.type), defaults);
    const status = rag(item, rule, TODAY).status;
    if (status !== "RED" && status !== "NOT_RECORDED") continue;
    if (r2() >= 0.65) continue;
    const people = PEOPLE[item.service];
    const owner = r2() < 0.7 ? people[0] : people[1];
    item.actions = [{
      owner: owner.name,
      next_step: pick(NEXT_STEPS),
      next_step_date: shift(TODAY, 2 + Math.floor(r2() * 14)),
      status: "open",
    }];
    item.history.unshift({ on: shift(TODAY, -(1 + Math.floor(r2() * 6))), by: owner.name, what: "Action added" });
  }
  return items;
}

export const PEOPLE = buildPeople();

/** Last week's statuses, so the report can show "changes since last week" (BR-16). */
export function buildPrevious(rows) {
  const r = rng(5);
  return rows.map(row => ({
    key: `${row.item.service}:${row.item.type}:${row.item.ref || ""}`,
    status: row.status === "RED" && r() < 0.25 ? "AMBER" : (row.status === "AMBER" && r() < 0.12 ? "RED" : row.status),
  }));
}

/** Who the prototype lets you sign in as (no real sign-in: ADR-0007 applies to the real build). */
export function buildUsers() {
  return [
    { id: "mark", label: "Mark (Director, South)", role: "director", scope: "all" },
    { id: "hamida", label: "Compliance & QA lead", role: "qa_lead", scope: "all" },
    { id: "yasmin", label: "Operations lead", role: "ops_lead", scope: "all" },
    { id: "sm01", label: `${PEOPLE.S01[0].name} (Service manager, Beechwood House)`, role: "service_manager", scope: "S01" },
    { id: "dep01", label: `${PEOPLE.S01[1].name} (Deputy, Beechwood House)`, role: "deputy_manager", scope: "S01" },
    { id: "tl05", label: `${PEOPLE.S05[2].name} (Team leader, Fernbank)`, role: "team_leader", scope: "S05" },
  ];
}
