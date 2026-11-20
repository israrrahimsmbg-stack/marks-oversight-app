---
title: RAG and escalation acceptance scenarios
last_reviewed: 2026-11-20
review_every_days: 60
---

# Acceptance scenarios

These come from `tests/rules.test.js` (the reference implementation). The Power Automate RAG refresh flow and the Power Fx formula must give the **same answer** for every row. Test in a copy of the lists with "today" fixed to the date shown. Defaults: amber/grace per `config/rules.json`; escalation 7 / 14 days.

| ID | Tracker type | Item data | Today | Expected status | Expected reason / level |
|---|---|---|---|---|---|
| S1 | Gas safety (certificate, amber 30) | ExpiresOn 2026-11-18 | 2026-11-30 | **Red** | Expired 12 days ago; level 2 (manager) |
| S2 | Gas safety | ExpiresOn 2026-12-20 | 2026-11-30 | **Amber** | Expires in 20 days |
| S3 | Gas safety | ExpiresOn 2027-06-01 | 2026-11-30 | **Green** | In date |
| S4 | Gas safety | ExpiresOn 2026-11-30 | 2026-11-30 | **Amber** | Expires today |
| S5 | Fire risk assessment | no dates | 2026-11-30 | **Not recorded** (never Green) | Level 2 (manager) |
| S6 | LOLER hoist | NotApplicable = Yes | 2026-11-30 | **N/A** | Excluded from totals |
| S7 | Weekly fire alarm test (7 days, amber 2, grace 1) | LastDone 2026-11-23 | 2026-11-30 | **Amber** | Due today |
| S8 | Weekly fire alarm test | LastDone 2026-11-22 | 2026-11-30 | **Amber** | Overdue 1 day, within grace; level 1 |
| S9 | Weekly fire alarm test | LastDone 2026-11-21 | 2026-11-30 | **Red** | Not done for 2 days past due; level 1 |
| S10 | Weekly fire alarm test | LastDone 2026-11-27 | 2026-11-30 | **Green** | Next due 2026-12-04 |
| S11 | Any monthly check | LastDone 2026-01-31 | — | DueDate **2026-02-28** | Month-end clamp |
| S12 | EICR (5 years) | LastDone 2025-01-01, ExpiresOn 2026-11-01 | 2026-11-30 | **Red** | The date on the certificate wins over the 5-year rule |
| S13 | Weekly fire alarm test | LastDone 2026-11-08 | 2026-11-30 | **Red** | 15 days past due; **level 3: manager, deputy, team leaders, Mark, Hamida** |
| S14 | Any | Overdue 7 days | — | — | Level 2: manager + deputy (not team leaders) |
| S15 | Any, manager on leave with delegate | Overdue 7 days | — | — | Delegate gets it instead of the manager |
| S16 | Any, level 2 last sent 3 days ago | still level 2 | — | — | **No** new email (repeat every 7 days) |
| S17 | Any, level 2 last sent yesterday | now level 3 | — | — | Send now (level went up) |
| S18 | Any service, any level | — | — | — | **Support workers never receive anything** |
| S19 | Red with open action (owner, next step, date) | — | — | — | Listed under "All reds", not under "Reds without a plan" |
