#!/usr/bin/env node
// Writes config/rules.json as CSV for import into the SharePoint "TrackerTypes" list.
// Usage: node scripts/export-tracker-types.mjs > tracker-types.csv   (the .csv is git-ignored)
import { readFileSync } from "node:fs";
const cfg = JSON.parse(readFileSync(new URL("../config/rules.json", import.meta.url)));
const cols = ["Title", "Key", "Category", "Kind", "IntervalN", "IntervalUnit", "AmberDays", "GraceDays", "EscalateManagerDays", "EscalateHeadOfficeDays", "Basis", "LegalRef", "SourceUrl", "DutyHolder", "Status", "LastChecked"];
const cap = s => s[0].toUpperCase() + s.slice(1);
const q = v => `"${String(v ?? "").replace(/"/g, '""')}"`;
console.log(cols.join(","));
for (const r of cfg.rules) {
  const d = { ...cfg.defaults, ...r };
  console.log([r.label, r.key, r.category, cap(r.kind), r.interval.n, cap(r.interval.unit) + "s", d.amber_days, r.kind === "recurring" ? d.grace_days : 0,
    d.escalate_manager_days, d.escalate_head_office_days, cap(r.basis), r.legal_ref, r.source_url, r.duty_holder,
    r.status === "VERIFIED" ? "Verified" : "Unverified", r.last_checked].map(q).join(","));
}
