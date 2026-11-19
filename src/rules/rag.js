import { daysBetween } from "./dates.js";
import { dueDate } from "./schedule.js";

export const RAG = Object.freeze({
  RED: "RED",
  AMBER: "AMBER",
  GREEN: "GREEN",
  NOT_RECORDED: "NOT_RECORDED", // never shown as green (BR-13)
  NA: "NA",
});

const plural = (n, w) => `${n} ${w}${n === 1 ? "" : "s"}`;

/** Merge rule with config defaults. */
export function withDefaults(rule, defaults = {}) {
  return { ...defaults, ...rule };
}

/**
 * Work out the RAG status of one tracked item.
 * @returns {{status, due, daysOverdue, reason}}
 *   daysOverdue > 0 means overdue/expired by that many days; <= 0 means due in -daysOverdue days.
 */
export function rag(item, rule, today) {
  if (item.applicable === false) return { status: RAG.NA, due: null, daysOverdue: null, reason: "Not applicable" };
  const due = dueDate(item, rule);
  if (!due) return { status: RAG.NOT_RECORDED, due: null, daysOverdue: null, reason: "No date recorded" };

  const over = daysBetween(due, today);
  const amber = rule.amber_days ?? 30;
  const grace = rule.grace_days ?? 0;
  const cert = rule.kind === "certificate";

  if (over > 0) {
    if (!cert && over <= grace) {
      return { status: RAG.AMBER, due, daysOverdue: over, reason: `Overdue by ${plural(over, "day")} (within ${plural(grace, "day")} grace)` };
    }
    return { status: RAG.RED, due, daysOverdue: over, reason: cert ? `Expired ${plural(over, "day")} ago` : `Not done for ${plural(over, "day")} past due` };
  }
  if (over === 0) {
    return { status: RAG.AMBER, due, daysOverdue: 0, reason: cert ? "Expires today" : "Due today" };
  }
  if (-over <= amber) {
    return { status: RAG.AMBER, due, daysOverdue: over, reason: `${cert ? "Expires" : "Due"} in ${plural(-over, "day")}` };
  }
  return { status: RAG.GREEN, due, daysOverdue: over, reason: `In date (${cert ? "expires" : "next due"} ${due})` };
}

/** An item is "managed" when it has an open action with an owner and a dated next step (BR-05, BR-15). */
export function isManaged(item) {
  return (item.actions || []).some(a => a.status !== "closed" && a.owner && a.next_step && a.next_step_date);
}
