---
title: Business decisions
last_reviewed: 2026-11-26
review_every_days: 30
---

# Business decisions

Newest first. Architectural decisions are ADRs in `docs/DECISIONS.md`.

| Date | Decision | Who | Source |
|---|---|---|---|
| 2026-11-26 | QA app built in `app/` the same way as the Operations app (preview), logic in `src/qa/`; live build stays on Microsoft 365 for sign-in (ADR-0010). Everything in scope, modules switched on per home, Finance/Medication/H&S/Fire first. | ZACK (with Claude) | thread "Build the QA compliance app" |
| 2026-11-25 | Alert only when a check is not done; "Not met" is a deficit, not overdue. Ladder: team leader (weekly) > deputy (monthly) > service manager (quarterly); each level depends on the one below. Action statuses: Not started, In progress, Awaiting evidence, Awaiting sign-off, Completed, On hold. Finance checks must include MCA / best-interest records. | Hamida | 25 Nov call transcript |
| 2026-11-25 | Rollout home by home: Hall Close, Pendragon, Effingham, Ragstone Rd, Stoke Poges, Waxlow, Lambourne, Queenswood, Hermitage, Wansbeck A, Wansbeck H. Staff keep SharePoint trackers; app reads them, alerts until done; Mark, Nafisa and Hamida get all alerts; Monday report by home. | Mark | emails 24 and 25 Nov |
| 2026-11-25 | Include everything (IronOak H&S, maintenance, occupancy, infection control, QA actions, spot checks, manager reports, supervision & training) even where Zara prefers not. | ZACK | project chat 25 Nov |
| 2026-11-20 | Platform: Power Apps + Power Automate on SharePoint Lists (ADR-0002). Standard connectors only to stay within Microsoft 365 licences. | ZACK (decision card) | thread 20 Nov |
| 2026-11-20 | Staff must sign in with company Microsoft accounts (Entra ID). | IT, relayed by ZACK | thread message 20 Nov |
| 2026-11-19 | Escalation goes to the service manager; Mark and Hamida are last resort; support workers are not notified. | Hamida (citing Mark) | 19 Nov transcript ~13:51, 15:13 |
| 2026-11-19 | One standard set of trackers for every house; the Grange version is the model. | Hamida (Mark's wish) | 19 Nov transcript ~10:46, 16:24 |
| 2026-11-19 | Service manager, deputy and team leader should all have access to the tracker. | Yasmin | 19 Nov transcript ~14:53 |
| 2026-11-18 | Phasing: finish Operations app first (live Tue 24 Nov), then Mark's app from w/c 23 Nov; start with compliance reporting, then the managers' tracker. | Yasmin, agreed by Mark | 18 Nov transcript ~8:33, 12:01 |
| 2026-11-18 | Scope is eventually "everything" (finance, compliance, voids...), not only compliance. | Mark | 18 Nov transcript ~6:03 |
| 2026-11-19 | Repo set up with rules as config (ADR-0004), no deps yet (ADR-0006). Phase 1 platform proposed as the Operations app (ADR-0001, needs confirming). | Zakir (with Claude) | this repo |
- 2026-11-26: Settings (homes and modules, people, access matrix, alert timings) editable only by the director, compliance lead, operations and finance roles plus the system admin, following Mark's 24 Nov email. Head office can mark an action as a priority. Certificates and care records now alert like checks [UNVERIFIED timings].
