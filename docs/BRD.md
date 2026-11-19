---
title: Business Requirements Document
status: DRAFT v0.1 (converted from BRD_Marks_App_Draft_v0.1.docx)
owner: Zakir Hussain (BA)
sign_off: Mark Horton (pending)
last_reviewed: 2026-11-19
review_every_days: 14
---

# BRD: Management Oversight & Internal Compliance App (Mark's App)

> Converted from Zakir's Word draft of 19 Nov 2026. Items marked [ASSUMPTION] or [TBC] must be confirmed through [`ELICITATION.md`](ELICITATION.md). When an answer arrives, update the requirement here, mark the question answered, and log it in `memory/decisions.md`.

Status: DRAFT. Items marked [ASSUMPTION] or [TBC] must be confirmed
using the Elicitation Questionnaire.

# 1. Background and Problem

Mark is ultimately responsible for everything that happens across the
South services (compliance, finance, voids, and more). He currently does
not know what he does not know. Compliance trackers exist in Excel
(built by Hamida) but are not integrated with service managers, items go
outstanding for weeks or months (e.g. the weekly fire log missed on 17
and 24 Aug, outstanding up to 3 months), and when head office asks,
managers often have no idea. Mark has been caught out by senior
leadership (Abi) and does not want that to happen again.

# 2. Business Objectives

- Give Mark proactive oversight: the system tells him, he does not
  search for it.

- Shift ownership of day-to-day compliance to service managers, deputies
  and team leaders, with head office as last resort.

- Replace chasing by email/Excel with automated visibility and
  escalation.

- Reduce missed compliance tasks and provide an audit trail that proves
  work was done and who did it.

# 3. What Mark Wants (summary of the ask)

| \#  | Need                                                                                                                                                                                                                                                               | Source         |
|-----|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|----------------|
| 1   | Automated Monday weekly report (and possibly daily update) covering compliance and finance, plus voids etc. Status of everything: out of date, coming out of date, in date.                                                                                        | Mark, 18 Nov   |
| 2   | RAG (Red/Amber/Green) rating. App must flag reds and things likely to break, without Mark asking.                                                                                                                                                                  | Mark           |
| 3   | Drill-down: click a headline number (e.g. 13 expired certificates) and see the actions, the owner and the next step (e.g. 'Zara meeting on X date').                                                                                                               | Mark           |
| 4   | Forward look: what is due in the next 1, 2, 3 weeks and 90 days, and what the position is right now.                                                                                                                                                               | Mark           |
| 5   | Ability to manage from it: see who owns an item, challenge priority.                                                                                                                                                                                               | Mark           |
| 6   | Day-to-day compliance logbook/tracker for service managers (fire drill weekly, fire exit check every 2 weeks, medication audit, daily checks, support plans, risk assessments, reviews, support/funding packages, certificates, occupancy, QA audit with actions). | Yasmin, Hamida |
| 7   | Automatic notification when a task is not updated (e.g. 1 to 2 weeks) to the service manager first, and to Mark and Hamida as last resort.                                                                                                                         | Hamida         |
| 8   | Simple 'click, click, click' interface for service manager; access for service manager, deputy and team leader.                                                                                                                                                    | Yasmin         |

# 4. Scope

## 4.1 Proposed phasing (agreed direction from Yasmin: one stage at a time)

| Phase | Content                                                                                                                                                                                                              | Status                 |
|-------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|------------------------|
| 0     | Finish and validate the existing Operations app (voids, money loss, hospital clients, housing benefit, compliance). Zara validates compliance, Jawad validates finance. Go live Tue 24 Nov after Monday demo to Abi. | In progress            |
| 1     | Management Reporting: weekly Monday report, RAG, drill-down to actions/owners. Starting with compliance.                                                                                                             | Next (from Mon 23 Nov) |
| 2     | Service Manager compliance tracker app: daily/weekly/fortnightly checks (fire log, fire exits, medication audit, certificates, occupancy, QA audit), with overdue alerts.                                            | After Phase 1          |
| 3     | Extend reporting to finance, voids and the rest; QA automation per service.                                                                                                                                          | Later [TBC]          |

## 4.2 Out of scope (for now) [TBC]

- Replacing the electronic medication recording system (PCS); app only
  tracks that the audit was done.

- Detailed finance rebuild; Yasmin and Jawad help with finance.

# 5. Stakeholders

| Person                                   | Role in project                                                     |
|------------------------------------------|---------------------------------------------------------------------|
| Mark Horton                              | Sponsor; Director responsible for the South; main report consumer   |
| Yasmin Rauf                              | Operations lead; Zakir's guide; owns priorities and go-live         |
| Hamida Khamlichi                         | Compliance/QA; owns trackers and audits; validates compliance data  |
| Zara                                     | Validates compliance data in current app                            |
| Jawad                                    | Validates finance data                                              |
| Abi                                      | Senior leadership; Mark's accountability line; sees app demo Monday |
| Service managers, deputies, team leaders | Daily users and owners of tasks                                     |
| Support workers                          | Complete some tasks; NOT notified (per Mark)                        |
| Zakir Hussain                            | BA / developer                                                      |

# 6. Business Requirements

| ID    | Requirement                                                                                                                                                                                  | Priority        |
|-------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-----------------|
| BR-01 | Weekly report: auto-generated every Monday, emailed to Mark (and optionally dashboard), showing compliance status as Overdue / Due soon / In date.                                           | Must            |
| BR-02 | Daily summary option for exceptions only [TBC].                                                                                                                                            | Should          |
| BR-03 | RAG status for every tracked item with defined rules per item type (e.g. fire alarm cert max 6 months, EPC 5 or 10 years).                                                                   | Must            |
| BR-04 | Drill-down from any summary figure to the items, owner, due date, action and next step.                                                                                                      | Must            |
| BR-05 | Every outstanding item has an owner, action and next step; history of updates retained (audit trail).                                                                                        | Must            |
| BR-06 | Forward-looking view: due in 7, 14, 21, 30, 90 days.                                                                                                                                         | Must            |
| BR-07 | Tracker forms per service for recurring checks (fire log weekly, fire exits every 2 weeks, medication audit, certificates, occupancy, QA audit with actions), same template for every house. | Must            |
| BR-08 | Automatic escalation: not updated for X days, notify service manager; after Y days notify Mark and Hamida. X and Y configurable [TBC, suggested 7 and 14].                                 | Must            |
| BR-09 | Role-based access: Mark and head office see all services; service manager, deputy and team leader see own service.                                                                           | Must            |
| BR-10 | Simple, fast data entry for managers (few clicks).                                                                                                                                           | Must            |
| BR-11 | Import of existing data (Excel/SharePoint) to start.                                                                                                                                         | Should          |
| BR-12 | Extend same report pattern to finance and voids.                                                                                                                                             | Could (Phase 3) |

# 7. Success Measures [TBC with Mark]

- Mark receives the Monday report without asking and can answer 'what is
  going on' for any item.

- Zero tasks overdue beyond escalation threshold without a named owner
  and action.

- Reduction in outstanding items such as the fire log gap (from months
  to under 2 weeks).

# 8. Assumptions, Constraints, Risks

- [ASSUMPTION] Existing Operations app is the base; Mark's app extends
  it rather than being a separate system.

- [ASSUMPTION] Hamida's new standard trackers (same for every house)
  are the source; she is still finalising occupancy, will send all
  trackers for one house.

- Mark's QA documents have not arrived yet; requirements will move once
  they do.

- Risk: scope creep ('I want this, I want that'). Mitigation: phased
  delivery and sign-off per phase.

- Risk: two meetings suggest Mark may want 2 apps; unclear (see Open
  Questions).

- Constraint: Data quality depends on managers updating trackers.

# 9. Open Questions (to resolve)

- Is it one app or two? Mark's 'compliance' tracker for managers vs the
  reporting layer. Yasmin's view: report first, then manager tracker.

- What exactly is in the Monday report, who else receives it?

- Which trackers are final (old vs new)?

- Who has access, and how do managers log in?

# 10. Recommended Delivery Approach

- Week of 19 Nov: validate current app (Zara, Jawad), prepare Monday
  demo.

- Fri 20 Nov 2pm: meeting with Yasmin to confirm scope and agree
  questions.

- Tue 24 Nov: demo, go live; Tue meeting with Mark.

- Run elicitation (separate document), then update this BRD to v1.0 and
  get Mark's sign-off.

- Build Phase 1 (report) as prototype, show Mark early, iterate, then
  Phase 2 manager tracker.

# 11. Additions from the specialist review (19 Nov 2026) [TBC]

These were not in the v0.1 draft. They come from reading both transcripts and from common practice in UK care oversight tools. Each needs confirmation.

| ID | Requirement | Why | Priority |
|---|---|---|---|
| BR-13 | "Not recorded" is its own status and is never shown as Green. | A missing date is a risk, not compliance. | Must |
| BR-14 | Each rule shows whether it is a legal requirement, recognised guidance, or internal policy, with its source. | Hamida question C5; avoids over- or under-stating duties. | Must |
| BR-15 | Every Red without an owner or next action is flagged at the top of the report. | Mark: "I need to know the actions behind it." | Must |
| BR-16 | "Changes since last week" section (new reds, closed reds, items getting worse). | Lets Mark see trend, not just a snapshot. | Should |
| BR-17 | Delegate/cover for a service manager on leave. | Escalation should not stall (ELICITATION D4). | Should |
| BR-18 | Evidence link (document, photo) on completion of a check. | Proves work was done (audit trail for CQC Reg 17). | Should |
| BR-19 | Mark can comment on or re-prioritise an item, and the owner is told. | Mark: "Zara, why aren't we making this a priority?" | Should |
| BR-20 | Instant alert to head office for defined critical reds (e.g. gas certificate expired, fire alarm fault). | ELICITATION B10. | Could |
| BR-21 | The report records that it was sent and to whom. | Proof of oversight; monitoring that the scheduler ran. | Should |

## Non-functional requirements (draft)

| ID | Requirement |
|---|---|
| NFR-01 | No resident personal data in Mark's app in Phase 1 (compliance items are about premises and processes). If Phase 2 adds person-level reviews (support plans, risk assessments), use initials/room IDs or link to PCS; DPIA first. |
| NFR-02 | Role-based access: head office sees all; service roles see their own service only. |
| NFR-03 | Append-only audit trail of every change (who, when, old → new). |
| NFR-04 | Works on phone and PC for managers (ELICITATION E5). |
| NFR-05 | UK/EU data residency for any hosted data [TBC with IT]. |
| NFR-06 | Monday report delivered by 08:00 UK time [TBC]. |
