#!/usr/bin/env node
// Prints the sample Monday report from synthetic data. Usage: node scripts/weekly-report.mjs [YYYY-MM-DD]
import { readFileSync } from "node:fs";
import { buildReport, renderText, escalationLevel, recipients, LEVEL } from "../src/rules/index.js";

const read = p => JSON.parse(readFileSync(new URL(p, import.meta.url)));
const config = read("../config/rules.json");
const { services, head_office, today: sampleToday } = read("../data/sample/services.json");
const items = read("../data/sample/items.json");
const today = process.argv[2] || sampleToday;

const report = buildReport(config, services, items, today);
console.log(renderText(report, services));

console.log("\nESCALATIONS THAT WOULD BE SENT TODAY");
for (const r of report.rows) {
  const level = escalationLevel(r, r.rule);
  if (level < LEVEL.SERVICE_MANAGER) continue;
  const svc = services.find(s => s.id === r.item.service);
  const who = recipients(level, svc, head_office).map(p => p.name).join(", ");
  console.log(`  ${svc.name} – ${r.rule.label}: level ${Object.keys(LEVEL).find(k => LEVEL[k] === level)} → ${who}`);
}
