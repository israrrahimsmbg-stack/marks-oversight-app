---
title: Delivery plan
status: DRAFT v0.1
owner: Zakir Hussain (BA/dev)
last_reviewed: 2026-11-19
review_every_days: 14
---

# Delivery plan: Mark's App

## 1. How I'd approach it (the short version)

1. **Report first, tracker second.** Mark's pain is visibility. The fastest way to show value is a Monday report built from data we already hold in the Operations app, then add the manager tracker that feeds it better data. This matches Yasmin's "one stage at a time".
2. **Rules before screens.** The heart of the app is a small set of rules: when is an item Red, Amber or Green; when is it next due; who gets told when it slips. We write those as plain, tested code with every rule traceable to a source, and get Hamida to sign them off. Screens and emails then just show the result.
3. **Every red has an owner and a next action.** Mark said it plainly: "I don't need to know there's 13. I need to know the actions behind it." So the data model is built around the *action*, not just the expiry date.
4. **Managers own it, head office is the last resort.** Escalation goes service manager, then (after a grace period) Mark and Hamida. Support workers are never notified.
5. **Show Mark early, every week.** A clickable prototype of the Monday report in front of Mark on Tue 24 Nov beats a perfect spec.

## 2. Phases and milestones

Dates after 24 Nov are targets, to be confirmed with Yasmin on Fri 20 Nov.

| Phase | What | Exit criteria | Target |
|---|---|---|---|
| **0** | Finish Esto Care Operations app. Zara/Hamida validate compliance data, Jawad validates finance. Demo to Abi Mon 23 Nov, live Tue 24 Nov. | Data signed off, app live | **Tue 24 Nov 2026** |
| **1a: Discovery** | Run the elicitation questionnaire with Mark, Yasmin, Hamida. Collect Hamida's trackers for one house (the Grange) and Mark's QA documents. Agree RAG rules and escalation thresholds. | BRD v1.0 signed by Mark; COMPLIANCE_RULES signed by Hamida | w/c 23 Nov – 4 Dec |
| **1b: Monday report (compliance)** | Weekly report from Operations app compliance data: RAG summary per service, forward look 7/14/30/90, drill-down to owner + next action. Delivered by email Monday morning and as an in-app view. | Mark receives 2 consecutive Monday reports and can answer "what's going on" for any red | Mon 14 Dec |
| **1c: Actions and ownership** | Every non-green item gets owner, next action, due date, status, history. Mark can comment / challenge priority. | Zero reds without owner and next action | early Jan 2027 |
| **2: Manager tracker** | Same template for every house: weekly fire log, fortnightly fire exit check, medication audit, certificates, occupancy, QA audit with actions, support plans, risk assessments, reviews, funding packages. Overdue alerts with the escalation ladder. Mobile-friendly. | Pilot at the Grange for 4 weeks, then roll out across the South | Jan – Feb 2027 |
| **3: Wider reporting** | Extend the report to finance, voids, hospital clients, housing benefit; daily exceptions summary; QA automation per service; North (if asked). | TBC | Mar 2027 + |

## 3. What Mark's Monday report will look like (first cut, to react to)

Run `npm run report` to see this generated from synthetic data.

```
SOUTH – WEEKLY OVERSIGHT REPORT  ·  Monday 30 Nov 2026
Overall:  RED 6   AMBER 9   GREEN 112   NOT RECORDED 3

TOP REDS (needs your attention)
1. Service B – Gas safety certificate expired 12 days ago
   Owner: Service manager B · Next action: Landlord booked engineer 2 Dec
2. Service A – Weekly fire log not updated for 15 days (escalated to head office)
   Owner: Service manager A · Next action: none recorded  ← no plan
...
BY SERVICE                 R   A   G   ?
  Service A                2   1  20   0
  ...
COMING UP                  7d  14d  30d  90d
  Certificates              1    2    4    9
  Reviews / plans           0    3    5   12
CHANGES SINCE LAST WEEK:  3 reds closed, 2 new reds
```

Each line is a link to the item: owner, next action and date, full history.

## 4. Architecture recommendation

### What exists today (checked, not guessed)

The repo `israrrahimsmbg-stack/esto-care-operations` is a **single-page vanilla JavaScript app published as a Claude artifact**, built by `tools/build.py` into one `index.html`, using the artifact's **shared database** (collections such as `homes`, `units`, `activity`, `appusers`, `authaudit`). It has its own sign-in (PBKDF2 hashed passwords), five roles (super-admin, director, home-manager, contributor, viewer), per-home scoping and an activity log. It already has a compliance section with per-home checks and an "overdue / due within 30 days" state. Details in [`ESTOCARE_OPS_APP.md`](ESTOCARE_OPS_APP.md). **ZACK to confirm this is the version going live on 24 Nov.**

### Options

| | A. Extend the Operations app (recommended for Phase 1) | B. Microsoft 365 low-code (SharePoint Lists + Power Apps + Power Automate) | C. Custom web app (e.g. Next.js + PostgreSQL + Entra ID sign-in) |
|---|---|---|---|
| Speed to Mark's first report | Fastest: data, roles and homes already there | Medium: rebuild data in Lists | Slowest |
| Scheduled Monday email | Needs a scheduler outside the page (see below) | Native (Power Automate recurrence + Outlook) | Native (job queue + Microsoft Graph sendMail) |
| Sign-in | App's own accounts | Company Microsoft accounts (Entra ID) | Entra ID via MSAL |
| Audit trail | App activity log | SharePoint version history | Full, database-level |
| Fits company IT | Unknown: needs IT/DPIA view | Probably best (they already use Teams, SharePoint, Excel) | Needs hosting approval |
| Long-term scale | Limited (single page, shared db) | Good for this size | Best |

**Recommendation:**

- **Phase 1: Option A.** Build the report as a new "Oversight" section of the Operations app so Mark sees one system, using the same homes, roles and compliance data. Put all logic in the portable rules engine in this repo (`src/rules/`), so nothing is lost if we move.
- **Monday email for Phase 1:** a scheduled job runs the rules engine over the latest data and sends the result through the company Microsoft 365 mailbox. Two ways to do it, to decide with Yasmin/IT: a scheduled Claude routine that reads the app's database and sends via the Microsoft 365 connector, or Power Automate if the data is mirrored to SharePoint. The report content is always produced by the deterministic rules engine, never written freehand.
- **Decide the long-term platform (A vs B vs C) by end of Phase 1**, once we know IT's hosting rules, whether managers must sign in with Microsoft accounts, and what the DPIA says. Recorded as ADR-0001 (proposed) and ADR-0002 (open) in [`DECISIONS.md`](DECISIONS.md).

### Core data model (draft, platform-neutral)

```
Service (home)        id, name, region, kind, manager, deputy, team leaders, landlord
TrackerType           key, label, category, basis (legal | guidance | policy), frequency or validity,
                      amber window, escalation thresholds, owner role, source, verified_by/at
TrackerItem           service, type, last_done, expires_or_next_due, status, evidence ref, updated_at, updated_by
Action                item, owner, description, next_step, next_step_date, status, created/closed
Update (audit trail)  who, when, what changed, old → new   (append-only)
Escalation            item, level (manager | head office), sent_at, channel, acknowledged_at
```

### Rules engine (this repo, already started)

- `rag.js`: item → Red / Amber / Green / Not recorded, with the reason in plain English.
- `schedule.js`: next due date from last done + frequency (weekly, fortnightly, monthly, 6-monthly, annual, n-yearly).
- `escalation.js`: given an item and today, who should be notified (never support workers).
- `report.js`: summary, top reds, by-service table, forward look buckets.
- All rules come from `config/rules.json`, which mirrors `docs/COMPLIANCE_RULES.md`.

## 5. Risks and mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Scope creep ("I want this, I want that") | High | High | Phases with sign-off; change requests logged in DECISIONS |
| Unclear whether Mark wants one app or two | High | Medium | Ask directly (ELICITATION A3); design so the tracker feeds the report either way |
| Wrong or out-of-date legal rule shown as fact | Medium | High | Source + date + sign-off for every rule; `check:freshness` flags rules over 180 days old |
| Managers don't update the tracker, so the report is wrong | High | High | "Not recorded" shown as its own status, never as green; tracker must be quicker than Excel; escalation |
| Personal data in the wrong place (GDPR) | Medium | High | No resident data in this app; DPIA before go-live; role-based access |
| Hamida's trackers still changing | High | Medium | Configurable tracker types; pilot with the Grange set first |
| Single developer (key-person risk) | High | High | Everything documented here; memory and skills kept current |
| Email delivery depends on a scheduled job outside the app | Medium | Medium | Monitor that the report was sent; fallback in-app view |
| Hosting / IT approval delays | Medium | Medium | Ask early (ELICITATION G4) |

## 6. Next 10 working days

| When | What | Who |
|---|---|---|
| Thu 19 – Fri 20 Nov | Validation of Operations app data | Zara, Hamida, Jawad |
| Fri 20 Nov 2–3pm | Scope meeting: confirm phasing, go through ELICITATION F and A | Yasmin, Zakir |
| Mon 23 Nov | Demo to Abi | Yasmin, Zakir |
| Tue 24 Nov | Go live; meeting with Mark: show the sample Monday report, ask ELICITATION A and B | Mark, Yasmin, Zakir |
| w/c 23 Nov | Receive and review Grange trackers (Hamida) and QA documents (Mark) | Zakir |
| by Fri 27 Nov | Draft COMPLIANCE_RULES review with Hamida; BRD v0.2 | Zakir, Hamida |
| w/c 30 Nov | Build report prototype on live compliance data | Zakir |
