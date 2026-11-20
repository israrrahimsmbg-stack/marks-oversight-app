---
title: Assumptions and open questions
last_reviewed: 2026-11-20
review_every_days: 7
---

# Assumptions and open questions

When an assumption is confirmed or proven wrong, move it to **Resolved** with the date and who said so, and update the BRD.

## Assumptions

| ID | Assumption | If wrong, what changes | Check with | Status |
|---|---|---|---|---|
| AS-01 | Mark's app extends the Operations app rather than being a separate system. | Architecture (ADR-0001), sign-in, data. | Mark, Yasmin | open |
| AS-02 | The `esto-care-operations` GitHub repo is the version going live on 24 Nov. (It covers voids, rooms, income lost and compliance; housing benefit and "money loss" were not obvious in the code.) | Which codebase Phase 1 builds on. | ZACK | open |
| AS-03 | Scope for Phase 1 is the **South** only. | Number of services, recipients. | Mark | open |
| AS-04 | Hamida's new trackers (Grange model) will be the same for every house and are the source of truth. | Tracker types in `config/rules.json`. | Hamida | open |
| AS-05 | Thresholds: service manager at 7 days, head office at 14 days. | Escalation config only. | Mark, Hamida | open |
| AS-06 | The report goes to Mark by email on Monday morning, with an in-app view for drill-down. | Delivery (ADR-0003). | Mark | open |
| AS-07 | Mark's app holds no resident names in Phase 1; person-level items use a reference only. | DPIA scope. | Yasmin, DPO | open |
| AS-08 | Company uses Microsoft 365 (Teams, SharePoint, Outlook). Based on meeting transcripts from Teams. | Sign-in, email, platform choice. | IT | confirmed 2026-11-20 (IT requires Microsoft sign-in) |
| AS-09 | Service manager, deputy and team leader can all update the tracker; only managers and head office can close or override. | Roles and permissions. | Yasmin | open |
| AS-10 | Medication administration stays in PCS; we only track that the audit was done and its actions. | Medication scope. | Hamida | open (BRD 4.2) |
| AS-11 | For landlord-held certificates, Esto Care records the date and holds a copy; chasing the landlord is the service manager's action. | Owner of actions. | Hamida | open |

## Open questions (summary; detail and answers in ELICITATION.md)

1. One app or two? (A3)
2. Exactly what is in the Monday report, in what order, who else gets it, what time? (B1–B4)
3. RAG definitions per item type. (B5, C6)
4. Final tracker list and fields. (C1–C3)
5. Escalation thresholds and channel; cover for leave. (D1–D5)
6. How people sign in; who administers. (E3, E4)
7. Hosting, IT approval, DPIA. (G3, G4, G6 new)
8. Should a red that has a plan (owner + dated next step) still escalate to head office? (new: currently yes)

## Resolved

| Date | Item | Outcome | Who |
|---|---|---|---|
| 2026-11-20 | How do staff sign in? | Company Microsoft accounts (Entra ID), required by IT. Rules out the Operations app's own password accounts for Mark's app (ADR-0007). | ZACK, relaying IT |
| 2026-11-19 | Do support workers get escalation notices? | No. Service manager first; Mark and Hamida last resort. | Hamida, citing Mark |
| 2026-11-18 | Is it compliance only? | No: "everything", finance, compliance, voids. Phased, compliance first. | Mark; phasing by Yasmin |
