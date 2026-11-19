#!/usr/bin/env node
// Lists docs, skills, memory files and rules that are past their review date.
// Front matter fields used: last_reviewed (YYYY-MM-DD) and review_every_days.
// Exit code is 0 (warn only) unless --strict is passed.
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const root = new URL("..", import.meta.url).pathname;
const today = process.argv.find(a => /^\d{4}-\d{2}-\d{2}$/.test(a)) || new Date().toISOString().slice(0, 10);
const strict = process.argv.includes("--strict");
const days = (a, b) => Math.round((Date.parse(b) - Date.parse(a)) / 86400000);

function walk(dir) {
  return readdirSync(dir).flatMap(f => {
    const p = join(dir, f);
    if (f === "node_modules" || f === ".git") return [];
    return statSync(p).isDirectory() ? walk(p) : p.endsWith(".md") ? [p] : [];
  });
}

const stale = [];
for (const file of ["docs", "memory", ".claude/skills"].flatMap(d => walk(join(root, d)))) {
  const fm = /^---\n([\s\S]*?)\n---/.exec(readFileSync(file, "utf8"));
  if (!fm) continue;
  const last = /last_reviewed:\s*(\S+)/.exec(fm[1])?.[1];
  const every = +(/review_every_days:\s*(\d+)/.exec(fm[1])?.[1] || 0);
  if (last && every && days(last, today) > every) stale.push(`${file.replace(root, "")}: last reviewed ${last} (every ${every} days)`);
}

const cfg = JSON.parse(readFileSync(join(root, "config/rules.json")));
for (const r of cfg.rules) {
  if (days(r.last_checked, today) > cfg.review_every_days) stale.push(`rule ${r.key}: source last checked ${r.last_checked}`);
}
const unverified = cfg.rules.filter(r => r.status !== "VERIFIED").length;

console.log(`Freshness check for ${today}`);
console.log(stale.length ? stale.map(s => "  ⚠ " + s).join("\n") : "  ✓ nothing overdue for review");
console.log(`  ${unverified} of ${cfg.rules.length} compliance rules are still UNVERIFIED`);
if (strict && stale.length) process.exit(1);
