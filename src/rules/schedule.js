import { addInterval } from "./dates.js";

/**
 * When is this item next due (recurring check) or when does it expire (certificate)?
 * Priority: an explicit date on the item (e.g. the expiry printed on the certificate,
 * or an earlier date set by an EICR) beats the calculated one.
 */
export function dueDate(item, rule) {
  if (item.expires) return item.expires;
  if (item.next_due) return item.next_due;
  if (!item.last_done) return null;
  return addInterval(item.last_done, rule.interval);
}
