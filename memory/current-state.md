---
title: Current state
last_reviewed: 2026-11-20
review_every_days: 7
---

# Current state (as of 2026-11-20)

**Phase:** 0 finishing (Operations app go-live Tue 2026-11-24); 1a discovery starting.

## Done

- 2026-11-18 meeting with Mark; 2026-11-19 call with Yasmin and Hamida.
- BRD draft v0.1 and elicitation questionnaire (Zakir).
- 2026-11-20: Power Platform design, acceptance scenarios and TrackerTypes CSV export added.
- This repo set up: plan, BRD, elicitation log, ADRs, compliance rules (24, all UNVERIFIED), research, skills, memory, tested rules engine and sample Monday report.

## Next

| Date | Item | Owner |
|---|---|---|
| 2026-11-20 14:00 | Scope meeting: confirm phasing, go through ELICITATION F and A | Yasmin, Zakir |
| 2026-11-23 | Demo of Operations app to Abi | Yasmin, Zakir |
| 2026-11-24 | Go live; meeting with Mark: show sample Monday report, ask A and B | Mark, Yasmin, Zakir |
| w/c 2026-11-23 | Receive Grange trackers (Hamida) and QA documents (Mark) | Zakir |
| by 2026-11-27 | Hamida reviews COMPLIANCE_RULES; BRD v0.2 | Zakir, Hamida |

## Update 2026-11-20 (ZACK)

- **The Operations app goes live today, Fri 2026-11-20**, not Tue 24 Nov as earlier notes said (other docs still show 24 Nov: treat this line as correct and fix them when next edited).
- ZACK has answered the repo question (AS-02): `esto-care-operations` is the live version. Not asked again.
- Still open and **not to be chased**: whether IT's Microsoft sign-in rule applies to the Operations app (it uses its own passwords), M365 plan / SharePoint site / shared mailbox (ELICITATION G8). Raise only when it blocks work.

## Blockers / waiting on

- **Platform decided 2026-11-20:** Power Apps + Power Automate on SharePoint (ADR-0002). Waiting on IT: M365 plan, environment (not Managed), SharePoint site, shared mailbox (ELICITATION G8).
- Does the Microsoft sign-in rule also apply to the Operations app going live 2026-11-24 (it uses its own passwords)?

- Hamida's tracker set for one house (still finishing occupancy tracker).
- Mark's QA documents (he said he'd send them; maybe over the weekend or Monday).
- ZACK: confirm which Operations app repo is live (AS-02); answer hosting/sign-in questions.
