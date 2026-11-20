---
name: rag-rules-and-reporting
description: Use when changing how items are rated Red/Amber/Green, the forward look, drill-down, the Monday weekly report or a daily summary, or the rules engine in src/rules.
last_reviewed: 2026-11-20
review_every_days: 60
---

# RAG rules and reporting

## What Mark asked for (keep this in front of you)

- Monday report, without asking: out of date, coming out of date, in date. Maybe a daily update.
- RAG; tell him the reds and **what is likely to break**.
- Click a number → the actions, owner, next step ("Zara meeting on X date").
- Forward look: 1, 2, 3 weeks, 90 days, plus the position now.
- Ability to manage: challenge priority.

## Where things live

| File | Job |
|---|---|
| `config/rules.json` | Per item type: kind, interval, amber/grace windows, escalation days, basis, source |
| `src/rules/dates.js` | UTC calendar-day maths; month/year add clamps to month end |
| `src/rules/schedule.js` | `dueDate(item, rule)`: explicit `expires`/`next_due` wins over calculated |
| `src/rules/rag.js` | `rag(item, rule, today)` → `{status, due, daysOverdue, reason}`; `isManaged(item)` |
| `src/rules/report.js` | `buildReport` (totals, byService, reds sorted unmanaged-first, forward buckets, changes) and `renderText` |
| `scripts/weekly-report.mjs` | Sample report from synthetic data |

## Platform (20 Nov 2026)

The live app is Power Apps + Power Automate on SharePoint (`docs/POWER_PLATFORM_DESIGN.md`). RAG is written to each item nightly by a flow; the app shows a Power Fx copy of the same formula. Any change here must be made in **three** places and kept identical: `src/rules/` (with tests), the RAG refresh flow, and the Power Fx formula. Update `docs/RAG_ACCEPTANCE_SCENARIOS.md` and re-run the scenarios in the test lists.

## Invariants (tests enforce these; keep them)

1. **Not recorded is never green.**
2. N/A items are excluded from totals.
3. Reds without an owner and dated next step are listed first ("reds without a plan").
4. The report says rules are UNVERIFIED until signed off.
5. Logic is pure: no I/O, no `Date.now()` inside `src/rules` (pass `today` in). This keeps it testable and portable (ADR-0001).
6. `docs/COMPLIANCE_RULES.md` table matches `config/rules.json`.

## Changing behaviour

1. Write or change the test first in `tests/rules.test.js`, using synthetic data only.
2. Change the code/config. Run `npm test` and `npm run report` and read the output as Mark would.
3. If a rule value changed, `npm run rules:doc`.
4. Note the change in `memory/decisions.md`; if it changes meaning for users, update `docs/BRD.md`.

## Report writing style

- Plain English, short lines, service name first, then item, then reason ("Service B – Gas safety record: expired 12 days ago").
- Lead with what needs Mark's attention; greens are a count, not a list.
- Always show owner and next step or "none recorded".
- Show the basis (legal / guidance / policy) next to reds, so priority is clear.
- British date format in user-facing output once the UI is built (e.g. "Mon 30 Nov"); ISO in data.
