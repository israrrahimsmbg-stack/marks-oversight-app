// QA check schedule and status. Pure: no I/O, no UI, no dependencies (ADR-0008).
// A "check" is one period of one module at one level for one home, e.g.
// "Hall Close · Finance · Weekly · Week 7". Statuses follow Hamida (25 Nov 2026):
// Pending on the due day, Outstanding from 1 day late, Completed only when every
// question is answered and the audit is submitted (so a blank template never counts).

import { addDays, daysBetween, toDay, fromDay } from "../rules/dates.js";

export const LADDER = ["team_leader", "deputy_manager", "service_manager"];

export const STATE = Object.freeze({
  COMPLETE: "complete",
  ON_HOLD: "on_hold",
  NA: "na",
  BLOCKED: "blocked",
  OUTSTANDING: "outstanding",
  PENDING: "pending",
  DUE_SOON: "due_soon",
  IN_PROGRESS: "in_progress",
  UPCOMING: "upcoming",
});

export const STATE_LABEL = {
  complete: "Completed", on_hold: "On hold", na: "Not applicable", blocked: "Waiting on earlier checks",
  outstanding: "Outstanding", pending: "Due today", due_soon: "Due soon", in_progress: "Started", upcoming: "Upcoming",
};

const fmt = iso => {
  const d = new Date(toDay(iso));
  return `${d.getUTCDate()} ${["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][d.getUTCMonth()]}`;
};
const lastOfMonth = iso => { const d = new Date(toDay(iso)); return fromDay(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)); };
const monthName = iso => ["January","February","March","April","May","June","July","August","September","October","November","December"][new Date(toDay(iso)).getUTCMonth()];
const dow = iso => new Date(toDay(iso)).getUTCDay(); // 0 Sunday … 6 Saturday

/** Timing for one level of one module: level defaults, overridden by the module. */
export function timing(config, module, level) {
  return { ...(config.levels[level] || {}), ...((module.timing_override || {})[level] || {}) };
}

/** Normalise a module's question list for one level into [{q, answers}]. */
export function questionsFor(module, level) {
  const c = (module.checks || {})[level];
  if (!c) return [];
  return c.questions.map(q => (typeof q === "string" ? { q, answers: c.answers } : { answers: c.answers, ...q }));
}

/**
 * All checks a home has for one module in the current quarter.
 * quarterStart is a Monday (Finance tracker: "Quarter start date"). Weeks 1–12 form
 * three 4-week months; week 13 is the extra week. Monthly is due 3 days after its
 * 4th week ends; quarterly 7 days after week 13 ends [both UNVERIFIED, ask Hamida].
 */
export function checksForModule(config, home, module) {
  const qs = home.quarterStart;
  const out = [];
  const base = { homeId: home.id, module: module.key };
  for (const level of module.chain || []) {
    if (level === "weekly") {
      for (let n = 1; n <= (module.periods?.weekly ?? 13); n++) {
        const start = addDays(qs, 7 * (n - 1));
        out.push({ ...base, level, n, start, due: addDays(start, 6), label: `Week ${n}`, sub: `w/c ${fmt(start)}`, deps: [] });
      }
    } else if (level === "monthly") {
      for (let n = 1; n <= (module.periods?.monthly ?? 3); n++) {
        const start = addDays(qs, 28 * (n - 1));
        const weeks = [4 * n - 3, 4 * n - 2, 4 * n - 1, 4 * n];
        out.push({ ...base, level, n, start, due: addDays(start, 27 + 3), label: `Month ${n}`, sub: `Weeks ${weeks[0]}–${weeks[3]}`,
          deps: module.chain.includes("weekly") ? weeks.map(w => idOf({ ...base, level: "weekly", n: w })) : [] });
      }
    } else if (level === "quarterly") {
      const deps = module.chain.includes("monthly") ? [1, 2, 3].map(m => idOf({ ...base, level: "monthly", n: m })) : [];
      out.push({ ...base, level, n: 1, start: qs, due: addDays(qs, 13 * 7 - 1 + 7), label: "Quarter", sub: `Quarter from ${fmt(qs)}`, deps });
    } else if (level === "twice_weekly" || level === "weekly_update") {
      const days = module.update_days || [5];
      let n = 0;
      for (let d = 0; d < 13 * 7; d++) {
        const iso = addDays(qs, d);
        if (days.includes(dow(iso))) { n++; out.push({ ...base, level, n, start: iso, due: iso, label: `${["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][dow(iso)]} ${fmt(iso)}`, sub: "Tracker updated", deps: [] }); }
      }
    } else if (level === "monthly_simple") {
      let m = qs.slice(0, 7) + "-01";
      for (let n = 1; n <= 3; n++) {
        const end = lastOfMonth(m);
        out.push({ ...base, level, n, start: m, due: end, label: monthName(m), sub: `Due ${fmt(end)}`, deps: [] });
        m = addDays(end, 1);
      }
    }
  }
  return out.map(c => ({ ...c, id: idOf(c) }));
}

export const idOf = c => `${c.homeId}|${c.module}|${c.level}|${c.n}`;

/** Count answers on a record against the module's questions. */
export function tally(module, level, record = {}, config) {
  const qs = questionsFor(module, level);
  const ans = record.answers || {};
  let answered = 0, bad = 0, good = 0, na = 0;
  const badItems = [];
  qs.forEach((q, i) => {
    const v = ans[i];
    if (v == null || v === "") return;
    answered++;
    const set = config.answer_sets[q.answers] || { bad: [] };
    if (v === "N/A") na++;
    else if (set.bad.includes(v)) { bad++; badItems.push(q.q); } else good++;
  });
  const score = good + bad > 0 ? good / (good + bad) : null;
  return { total: qs.length, answered, bad, good, na, score, badItems };
}

/**
 * Can this record be submitted as complete? Blocks the "blank template" problem
 * (Week 4, 26 Oct 2026): every question needs an answer, any failing answer needs
 * a comment, and mostly-N/A audits need a reason.
 */
export function validateSubmission(config, module, level, record = {}) {
  const t = tally(module, level, record, config);
  const errors = [];
  const qs = questionsFor(module, level);
  if (!qs.length) return { ok: true, errors, tally: t };
  if (t.answered < t.total) errors.push(`${t.total - t.answered} of ${t.total} questions are not answered yet. A check only counts as done when every question has an answer.`);
  if (t.bad > 0 && !(record.evidence || "").trim()) errors.push("Some answers are not met. Add a comment or evidence note saying what was found.");
  if (t.total >= 4 && t.na > t.total / 2 && !(record.naReason || "").trim()) errors.push(`More than half the answers are N/A (${t.na} of ${t.total}). Say why, so nobody mistakes a blank audit for a done one.`);
  return { ok: errors.length === 0, errors, tally: t };
}

/** RAG for a completed audit's score (Medication tracker: green from 95%). */
export function scoreTone(module, score) {
  if (score == null) return "none";
  const g = module.rag_green ?? 1, a = module.rag_amber ?? 0.8;
  return score >= g ? "good" : score >= a ? "warn" : "bad";
}

/**
 * Status of one check on a given day.
 * @param check  from checksForModule
 * @param record stored data: {answers, evidence, submitted, onHold:{reason, review}, na, naReason}
 * @param ctx    {config, module, today, recordOf(id)}
 */
export function checkStatus(check, record, ctx) {
  const { config, module, today } = ctx;
  const r = record || {};
  const t = timing(config, module, check.level);
  const tl = tally(module, check.level, r, config);
  const daysLate = daysBetween(check.due, today);
  const base = { id: check.id, daysLate, due: check.due, tally: tl, timing: t };
  const qs = questionsFor(module, check.level);

  if (r.na) return { ...base, state: STATE.NA, reason: r.naReason || "Marked not applicable" };
  if (r.submitted && (qs.length === 0 || tl.answered === tl.total)) {
    return { ...base, state: STATE.COMPLETE, reason: tl.bad ? `${tl.bad} not met` : "All met", deficits: tl.badItems };
  }
  if (r.onHold && (!r.onHold.review || r.onHold.review >= today)) {
    return { ...base, state: STATE.ON_HOLD, reason: `${r.onHold.reason || "On hold"}${r.onHold.review ? ` (review ${fmt(r.onHold.review)})` : ""}` };
  }
  const waiting = (check.deps || []).filter(d => {
    const s = ctx.recordOf ? ctx.recordOf(d) : null;
    return !(s && (s.na || s.submitted));
  });
  const startedNote = tl.answered > 0 ? ` (${tl.answered} of ${tl.total} answered, not submitted)` : "";
  if (waiting.length && daysLate >= -t.heads_up_days) {
    return { ...base, state: STATE.BLOCKED, waiting, reason: `Waiting for ${waiting.length} earlier ${waiting.length === 1 ? "check" : "checks"} to be completed first` };
  }
  if (daysLate >= (t.outstanding_after_days ?? 1)) return { ...base, state: STATE.OUTSTANDING, reason: `Not done, ${daysLate} ${daysLate === 1 ? "day" : "days"} late${startedNote}` };
  if (daysLate >= 0) return { ...base, state: STATE.PENDING, reason: daysLate === 0 ? `Due today${startedNote}` : `Due ${daysLate} days ago; alerts start at ${t.outstanding_after_days} days${startedNote}` };
  if (-daysLate <= (t.heads_up_days ?? 0)) return { ...base, state: STATE.DUE_SOON, reason: `Due in ${-daysLate} ${daysLate === -1 ? "day" : "days"}${startedNote}` };
  if (tl.answered > 0) return { ...base, state: STATE.IN_PROGRESS, reason: `Started${startedNote}` };
  return { ...base, state: STATE.UPCOMING, reason: `Due ${fmt(check.due)}` };
}

/** Which role owns a level, with fallback up the ladder when a home has nobody in it (e.g. no deputy). */
export function ownerRole(module, level, config, home) {
  const want = module.owner_override || (config.levels[level] || {}).owner || "service_manager";
  if (!LADDER.includes(want) || !home) return want;
  for (let i = LADDER.indexOf(want); i < LADDER.length; i++) {
    if ((home.staff?.[LADDER[i]] || []).length) return LADDER[i];
  }
  return "service_manager";
}
