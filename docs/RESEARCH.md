---
title: Open-source research: libraries, tools and repos
last_reviewed: 2026-11-20
review_every_days: 90
---

# Research: what to build with

**Rule (ADR-0006):** nothing is installed until a feature needs it. Licences below were read from the npm registry on **19 Nov 2026** (version = latest at that date). Re-check before adding. Prefer MIT / Apache-2.0 / BSD / ISC. Treat AGPL, GPL, "Sustainable Use" or "source-available" licences as **needs a decision**, because the app is closed, commercial and may be hosted for staff.

## Installed now

| What | Why |
|---|---|
| *Nothing.* Node's built-in `node:test` runs the tests; the rules engine has no dependencies. | Requirements are not confirmed. A pure engine drops into the existing single-file Operations app build without a bundler. |

## Platform decided (20 Nov 2026)

**Power Apps + Power Automate on SharePoint Lists** (ADR-0002). Most of the JavaScript libraries below now apply only to the reference engine and scripts, or if the platform changes later. What matters now: [Power Platform CLI (`pac`)](https://learn.microsoft.com/power-platform/developer/cli/introduction) for solution source control, standard connectors only (SharePoint, Office 365 Outlook, Office 365 Users, Teams, Excel Online), and Microsoft's licensing guide. Licensing notes: [Microsoft Learn](https://learn.microsoft.com/power-platform/admin/pricing-billing-skus); 2027 enforcement and price change: [SAMexpert, 6 Oct 2026](https://samexpert.com/power-apps-2027-enforcement-price-increase/).

## Shortlist by need (reference engine / future options)

### Excel / CSV import (BR-11: Hamida's trackers, SharePoint exports)

| Library | Licence | Version | Notes | Verdict |
|---|---|---|---|---|
| [SheetJS CE](https://docs.sheetjs.com/) (`xlsx`) | Apache-2.0 | npm shows 0.18.5 (stale) | Reads almost any spreadsheet incl. old `.xls`. **Install from cdn.sheetjs.com, not the npm registry**, whose copy is old. | **First choice** when import is built |
| [ExcelJS](https://github.com/exceljs/exceljs) | MIT | 4.4.0 | Good for writing styled `.xlsx` (e.g. export of the Monday report). | Use for export if needed |
| [Papa Parse](https://www.papaparse.com/) | MIT | 5.7.1 | Fast CSV parsing in the browser. | If imports are CSV |
| [Zod](https://zod.dev/) | MIT | 4.6.7 | Validate each imported row and give managers clear error messages. | Pair with import |

### Dates, recurrence and UK time

| Library | Licence | Version | Notes | Verdict |
|---|---|---|---|---|
| Built-in (`src/rules/dates.js`) | — | — | UTC calendar-day maths; enough for due dates. | **Using now** |
| [Luxon](https://moment.github.io/luxon/) | MIT | 3.7.2 | `Europe/London` time zone for "send at 08:00 Monday" across BST. | When scheduling is built |
| [rrule](https://github.com/jkbrzt/rrule) | BSD-3-Clause | 2.8.1 | iCal recurrence rules ("every 2nd Tuesday"). | Only if trackers need complex patterns |
| [date-fns](https://date-fns.org/) | MIT | 4.4.0 | General date utilities. | Optional |

### Scheduled jobs (Monday report, daily digest, reminders)

| Option | Licence | Notes | Verdict |
|---|---|---|---|
| Scheduled Claude routine + Microsoft 365 mail connector | (service) | No server to run; can read the Operations app's database. Content must come from the rules engine. | Phase 1 candidate (ADR-0003) |
| Power Automate (recurrence trigger) | Microsoft 365 licence | Native if data is in SharePoint/Excel; IT already understands it. | Phase 1 candidate |
| [pg-boss](https://github.com/timgit/pg-boss) | MIT | 12.38.2 | Job queue + cron on PostgreSQL; no Redis. | If platform C |
| [Graphile Worker](https://worker.graphile.org/) | MIT | 0.18.0 | Same idea, very fast. | Alternative to pg-boss |
| [BullMQ](https://bullmq.io/) | MIT | 6.7.8 | Needs Redis. | Only if Redis is already there |
| [node-cron](https://github.com/node-cron/node-cron) | ISC | 4.6.0 | In-process cron; lost if the process restarts. | Not for statutory reminders |

### Notifications and email (BR-08)

| Option | Licence | Notes | Verdict |
|---|---|---|---|
| [Microsoft Graph JS client](https://github.com/microsoftgraph/msgraph-sdk-javascript) `sendMail` | MIT (3.1.0) | Sends from a company mailbox; Teams messages possible. | **Preferred** for a Microsoft 365 company |
| [MJML](https://mjml.io/) | MIT (5.4.1) | Email HTML that renders in Outlook. | For the report email layout |
| [React Email](https://react.email/) | MIT (1.0.12) | Alternative if the UI is React. | Platform C only |
| [Novu](https://github.com/novuhq/novu) | Core MIT; `enterprise/` folder commercial | Full notification platform (in-app inbox, digests, preferences). Heavy to self-host. | Overkill now; revisit if multi-channel grows |

### Sign-in and role-based access (BR-09)

| Option | Licence | Notes | Verdict |
|---|---|---|---|
| Operations app's own accounts and roles | — | Already has director / home-manager / contributor / viewer and per-home scope. | **Phase 1** |
| [MSAL](https://github.com/AzureAD/microsoft-authentication-library-for-js) (`@azure/msal-browser` 5.30.0, `@azure/msal-node` 7.2.3) | MIT | Sign in with company Microsoft accounts (Entra ID); leavers lose access automatically. | Strongly recommended for the long term |
| [CASL](https://casl.js.org/) (`@casl/ability` 7.1.3) | MIT | Readable permission rules ("manager can update items in own service"). | If permissions get complex |
| [Casbin](https://casbin.org/) (5.51.1) | Apache-2.0 | Policy-file RBAC/ABAC. | Alternative |

### Audit trail (BR-05, NFR-03; CQC Reg 17)

| Option | Licence | Notes |
|---|---|---|
| Append-only `updates` collection/table written by the app | — | Phase 1: simplest. Never update or delete rows. |
| PostgreSQL triggers into an audit table; [pgAudit](https://github.com/pgaudit/pgaudit) | PostgreSQL licence | Platform C. |
| SharePoint version history | Microsoft 365 | Platform B. |

### Dashboards and charts (BR-04, BR-06)

| Library | Licence | Version | Notes |
|---|---|---|---|
| Plain HTML tables + CSS RAG pills | — | — | **Phase 1**: Mark wants lists and owners, not fancy charts. |
| [Chart.js](https://www.chartjs.org/) | MIT | 4.6.1 | Simple trend lines (reds per week). |
| [Apache ECharts](https://echarts.apache.org/) | Apache-2.0 | 6.1.0 | Richer drill-down charts. |
| [Observable Plot](https://observablehq.com/plot/) | ISC | 0.6.19 | Concise charts. |
| [Tremor](https://www.tremor.so/) | Apache-2.0 | 3.18.7 | React dashboard components (platform C). |

### Accessible UI patterns (managers on phones; "click, click, click")

| Library | Licence | Version | Notes |
|---|---|---|---|
| [GOV.UK Frontend](https://github.com/alphagov/govuk-frontend) | MIT | 6.6.0 | Well-tested accessible forms and checklists; copy patterns, not branding. |
| [NHS.UK frontend](https://github.com/nhsuk/nhsuk-frontend) | MIT | 10.7.2 | Health-and-care style patterns familiar to care staff. **Do not use NHS branding.** |

### PDF of the Monday report (if Mark wants PDF, ELICITATION B2)

| Library | Licence | Version | Notes |
|---|---|---|---|
| [Playwright](https://playwright.dev/) print-to-PDF | Apache-2.0 | 1.65.1 | Exact copy of the HTML report. Also for end-to-end tests. |
| [pdfmake](http://pdfmake.org/) | MIT | 0.3.14 | PDF from data in the browser. |

### Whole platforms we considered and why not (for now)

| Platform | Licence | Why not now |
|---|---|---|
| [Appsmith](https://github.com/appsmithorg/appsmith) | Apache-2.0 (community) | Good internal-tool builder, but a second system for IT to host. Consider if ADR-0002 picks low-code outside Microsoft. |
| [Budibase](https://github.com/Budibase/budibase) | GPL-3.0 (server) | Licence needs a decision; hosting burden. |
| [NocoDB](https://github.com/nocodb/nocodb) | "Sustainable Use License" (not OSI open source) | Licence restricts use; avoid. |
| [Metabase](https://github.com/metabase/metabase), [Grafana](https://github.com/grafana/grafana) | AGPL-3.0 (open editions) | Great for dashboards, but AGPL and separate hosting; Mark needs actions and owners, not BI. |
| Commercial care compliance tools (e.g. those built into care management systems) | Commercial | Worth a quick look at what PCS already offers for audits before building Phase 2. **Ask Hamida.** |

## Claude skills worth using alongside this repo's own skills

These are already available in this Claude account (no install needed):

| Skill | Use for |
|---|---|
| `anthropic-skills:xlsx` | Reading Hamida's Excel trackers and producing Excel exports |
| `anthropic-skills:docx` | Producing BRD / questionnaire Word versions for Mark and Yasmin |
| `anthropic-skills:ba-spec-writer` | Writing user stories and acceptance criteria from the BRD |
| `operations:compliance-tracking`, `operations:risk-assessment` | Cross-checking compliance logic and the risk register |
| `ansvar-compliance-skills:dpia` | Drafting the DPIA (BR NFR-01) for the IG lead to review |
| `engineering:testing-strategy`, `engineering:system-design` | Platform decision (ADR-0002) |

The public [anthropics/skills](https://github.com/anthropics/skills) repo has the source for several of these. Check its licence file per skill before copying any into this repo; we reference them instead of vendoring.
