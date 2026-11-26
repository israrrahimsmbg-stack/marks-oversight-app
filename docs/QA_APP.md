---
title: QA & Compliance app (Mark's "QA App"): design, access and rollout
status: DRAFT v0.1, working preview built 26 Nov 2026
owner: Zakir Hussain
last_reviewed: 2026-11-26
review_every_days: 14
---

# QA & Compliance app

Mark's email of 25 Nov 2026 ("Updated QA process and schedules") announced a QA app that rolls out home by home: Hall Close, Pendragon, Effingham, Ragstone Road, Stoke Poges, Waxlow, Lambourne, Queenswood, Hermitage, Wansbeck A, Wansbeck H. Staff keep their SharePoint trackers; the app reads them, reports quickly and sends alerts when a check is nearly due or not done, repeating until it is done.

This document describes the working preview in `app/` and how each part maps onto the live Microsoft 365 build. It is not legal advice, and nothing here replaces the registered manager's or nominated individual's judgement.

## 1. Platform: what was chosen and why

| | Choice |
|---|---|
| **Preview (this PR)** | Built the same way as the Esto Care Operations app: one web page, vanilla JavaScript, no framework, `node app/build.mjs` inlines everything (like `tools/build.py` there), published as a Claude artifact. Same palette, fonts, rail menu, cards, modals and toasts, so the two apps feel like one product. Runs on invented data in the browser, with a "View as" switch instead of sign-in. |
| **Live** | IT requires company Microsoft sign-in (ADR-0007), which a Claude artifact cannot provide. The live build therefore stays on Microsoft 365 (ADR-0002): SharePoint lists, Power Automate flows and Power Apps (or the same web page hosted inside SharePoint) with standard connectors only. |
| **What stays the same** | The logic. `src/qa/` (schedule, status, alerts, access, Monday report) is pure, tested JavaScript and is the reference the flows must match (ADR-0008, ADR-0010). Every screen in the preview reads and writes data in the same shape as the SharePoint lists below. |

Why not just ship the artifact: it would break IT's sign-in rule, and the Operations app already has that open issue with IT. The preview lets Mark, Hamida and the managers click through every screen this week, before any SharePoint work.

## 2. How it works

1. **Trackers stay in Excel** on the HomesCentral drive, one per home per area, the same everywhere (Hall Close is the model). Each tracker's data range becomes a named Excel table, because Power Automate's Excel connector only reads tables.
2. **Nightly sync (02:00 UK):** a flow reads each registered tracker and writes one row per check into the `Checks` list. A check only counts as complete when every question is answered and "Audit submitted" is Yes. This ends the blank-template problem (Hall Close finance Week 4, 26 Oct 2026).
3. **Daily rules (07:00):** a flow works out each check's status (below) and sends **one digest email per person**.
4. **Monday report (07:00):** one email to head office, home by home: checks not done, deficits, overdue actions and actions due in the next 7 days.
5. **The app** is where people see their to-do list, answer checks (optional: the same questions as the tracker), manage actions and see the oversight screens.

## 3. Statuses (Hamida, 25 Nov 2026) [UNVERIFIED]

| Status | Meaning |
|---|---|
| Upcoming | Not due yet |
| Due soon | Inside the heads-up window (weekly 2 days, monthly 5, quarterly 10, infection control 14) |
| Due today ("Pending") | Due today, or inside a short grace period (infection control: up to 6 days late) |
| Outstanding | 1 day or more late and not fully done (infection control: 7 days) |
| Waiting on earlier checks | A monthly check whose four weekly checks are not all done; a quarterly whose three monthly checks are not done. Not alerted on its own: the lower checks are |
| Started | Some answers saved, not submitted. Still not done |
| On hold | Paused with a reason and review date (e.g. resident in hospital). No alerts until the review date |
| Completed | Every question answered and submitted. "Not met" answers are **deficits**, never overdue |
| Not applicable | With a reason |

Action statuses: Not started, In progress, Awaiting evidence, Awaiting sign-off, Completed, On hold. Flags: **Deadline required** (no target date), **No owner**, **Overdue**, **Due in 7 days**, **Update due** (mid-point between identified and target date; 14 days for QA actions). Completing needs evidence, and someone other than the owner (manager or head office) signs it off.

## 4. Alerts [UNVERIFIED]

| When | Who |
|---|---|
| Heads-up: when the window opens, and on the due day | The level's owner (team leader for weekly, deputy for monthly, service manager for quarterly) |
| Outstanding: from 1 day late (7 for infection control) | Owner + the next rung up the ladder; Mark, Nafisa and Hamida's roles copied from the first alert (Mark, 24 Nov). Module leads too (operations for H&S, maintenance, occupancy, fire) |
| Repeat | Every day for 999 items (finance, medication, H&S, fire & certificates); every 2 to 3 days for others; weekly for infection control |
| Escalated: 7 days late (14 for quarterly and infection control) | Everyone up the ladder to the service manager, plus director and compliance lead |
| Action overdue | Owner + service manager every 3 days; head office from 14 days |

Fixed rules: alerts only for checks **not done**; one digest per person per day; support workers are never notified (Mark, 18 Nov); a home with nobody in a role (e.g. Hermitage, no deputy) sends that level to the next rung up; staff on leave are replaced by their named delegate; **shadow mode** homes alert only the app builder and the compliance lead.

## 5. Modules and rollout

Every module is switched on per home. Homes move Not started > Setting up > Shadow mode (1 week) > Live.

| Wave | Module | Cadence and owner | Basis |
|---|---|---|---|
| 1 | Finance (999) | 18 weekly checks (team leader) > monthly roll-up after 4 weeks (deputy) > quarterly sign-off (service manager); plus a capacity & best-interest register per resident | Policy; supports CQC Reg 13 and 17; MCA 2005 |
| 1 | Medication (999) | 8-area weekly audit > monthly > quarterly; RAG green from 95% | Guidance (NICE NG67); frequency is policy |
| 1 | Health & Safety, IronOak (999) | 19 weekly landlord property checks | Legal duty (FSO 2005, Gas Safety Regs, HHSRS); checklist is policy. Zara prefers to chase it herself: **included at ZACK's request, Mark to decide** |
| 1 | Fire & certificates (999) | Fire log, drills, emergency lighting, gas, EICR, FRA and more, rated by `src/rules` from `config/rules.json` | Per item |
| 2 | Infection control | Quarterly, softer alerts | Legal (H&SC Act 2008 Code of Practice); frequency is policy |
| 2 | Maintenance | Friday update by the manager (replaces emailing the tracker); repairs past target in the Monday report | Policy; Reg 15 |
| 2 | Occupancy | Monday and Friday update reminder; onboarding documents for new residents; head office only, references not names | Policy |
| 3 | QA audit actions | Hamida's monthly visit; actions only, with a 2-week mid-point update | Policy; Reg 17 |
| 3 | Spot checks & visits | Monthly, done or not done | Policy |
| 3 | Manager monthly report | Monthly, submitted or not | Policy |
| 3 | Supervision & training | Per staff reference: supervision every 8 weeks, training expiry | Legal (Reg 18, Oliver McGowan) + policy frequencies |

Module definitions, questions and timings: `config/qa-modules.json`. All timings and frequencies are **UNVERIFIED** until Hamida signs them off (the app has a "Sign off this module" button in Admin > Check library for this).

## 6. Who can see and do what (draft for Mark to confirm)

Home team roles see only their own homes; head office roles see all homes. A module switched off at a home is hidden for everyone there. Editable in Admin > Who can do what.

| Role | FIN | MED | H&S | FIRE | IPC | MNT | OCC | QA | SPOT | MMR | S&T |
|---|---|---|---|---|---|---|---|---|---|---|---|
| System admin (Zakir) | Manage | Manage | Manage | Manage | Manage | Manage | Manage | Manage | Manage | Manage | Manage |
| Director (Mark) | Manage | Manage | Manage | Manage | Manage | Manage | Manage | Manage | Manage | Manage | Manage |
| Compliance & QA lead (Hamida) | Manage | Manage | Manage | Manage | Manage | Manage | Manage | Manage | Manage | Manage | Manage |
| Operations & housing (Zara) | View | View | Manage | Manage | View | Manage | Manage | View | View | View | View |
| Finance (Nafisa) | Manage | View | View | View | View | View | Manage | View | View | View | View |
| Service manager | Record | Record | Record | Record | Record | Record | Record | Record | Record | Record | Record |
| Deputy manager | Record | Record | Record | Record | Record | Record | None | Record | Record | View | View |
| Team leader | Record | Record | Record | Record | Record | Record | None | View | None | None | None |
| Viewer (auditor) | View | View | View | View | View | View | None | View | View | View | None |
| Support worker | None, and never notified | | | | | | | | | | |

**View** sees checks, results and actions. **Record** completes checks at your own level and below (team leaders weekly, deputies weekly and monthly, managers all) and updates actions. **Manage** also puts checks on hold, marks N/A, reopens, signs off and reassigns.

App-wide permissions: switch homes and modules (system admin, director, compliance lead); add people and change roles, change the access matrix (system admin, director); change alert timings (plus compliance lead); sign off rules (compliance lead, director); receive the Monday report (head office); copied into every alert (director, compliance lead, finance); see resident and staff references (head office and service managers); activity log (system admin, director, compliance lead). This follows Mark's email of 24 Nov: only Mark, Nafisa, Hamida and Zara can change settings.

## 7. SharePoint lists for the live build

| List | Key columns | Preview equivalent |
|---|---|---|
| Homes | Title, Order, Status (Not started / Setting up / Shadow / Live / Paused), Wave, QuarterStart, one Yes/No column per module, ServiceManager, Deputy, TeamLeaders (Person, multi) | `S.homes` |
| People | Person (Microsoft account), Role, Homes (multi lookup), GetsAlerts, OnLeave, Delegate | `S.users` |
| TrackerRegistry | Home, Module, File path, Table names, LastSynced | (sync only) |
| Checks | CheckId (`home|module|level|n`), Home, Module, Level, Period, Due, Answers (JSON), Answered, NotMet, Submitted, SubmittedBy/On, Evidence, OnHoldReason/Review, NA, Status, DaysLate, LastAlerted | `S.records` + `src/qa/schedule.js` |
| Actions | Ref (HC-FIN-001), Home, Module, Source, Finding, Action, Priority, Owner, Identified, Target, UpdateDue, Status, Evidence, VerifiedBy/On, HoldReason/Review | `S.actions` |
| ActionUpdates | Action, At, By, Text (append-only) | `action.comments` |
| AccessMatrix, Capabilities | Role × module level; capability × roles | `S.matrix`, `S.caps` |
| AlertSettings | Level, HeadsUp, OutstandingAfter, Repeat, Escalate; HeadOfficeFrom | `S.levels`, `S.settings` |
| Registers | FireItems, CapacityRegister, Maintenance, Onboarding, StaffRegister (references only) | `S.registers` |
| AlertLog, ReportLog, Activity | Audit trail of every email and change | `S.activity` |

## 8. Open decisions (also in ELICITATION.md, section Q)

1. Head office copied from the first alert (Mark's email) or only on escalation plus the Monday report (recommended)?
2. IronOak H&S, maintenance and occupancy on the app, against Zara's preference? (Built in; can be switched off per home.)
3. Due dates for monthly (3 days after the 4th week) and quarterly (7 days after week 13) checks.
4. Supervision frequency (8 weeks assumed) and training renewal periods.
5. Hall Close go-live date, after a week of shadow mode.
6. Where the live screens run: Power Apps canvas app, or this web page hosted on SharePoint with Microsoft sign-in (needs IT).

## 9. Running the preview

```bash
npm run build:app        # writes app/dist/index.html and app/dist/artifact.html
npm test                 # includes tests/qa.test.js (schedule, alerts, access, report)
```

Open `app/dist/index.html` in a browser. Use the **Demo** panel at the bottom of the menu to switch person and date. Every person and resident reference in the preview is invented (CLAUDE.md rule 3); home names are the public names from estocare.com.
