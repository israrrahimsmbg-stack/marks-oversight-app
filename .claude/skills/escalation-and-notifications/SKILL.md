---
name: escalation-and-notifications
description: Use when deciding or coding who is notified about overdue or missing compliance items, when, how often and through which channel (email, in-app, Teams), including leave cover and the support-worker exclusion.
last_reviewed: 2026-11-20
review_every_days: 60
---

# Escalation and notifications

## Agreed so far

- **Support workers are never notified** (Mark, relayed by Hamida, 19 Nov 2026). Enforced by `NEVER_NOTIFY` in `src/rules/escalation.js`, tested at every level.
- Service manager is told first; deputy and team leaders should see it too (Yasmin: they "should be able to have access").
- **Mark and Hamida are the last resort** (Hamida: "we are the last resort... give the managers the chance").
- Motivating case: weekly fire log missed for weeks then months, manager "didn't have a clue".

## Draft ladder (config: `config/rules.json` defaults; all [TBC], ELICITATION D1–D5)

| Level | Trigger | Recipients | Channel |
|---|---|---|---|
| 1 SERVICE_TEAM | overdue 1+ days | manager, deputy, team leaders | in-app / daily digest |
| 2 SERVICE_MANAGER | overdue ≥ 7 days, or no date recorded | manager (or delegate if on leave), deputy | email |
| 3 HEAD_OFFICE | overdue ≥ 14 days | above + Mark + Hamida | email; tops Monday report |

Repeat every `repeat_reminder_days` (7) unless the level rises (send at once).

## Open design points

- Should an item that already has an owner and dated next step still go to head office at 14 days? (Currently yes. Mark may prefer "only if the next step date passes".)
- Instant head-office alert for critical reds (gas expired, fire alarm fault)? (ELICITATION D6.)
- Channel: email via the company Microsoft 365 mailbox is the default assumption; Teams is possible via Graph.
- Daily digest vs one email per item: prefer one digest per person per day to avoid alert fatigue.

## On Power Platform

Escalation runs in the daily Escalations flow (`docs/POWER_PLATFORM_DESIGN.md` §4). Support workers are excluded by design: the Services list only has ServiceManager, Deputy, TeamLeaders and DelegateWhenAway person columns. Send one digest per person per day from the shared mailbox.

## Implementation rules

- Recipient resolution is pure (`recipients(level, service, headOffice)`); sending is a separate adapter.
- Log every send (who, what, level, when) in the audit trail; the Monday report can show "escalated on".
- Never put resident names in emails; use service name, item and a link.
- Use `example.invalid` addresses in tests and samples.
- Respect leave: `on_leave` + `delegate` on the person record.
