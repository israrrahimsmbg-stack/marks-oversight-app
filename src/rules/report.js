import { rag, RAG, withDefaults, isManaged } from "./rag.js";

export const HORIZONS = [7, 14, 30, 90];

/** Evaluate every item against its rule. */
export function evaluate({ rules, defaults }, items, today) {
  const byKey = Object.fromEntries(rules.map(r => [r.key, withDefaults(r, defaults)]));
  return items.map(item => {
    const rule = byKey[item.type];
    if (!rule) throw new Error(`No rule for tracker type "${item.type}"`);
    return { item, rule, ...rag(item, rule, today), managed: isManaged(item) };
  });
}

export function buildReport(config, services, items, today, previous = null) {
  const rows = evaluate(config, items, today);
  const count = list => ({
    RED: list.filter(r => r.status === RAG.RED).length,
    AMBER: list.filter(r => r.status === RAG.AMBER).length,
    GREEN: list.filter(r => r.status === RAG.GREEN).length,
    NOT_RECORDED: list.filter(r => r.status === RAG.NOT_RECORDED).length,
  });

  const byService = services.map(s => ({ service: s, ...count(rows.filter(r => r.item.service === s.id)) }));

  const reds = rows
    .filter(r => r.status === RAG.RED || r.status === RAG.NOT_RECORDED)
    .sort((a, b) => Number(a.managed) - Number(b.managed) || (b.daysOverdue ?? 1e9) - (a.daysOverdue ?? 1e9));

  const forward = {};
  for (const r of rows) {
    if (r.daysOverdue == null || r.daysOverdue > 0) continue;
    const inDays = -r.daysOverdue;
    const cat = r.rule.category;
    forward[cat] ||= Object.fromEntries(HORIZONS.map(h => [h, 0]));
    for (const h of HORIZONS) if (inDays <= h) forward[cat][h]++;
  }

  let changes = null;
  if (previous) {
    const key = r => `${r.item.service}:${r.item.type}:${r.item.ref || ""}`;
    const prevRed = new Set(previous.filter(p => p.status === RAG.RED).map(p => p.key));
    const nowRed = new Set(rows.filter(r => r.status === RAG.RED).map(key));
    changes = {
      newReds: [...nowRed].filter(k => !prevRed.has(k)).length,
      closedReds: [...prevRed].filter(k => !nowRed.has(k)).length,
    };
  }

  return { today, totals: count(rows), byService, reds, unmanaged: reds.filter(r => !r.managed), forward, changes, rows };
}

/** Plain-text rendering for email body / console. */
export function renderText(report, services) {
  const name = id => services.find(s => s.id === id)?.name || id;
  const t = report.totals;
  const L = [];
  L.push(`SOUTH – WEEKLY OVERSIGHT REPORT · ${report.today}`);
  L.push(`Overall: RED ${t.RED} · AMBER ${t.AMBER} · GREEN ${t.GREEN} · NOT RECORDED ${t.NOT_RECORDED}`);
  if (report.changes) L.push(`Since last week: ${report.changes.newReds} new reds, ${report.changes.closedReds} reds closed`);
  L.push("");
  L.push(`REDS WITHOUT A PLAN (${report.unmanaged.length}) – no owner or dated next step`);
  for (const r of report.unmanaged) L.push(`  • ${name(r.item.service)} – ${r.rule.label}: ${r.reason}`);
  L.push("");
  L.push(`ALL REDS AND NOT RECORDED (${report.reds.length})`);
  report.reds.forEach((r, i) => {
    const a = (r.item.actions || []).find(x => x.status !== "closed");
    L.push(`  ${i + 1}. ${name(r.item.service)} – ${r.rule.label}: ${r.reason} [${r.rule.basis}]`);
    L.push(`     Owner: ${a?.owner || "none"} · Next step: ${a ? `${a.next_step} (${a.next_step_date})` : "none recorded"}`);
  });
  L.push("");
  L.push("BY SERVICE              R   A   G   ?");
  for (const s of report.byService) L.push(`  ${s.service.name.padEnd(20)} ${String(s.RED).padStart(2)}  ${String(s.AMBER).padStart(2)}  ${String(s.GREEN).padStart(2)}  ${String(s.NOT_RECORDED).padStart(2)}`);
  L.push("");
  L.push("COMING UP               7d  14d  30d  90d");
  for (const [cat, b] of Object.entries(report.forward)) L.push(`  ${cat.padEnd(20)} ${[7, 14, 30, 90].map(h => String(b[h]).padStart(3)).join("  ")}`);
  L.push("");
  L.push("Rules are DRAFT and UNVERIFIED until signed off (docs/COMPLIANCE_RULES.md).");
  return L.join("\n");
}
