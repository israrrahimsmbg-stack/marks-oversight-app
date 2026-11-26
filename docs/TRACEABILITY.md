---
title: QA app traceability (every ask, where it is met)
status: DRAFT v0.2, checked 26 Nov 2026
owner: Zakir Hussain
last_reviewed: 2026-11-26
review_every_days: 14
---

# QA app traceability

This table lists each requirement found in the sources and shows where the QA app preview meets it. The sources are:

- Mark catch-up, 18 Nov
- Yasmin and Hamida catch-up, 19 Nov
- BRD draft v0.1
- Elicitation questionnaire
- Mark's emails of 24 Nov and 25 Nov
- Hamida and Zara call, 25 Nov
- Hall Close Audits 2026 trackers
- QA App execution plan

Status key:

- **Built**: was in the first preview.
- **Fixed 26 Nov**: was missing or only partly there, and was added in this change.
- **Partly**: works in the preview, but part of it needs the live Microsoft 365 build or a decision.
- **Open**: waits on an answer (see ELICITATION section Q).

Nothing here is legal advice. All timings are UNVERIFIED until Hamida signs them off.

## Mark, 18 Nov (catch-up)

| # | Ask | Status | Where |
|---|---|---|---|
| M1 | "I don't want to be searching, I want it to tell me": daily and weekly updates | Built | Daily digest per person (Alerts), Monday report |
| M2 | Every Monday: what's out of date, coming out of date and in date | **Fixed 26 Nov** | The Monday report now has three parts for each home: out of date (checks plus certificates and care records), coming up in the next 7 days, and an "in date" count |
| M3 | Click a number and see the actions behind it, who is doing what, and the next step ("Zakir is meeting Zara") | **Fixed 26 Nov** | Every action now has a **Next step** and a **Next step by** date. They show in the action lists, the report, the review pack and the "No next step" tab. Report tiles link through to the detail |
| M4 | RAG: what's red, and what's likely to break | **Fixed 26 Nov** | Each home in the report now has a Red / Amber / Green status [UNVERIFIED]. Register items use the rules-engine RAG |
| M5 | Forward look: next week, 2 weeks, 3 weeks and 90 days | **Fixed 26 Nov** | The forward look offers 7, 14, 21, 30 and 90 days, and now includes certificate expiries and care record reviews as well as checks and actions |
| M6 | Manage from it: "why isn't this a priority?" | **Fixed 26 Nov** | Head office can **Make this a priority** on an action, with a reason and a date. The action goes to High priority and is noted in its history. Its owner and the service manager are alerted the next day, and it sits at the top of lists and the report |
| M7 | Covers everything: finance, voids and the like | Partly | The QA app covers compliance and QA, and Mark agreed QA is "slightly separate". Voids, fees and housing benefit stay in the Operations app (BR-12, phase 3) |

## Yasmin and Hamida, 19 Nov

| # | Ask | Status | Where |
|---|---|---|---|
| Y1 | Fire drill weekly, fire exits every two weeks | Built | Fire & certificates (`fire_drill`, `fire_exit_check` in config/rules.json) |
| Y2 | Medication audit: our own record, even though PCS holds the MAR | Built | Medication module (8-area weekly audit, then monthly, then quarterly) |
| Y3 | Support plans, risk assessments, reviews, support and funding packages up to date | **Fixed 26 Nov** | New **Care records & reviews** module (wave 2), rated per resident reference by the rules engine: support plans, risk assessments, the council care review, the funding package and DoLS / Court of Protection. These rules already existed in config/rules.json but no screen used them |
| Y4 | Head office notified when something is outstanding; the manager chases; head office is the last resort | Built | Alert ladder: owner, then line manager, then service manager, then head office at escalation |
| Y5 | Support workers are never notified | Built | Tested in `tests/qa.test.js` |
| Y6 | "Click, click, click" for the service manager, deputy and team leader | Built | To-do list, three-button answers, phone layout |
| Y7 | Same trackers in every house | Built | One check library for all homes (config/qa-modules.json) |

## BRD v0.1

| ID | Requirement | Status | Where |
|---|---|---|---|
| BR-01 | Monday report: overdue / due soon / in date | **Fixed 26 Nov** | See M2 |
| BR-02 | Daily summary of exceptions | Built | Daily digest; head office copied (setting) |
| BR-03 | RAG for every item | **Fixed 26 Nov** | See M4 |
| BR-04 | Drill-down to items, owner, due date, action and next step | **Fixed 26 Nov** | See M3 |
| BR-05 | Every outstanding item has an owner, action and next step, with history | **Fixed 26 Nov** | Next step field, "No owner" and "No next step" flags, and an append-only history. This matches `isManaged` in src/rules |
| BR-06 | Forward look at 7, 14, 21, 30 and 90 days | **Fixed 26 Nov** | See M5 |
| BR-07 | Tracker forms per service, the same template everywhere | Built | Check forms; care records added |
| BR-08 | Escalation after X and Y days | Built | Admin › Alert rules (per level) |
| BR-09 | Head office sees all homes; home staff see their own | Built | Access matrix and home scope |
| BR-10 | Few clicks for managers | Built | |
| BR-11 | Import existing Excel and SharePoint data | Partly | The live build's nightly sync reads the Excel tables. The preview now has a **Tracker files** register (Admin › Homes & modules) with fixed paths, last sync time and a stray-copy flag. The preview cannot read SharePoint itself |
| BR-12 | Same pattern for finance and voids | Open | Phase 3, Operations app |

## Elicitation questionnaire (answers now known)

| Q | Topic | Status |
|---|---|---|
| B2 | Format and time: email on Monday at 07:00 | Built (email text, print, settings) |
| B4 | Who gets the report: head office | Built (capability "Receive the Monday report") |
| B9 | Assign or reprioritise inside the app | **Fixed 26 Nov** (see M6) |
| C8 | Evidence | Partly: an evidence reference and comment are required to complete or sign off. The live build stores files in SharePoint |
| D3 | Channel: email | Built (digest). Teams is not used |
| D4 | Manager on leave: a delegate | Built |
| D5 | Reminder frequency | Built (per level; daily for 999 items) |
| E3 | Microsoft sign-in | Live build only (ADR-0007, ADR-0010) |
| E4 | Who administers: Mark, Nafisa, Hamida, Zara | **Fixed 26 Nov** (see E2 below) |
| E5 | Phone or PC | Built (works at phone width) |
| G3 | GDPR: references, not names | Built (resident and staff references only; refs hidden from roles without "See resident and staff references") |

## Mark's emails, 24 and 25 Nov

| # | Ask | Status | Where |
|---|---|---|---|
| E1 | Rollout home by home in his order, Hall Close first | Built | Homes & rollout; status per home; shadow mode |
| E2 | Only Mark, Nafisa, Hamida and Zara can edit | **Fixed 26 Nov** | The capabilities said otherwise: Zara and Nafisa's roles could not change settings. Switching homes and modules, people and roles, the access matrix and alert timings are now limited to those four roles plus the system admin |
| E3 | Alerts to manager, deputy, team leaders, Mark, Nafisa and Hamida, nearly due and overdue, repeating until done | **Fixed 26 Nov** | Checks were already alerted. **Certificates, fire log items and care records were not alerted at all**: they only showed on screens. They now raise heads-ups (30, 14, 7 and 1 days before) and outstanding alerts (daily for 999 items), escalating at 14 days |
| E4 | Monday report by home: deficits, overdue actions, actions due in 7 days | Built | |
| E5 | Staff keep using the SharePoint trackers, and the app reads them | Partly | Live build only. The preview shows the register of tracker files |
| E6 | One tracker per home, no copies | **Fixed 26 Nov** | Tracker files register with a stray-copy flag (demo: Hall Close medication) |
| E7 | Monthly review days from January, two homes a month | **Fixed 26 Nov** | **Review pack** button on each home: one page with RAG, module by module, not done, out of date, deficits and open actions with next steps. It can be printed or downloaded |
| E8 | QA app announced to staff | Built | Help page and "How it works" |

## Hamida and Zara call, 25 Nov

| # | Ask | Status | Where |
|---|---|---|---|
| H1 | Alert only when a check is not done; "Not met" is a deficit | Built | Tested |
| H2 | Ladder: team leader weekly, deputy monthly, manager quarterly; each depends on the one below | Built | Tested; "Waiting on earlier checks" |
| H3 | Pending on the due day, Outstanding from 1 day late | Built | Tested |
| H4 | Blank templates never count (Hall Close, Week 4) | Built | Tested; "Blank form submitted" flag |
| H5 | MCA, best-interest and financial support plan on file | Built | Finance capacity register |
| H6 | Action statuses (6) and mid-point update | Built | |
| H7 | 999 priority; infection control softer | Built | Tested |
| H8 | Monthly QA audit: actions only | Built | QA audit actions module |
| H9 | Hall Close recipients: one team leader, the deputy, the manager; no deputy at Hermitage; Effingham has two team leaders | Built | Seed data, with invented names. The owner falls back up the ladder |
| H10 | IronOak H&S on the app (Zara would rather not) | Built, **Mark to decide** | Can be switched off per home |
| Z1 | Maintenance tracker every Friday, reviewed fortnightly | Built | Friday update check plus repairs register |
| Z2 | Managers need to see the comment history | **Fixed 26 Nov** | Each repair has a **History** button with an append-only comment log, status changes and the latest update shown in the table |
| Z3 | Occupancy: the finance team's tracker is the master; Monday and Friday updates; initials only | Built | Occupancy module and onboarding documents (head office only) |

## Hall Close trackers (Audits 2026)

| Tracker | Status |
|---|---|
| Finance: 18 weekly checks, then monthly, then quarterly | Built (questions in config) |
| Medication: 8 areas, about 14 questions | Built |
| Health & Safety (IronOak): 19 checks, CO alarm left blank | Built (seed story) |
| Infection control (Word form today) | Built (quarterly) |
| Maintenance (issue log) | Built, plus history |
| Occupancy | Built |
| Supervision & training (not finished) | Built as a draft |

## Execution plan (25 Nov)

| Item | Status |
|---|---|
| Waves 1 to 3, shadow mode for 1 week, one home a week | Built |
| Data model (Homes, TrackerRegistry, CheckInstances, Actions, Recipients, AlertLog) | Built in the preview; lists in QA_APP.md section 7 |
| Head office copied from the first alert or only on escalation | Open (setting exists; Q1) |
| Shared mailbox and SharePoint site from IT | Open (IT) |

## Still open after this change

1. **Live data:** the preview runs on invented data. Reading the real trackers needs the Microsoft 365 build (sync flow) and IT's shared mailbox.
2. **Evidence files:** the preview stores an evidence reference. Uploading files needs SharePoint.
3. **Finance, voids and fees report** (BR-12) stays with the Operations app.
4. **RAG definition** for a home (red, amber, green) is a proposal for Mark to confirm (ELICITATION Q9).
5. **Care records source:** whether review dates come from a new per-home tracker or from the occupancy tracker (ELICITATION Q10).
