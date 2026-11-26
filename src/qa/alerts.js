// Alerts, action flags and the Monday report for the QA app. Pure (ADR-0008).
// Rules (25 Nov 2026 call, Mark's emails 24-25 Nov) — all UNVERIFIED until Hamida signs off:
//  * Alert only when a check has not been done. A completed check with "Not met"
//    answers is a deficit for the Monday report, not an overdue alert.
//  * Heads-up to the owner before the due date; Outstanding from 1 day late, repeated
//    until done (daily for 999 items); the next rung up the ladder is copied in.
//  * Ladder: team leader > deputy manager > service manager; head office at escalation,
//    and Mark, Nafisa and Hamida copied from the first alert (setting).
//  * One digest email per person per day. Support workers are never notified.

import { addDays, daysBetween } from "../rules/dates.js";
import { LADDER, STATE, ownerRole, timing } from "./schedule.js";

export const NEVER = Object.freeze(["support_worker"]);
export const WATCHERS = { health_safety: ["operations"], maintenance: ["operations"], occupancy: ["operations", "finance"], fire_property: ["operations"], care_records: [] };
export const ACTION_DONE = "Completed";
export const ACTION_HOLD = "On hold";

const dd = n => `${n} ${n === 1 ? "day" : "days"}`;

/** People in a role at a home, swapping anyone on leave for their delegate. */
export function staffIn(home, role, users) {
  const ids = (home.staff || {})[role] || [];
  return ids.map(id => users[id]).filter(Boolean).map(u => (u.onLeave && u.delegate && users[u.delegate] ? { ...users[u.delegate], coverFor: u.id } : u));
}

function rungsFrom(home, role, users) {
  // the owner's rung and every rung above it that has someone in it
  const start = Math.max(0, LADDER.indexOf(role));
  return LADDER.slice(start).filter(r => staffIn(home, r, users).length);
}

function headOffice(users, roles) {
  return Object.values(users).filter(u => roles.includes(u.role) && !u.disabled);
}

function add(map, user, why) {
  if (!user || NEVER.includes(user.role) || user.disabled) return;
  if (!map.has(user.id)) map.set(user.id, { userId: user.id, why: [] });
  if (!map.get(user.id).why.includes(why)) map.get(user.id).why.push(why);
}

function finalise(map, home, users) {
  if (home.status === "shadow") {
    // shadow mode: only the builder and the compliance lead see what would have been sent
    const m = new Map();
    headOffice(users, ["super_admin", "head_compliance"]).forEach(u => add(m, u, "shadow mode"));
    return [...m.values()];
  }
  return [...map.values()];
}

/**
 * Alerts that fire today for one evaluated check.
 * @param e {check, status, module, home}
 */
export function checkAlerts(e, ctx) {
  const { config, users, today, settings = {} } = ctx;
  const { check, status, module, home } = e;
  if (!home || !["live", "shadow"].includes(home.status)) return [];
  const t = timing(config, module, check.level);
  const role = ownerRole(module, check.level, config, home);
  const late = status.daysLate;
  const out = [];
  const base = { homeId: home.id, module: module.key, checkId: check.id, priority: module.priority, title: `${module.label} · ${(config.levels[check.level] || {}).label || check.level} · ${check.label}` };
  const ownerPeople = LADDER.includes(role) ? staffIn(home, role, users) : headOffice(users, [role]);

  if (status.state === STATE.DUE_SOON || status.state === STATE.PENDING) {
    const opens = t.heads_up_days > 0 && -late === t.heads_up_days;
    if (opens || late === 0) {
      const m = new Map();
      ownerPeople.forEach(u => add(m, u, "owner"));
      out.push({ ...base, kind: "heads_up", rung: 0, reason: late === 0 ? "Due today" : `Due in ${dd(-late)}`, recipients: finalise(m, home, users) });
    }
    return out;
  }
  if (status.state !== STATE.OUTSTANDING) return out;

  const after = t.outstanding_after_days ?? 1;
  const repeat = module.priority === "999" ? 1 : (t.repeat_every_days || 2);
  const k = late - after;
  if (k < 0 || k % repeat !== 0) return out;
  const nth = Math.floor(k / repeat) + 1;
  const escalated = late >= (t.escalate_after_days ?? 7);
  const m = new Map();
  ownerPeople.forEach(u => add(m, u, "owner"));
  const rungs = LADDER.includes(role) ? rungsFrom(home, role, users) : [];
  const upto = escalated ? rungs.length : Math.min(rungs.length, 2);
  rungs.slice(1, upto).forEach(r => staffIn(home, r, users).forEach(u => add(m, u, escalated ? "escalated" : "line manager")));
  if (!LADDER.includes(role)) staffIn(home, "service_manager", users).forEach(u => add(m, u, "service manager"));
  if (escalated) headOffice(users, ["director", "head_compliance"]).forEach(u => add(m, u, "escalated to head office"));
  if (escalated || settings.headOfficeFrom !== "escalation") headOffice(users, ["director", "head_compliance", "finance"]).forEach(u => add(m, u, "copied (head office)"));
  headOffice(users, WATCHERS[module.key] || []).forEach(u => add(m, u, "module lead"));
  out.push({ ...base, kind: escalated ? "escalated" : "outstanding", rung: escalated ? 2 : 1, nth, reason: `Not done, ${dd(late)} late${nth > 1 ? ` · reminder ${nth}` : ""}`, recipients: finalise(m, home, users) });
  return out;
}

/**
 * Alerts for one register item rated by the rules engine (fire log, certificates,
 * care records). Red or not recorded: the service manager and deputy, the module
 * lead and head office (as for checks); daily for 999 modules, every 3 days for
 * others; escalated to the director and compliance lead from 14 days over.
 * Amber: a heads-up to the service manager 30, 14, 7 and 1 days before it falls due.
 * [UNVERIFIED] timings, for Hamida to sign off.
 * @param x {home, module, rule, item, rag}
 */
export function registerAlerts(x, ctx) {
  const { users, today, settings = {} } = ctx;
  const { home, module, rule, rag } = x;
  if (!home || !["live", "shadow"].includes(home.status) || !rag) return [];
  const base = { homeId: home.id, module: module.key, ruleKey: rule.key, priority: module.priority, title: `${module.label} · ${rule.label}` };
  const m = new Map();
  if (rag.status === "AMBER" && rag.due) {
    const until = daysBetween(today, rag.due);
    if (![30, 14, 7, 1].includes(until)) return [];
    staffIn(home, "service_manager", users).forEach(u => add(m, u, "owner"));
    return [{ ...base, kind: "heads_up", rung: 0, reason: `Due in ${dd(until)}`, recipients: finalise(m, home, users) }];
  }
  if (rag.status !== "RED" && rag.status !== "NOT_RECORDED") return [];
  const late = rag.due ? Math.max(1, daysBetween(rag.due, today)) : 1;
  const repeat = module.priority === "999" ? 1 : 3;
  if ((late - 1) % repeat !== 0 && late !== 14) return []; // always on the day it escalates
  const escalated = late >= 14;
  ["service_manager", "deputy_manager"].forEach(r => staffIn(home, r, users).forEach(u => add(m, u, r === "service_manager" ? "owner" : "line manager")));
  if (escalated) headOffice(users, ["director", "head_compliance"]).forEach(u => add(m, u, "escalated to head office"));
  if (escalated || settings.headOfficeFrom !== "escalation") headOffice(users, ["director", "head_compliance", "finance"]).forEach(u => add(m, u, "copied (head office)"));
  headOffice(users, WATCHERS[module.key] || []).forEach(u => add(m, u, "module lead"));
  const reason = rag.status === "NOT_RECORDED" ? "Never recorded" : `Out of date, ${dd(late)} over`;
  return [{ ...base, kind: escalated ? "escalated" : "outstanding", rung: escalated ? 2 : 1, reason, recipients: finalise(m, home, users) }];
}

/** Flags for one action on a given day. */
export function actionFlags(a, today) {
  const open = a.status !== ACTION_DONE;
  const hold = a.status === ACTION_HOLD;
  const live = open && !hold;
  const update = a.updateDue || (a.identified && a.target ? addDays(a.identified, Math.floor(daysBetween(a.identified, a.target) / 2)) : null);
  const lastNote = (a.comments || []).reduce((m, c) => (c.at > m ? c.at : m), "");
  const daysOver = live && a.target ? daysBetween(a.target, today) : null;
  return {
    open, hold, live,
    noDeadline: live && !a.target,
    noOwner: open && !a.ownerId,
    overdue: daysOver != null && daysOver > 0,
    daysOver: daysOver != null && daysOver > 0 ? daysOver : 0,
    dueSoon: live && !!a.target && daysOver <= 0 && daysOver >= -7,
    updateDue: live && !!update && update <= today && update > a.identified && lastNote.slice(0, 10) < update,
    updateOn: update,
    needsSignOff: a.status === "Awaiting sign-off",
    // Mark, 18 Nov: "the system has to tell us what the next action is"
    noNextStep: live && !(a.nextStep || "").trim(),
    nextStepLate: live && !!a.nextStepDate && a.nextStepDate < today,
    prioritised: open && !!a.prioritisedBy,
  };
}

/** Alerts for one action today. */
export function actionAlerts(a, ctx) {
  const { users, today, homes } = ctx;
  const home = homes[a.homeId];
  if (!home || !["live", "shadow"].includes(home.status)) return [];
  const f = actionFlags(a, today);
  const out = [];
  const base = { homeId: a.homeId, module: a.module, actionId: a.id, priority: a.priority === "High" ? "999" : "standard", title: `Action ${a.ref}: ${a.finding}` };
  if (f.overdue && (f.daysOver - 1) % 3 === 0) {
    const m = new Map();
    add(m, users[a.ownerId], "action owner");
    staffIn(home, "service_manager", users).forEach(u => add(m, u, "service manager"));
    if (f.daysOver >= 14) headOffice(users, ["director", "head_compliance"]).forEach(u => add(m, u, "escalated to head office"));
    out.push({ ...base, kind: f.daysOver >= 14 ? "escalated" : "action_overdue", rung: f.daysOver >= 14 ? 2 : 1, reason: `Target date passed ${dd(f.daysOver)} ago`, recipients: finalise(m, home, users) });
  }
  if (f.prioritised && a.prioritisedOn && daysBetween(a.prioritisedOn, today) === 1) {
    const m = new Map();
    add(m, users[a.ownerId], "action owner");
    staffIn(home, "service_manager", users).forEach(u => add(m, u, "service manager"));
    out.push({ ...base, priority: "999", kind: "prioritised", rung: 1, reason: `Made a priority by head office: ${a.prioritisedWhy || ""}`.trim(), recipients: finalise(m, home, users) });
  }
  if (f.updateDue && f.updateOn === today) {
    const m = new Map();
    add(m, users[a.ownerId], "action owner");
    out.push({ ...base, kind: "action_update", rung: 0, reason: "Progress update due today (mid-point)", recipients: finalise(m, home, users) });
  }
  return out;
}

/** Group alerts into one digest per person (never one email per check). */
export function digests(alerts, users) {
  const by = new Map();
  for (const al of alerts) for (const r of al.recipients) {
    if (!by.has(r.userId)) by.set(r.userId, { user: users[r.userId], items: [] });
    by.get(r.userId).items.push({ ...al, why: r.why });
  }
  const rank = { escalated: 0, prioritised: 1, outstanding: 1, action_overdue: 2, action_update: 3, heads_up: 4 };
  return [...by.values()].filter(d => d.user).map(d => ({ ...d, items: d.items.sort((a, b) => (rank[a.kind] - rank[b.kind]) || (a.priority === "999" ? -1 : 1)) }))
    .sort((a, b) => b.items.length - a.items.length);
}

/**
 * Monday report, home by home (Mark, 24 Nov 2026): deficits, overdue checks,
 * overdue actions and actions due in the next 7 days.
 * @param evaluated [{check, status, module, home}]
 */
export function mondayReport({ homes, evaluated, actions, today, rated = [] }) {
  const rows = Object.values(homes).filter(h => ["live", "shadow"].includes(h.status)).sort((a, b) => a.order - b.order).map(home => {
    const mine = evaluated.filter(e => e.home.id === home.id);
    const outstanding = mine.filter(e => e.status.state === STATE.OUTSTANDING || (e.status.state === STATE.BLOCKED && e.status.daysLate > 0))
      .sort((a, b) => b.status.daysLate - a.status.daysLate);
    const deficits = mine.filter(e => e.status.state === STATE.COMPLETE && e.status.tally.bad > 0 && daysBetween(e.check.due, today) <= 28 && daysBetween(e.check.due, today) >= 0);
    const acts = actions.filter(a => a.homeId === home.id).map(a => ({ a, f: actionFlags(a, today) }));
    // Mark, 18 Nov: "what's out of date, what's coming out of date, what's in date"
    const dueSoonChecks = mine.filter(e => [STATE.PENDING, STATE.DUE_SOON, STATE.UPCOMING, STATE.IN_PROGRESS].includes(e.status.state) && e.status.daysLate <= 0 && e.status.daysLate >= -7)
      .sort((a, b) => b.status.daysLate - a.status.daysLate);
    const reg = rated.filter(x => x.home.id === home.id);
    const registerRed = reg.filter(x => x.rag.status === "RED" || x.rag.status === "NOT_RECORDED");
    const registerSoon = reg.filter(x => x.rag.status === "AMBER");
    const inDate = mine.filter(e => e.status.state === STATE.COMPLETE && daysBetween(e.check.due, today) <= 28).length + reg.filter(x => x.rag.status === "GREEN").length;
    const overdueActions = acts.filter(x => x.f.overdue).sort((x, y) => y.f.daysOver - x.f.daysOver);
    const noDeadline = acts.filter(x => x.f.noDeadline);
    const outstanding999 = outstanding.filter(e => e.module.priority === "999").length;
    const red999 = registerRed.filter(x => x.module.priority === "999").length;
    // RAG for the home [UNVERIFIED]: red = a 999 item not done or out of date, or an action 14+ days over;
    // amber = anything else outstanding, a deficit, an overdue action or one with no deadline; green = nothing.
    const rag = outstanding999 || red999 || overdueActions.some(x => x.f.daysOver >= 14) ? "RED"
      : outstanding.length || registerRed.length || deficits.length || overdueActions.length || noDeadline.length ? "AMBER" : "GREEN";
    return {
      home, rag, outstanding, deficits, overdueActions, noDeadline, outstanding999,
      dueSoon: acts.filter(x => x.f.dueSoon),
      dueSoonChecks, registerRed, registerSoon, inDate,
      noNextStep: acts.filter(x => x.f.noNextStep && (x.f.overdue || x.f.dueSoon)),
    };
  });
  const sum = k => rows.reduce((n, r) => n + r[k].length, 0);
  return { today, weekOf: today, rows, totals: { outstanding: sum("outstanding"), deficits: sum("deficits"), overdueActions: sum("overdueActions"), dueSoon: sum("dueSoon"), noDeadline: sum("noDeadline"), registerRed: sum("registerRed"), dueSoonChecks: sum("dueSoonChecks"), inDate: rows.reduce((n, r) => n + r.inDate, 0), red: rows.filter(r => r.rag === "RED").length } };
}

/** Plain-text version of the Monday report, for the email body. */
export function mondayText(rep) {
  const L = [];
  L.push(`QA weekly report, week of ${rep.today}`);
  L.push(`${rep.totals.red} homes red · ${rep.totals.outstanding} checks not done · ${rep.totals.registerRed} items out of date · ${rep.totals.deficits} audits with deficits · ${rep.totals.overdueActions} actions overdue · ${rep.totals.dueSoon} actions due in 7 days · ${rep.totals.noDeadline} actions with no deadline`);
  for (const r of rep.rows) {
    L.push("", `== ${r.home.name} · ${r.rag}${r.home.status === "shadow" ? " (shadow mode)" : ""} ==`);
    if (r.rag === "GREEN" && !r.dueSoon.length && !r.dueSoonChecks.length && !r.registerSoon.length) { L.push(`Nothing outstanding. ${r.inDate} items in date.`); continue; }
    if (r.outstanding.length) { L.push("Not done:"); r.outstanding.forEach(e => L.push(`  - ${e.module.label} ${e.check.label}: ${e.status.reason}`)); }
    if (r.registerRed.length) { L.push("Out of date (certificates, fire log, care records):"); r.registerRed.forEach(x => L.push(`  - ${x.rule.label}: ${x.rag.reason}`)); }
    if (r.deficits.length) { L.push("Deficits (done, but not met):"); r.deficits.forEach(e => L.push(`  - ${e.module.label} ${e.check.label}: ${e.status.tally.badItems.join("; ")}`)); }
    if (r.overdueActions.length) { L.push("Overdue actions:"); r.overdueActions.forEach(({ a, f }) => L.push(`  - ${a.ref} ${a.finding} (${f.daysOver} days over)`)); }
    if (r.dueSoon.length) { L.push("Actions due in the next 7 days:"); r.dueSoon.forEach(({ a }) => L.push(`  - ${a.ref} ${a.finding} (due ${a.target})`)); }
    if (r.dueSoonChecks.length || r.registerSoon.length) { L.push("Coming up:"); r.dueSoonChecks.forEach(e => L.push(`  - ${e.module.label} ${e.check.label} (due ${e.check.due})`)); r.registerSoon.forEach(x => L.push(`  - ${x.rule.label} (due ${x.rag.due})`)); }
    L.push(`In date: ${r.inDate}`);
  }
  return L.join("\n");
}
