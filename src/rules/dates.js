// Date helpers. All dates are ISO "YYYY-MM-DD" strings handled as UTC calendar days,
// so results do not shift with the server's time zone or with British Summer Time.

const DAY = 86400000;

export function toDay(iso) {
  if (!iso) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!m) throw new Error(`Not an ISO date: ${iso}`);
  return Date.UTC(+m[1], +m[2] - 1, +m[3]);
}

export function fromDay(ms) {
  return new Date(ms).toISOString().slice(0, 10);
}

/** Whole days from a to b (b - a). Positive when b is later. */
export function daysBetween(a, b) {
  return Math.round((toDay(b) - toDay(a)) / DAY);
}

export function addDays(iso, n) {
  return fromDay(toDay(iso) + n * DAY);
}

/** Add a {unit, n} interval. Months clamp to the end of the month (31 Jan + 1 month = 28/29 Feb). */
export function addInterval(iso, interval) {
  if (!iso) return null;
  const { unit, n } = interval;
  if (unit === "day") return addDays(iso, n);
  if (unit === "week") return addDays(iso, 7 * n);
  if (unit === "month" || unit === "year") {
    const months = unit === "year" ? 12 * n : n;
    const d = new Date(toDay(iso));
    const y = d.getUTCFullYear(), m = d.getUTCMonth() + months, day = d.getUTCDate();
    const last = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
    return fromDay(Date.UTC(y, m, Math.min(day, last)));
  }
  throw new Error(`Unknown interval unit: ${unit}`);
}
