---
title: Power Platform design (SharePoint Lists + Power Apps + Power Automate)
status: DRAFT v0.1 — follows ADR-0002 (accepted 2026-11-20)
owner: Zakir Hussain
last_reviewed: 2026-11-20
review_every_days: 30
---

# Power Platform design

Chosen by ZACK on 20 Nov 2026 (ADR-0002). Staff sign in with their company Microsoft accounts (ADR-0007), so there are no app passwords at all.

## 1. Licensing guardrails (keep it inside Microsoft 365 rights)

Microsoft 365 business/enterprise licences include **limited** Power Apps and Power Automate rights for apps that use Microsoft 365 data and **standard connectors** ([Microsoft Learn, updated 16 Oct 2026](https://learn.microsoft.com/power-platform/admin/pricing-billing-skus)). To stay inside them:

| Do | Don't (needs paid Premium / per-app licences) |
|---|---|
| **Canvas app** on **SharePoint Lists** | Dataverse tables, model-driven apps |
| Standard connectors only: SharePoint, Office 365 Outlook, Office 365 Users, Microsoft Teams, Excel Online (Business) | Premium connectors (e.g. HTTP, SQL, AI Builder), custom connectors, on-premises gateway |
| Build in an environment that is **not** a Managed Environment | Managed Environments: from **Feb 2027** Microsoft will block users without a qualifying licence ([SAMexpert, 6 Oct 2026](https://samexpert.com/power-apps-2027-enforcement-price-increase/)) |

**Staff licence (ZACK, 20 Nov 2026): Microsoft 365 Business Basic for everyone.** Probably covers a SharePoint-only canvas app and standard flows ([Microsoft Q&A, Jan 2026](https://learn.microsoft.com/en-us/answers/questions/5750665/power-apps-requesting-license-with-microsoft-365-b): community guidance, not an official licensing statement). Before building much: make a tiny test app and flow on SharePoint, open it as a Business Basic-only user, and check nothing shows a diamond (premium) icon or a licence prompt.

**Still to ask IT (ELICITATION G8, remaining parts):** which Microsoft 365 plan do staff have, which Power Platform environment should we use, and is it a Managed Environment? Premium list price rises from $20 to $22 per user per month on 1 Jan 2027, so staying on standard connectors matters.

## 2. SharePoint site and lists

One SharePoint site, e.g. **"South Oversight"**, with unique permissions. Lists (internal names in brackets):

| List | Key columns | Notes |
|---|---|---|
| **Services** | Title, ServiceCode, Region, Kind (supported living / registered), ServiceManager (Person), Deputy (Person), TeamLeaders (Person, multi), DelegateWhenAway (Person), ManagerOnLeave (Yes/No), Landlord (text) | No support workers in any escalation column. That is how "never notify support workers" is enforced here. |
| **TrackerTypes** | Title, Key, Category (choice), Kind (Certificate / Recurring), IntervalN (number), IntervalUnit (Days / Months / Years), AmberDays, GraceDays, EscalateManagerDays, EscalateHeadOfficeDays, Basis (Legal / Guidance / Policy), LegalRef, SourceUrl, DutyHolder, Status (Unverified / Verified), VerifiedBy (Person), LastChecked (date) | Loaded from `config/rules.json` (script to export CSV: to do). Hamida signs off here. |
| **TrackerItems** | Service (lookup), TrackerType (lookup), Ref (e.g. room or person reference, **no names**), LastDone (date), ExpiresOn (date), NotApplicable (Yes/No), EvidenceLink, and **computed by flow**: DueDate, RagStatus (Red / Amber / Green / Not recorded / N/A), DaysOverdue, EscalationLevel, LastEscalatedOn, LastEscalationLevel, RagReason | One row per check per service (or per person reference). |
| **Actions** | TrackerItem (lookup), Owner (Person), NextStep (text), NextStepDate (date), Status (Open / Done), MarkComment, Priority (choice) | Mark can comment and change priority (BR-19). |
| **Updates** (audit) | TrackerItem, Field, OldValue, NewValue, ChangedBy (Person), ChangedOn | Written by the app on every save; nobody gets edit/delete rights except site owners. SharePoint version history is a second record. |
| **ReportLog** | ReportDate, SentTo, Totals (JSON text), RunOutcome | Proves the Monday report went out (BR-21). |
| **HeadOffice** | Person, Role, ReceivesMondayReport (Yes/No), ReceivesEscalations (Yes/No) | Mark, Hamida, Yasmin as agreed. |

**Permissions (draft):** Head office group: read all, edit Actions. Each service's managers: edit their service's TrackerItems and Actions. Simplest version: one site, item-level filtering in the app (`Filter(TrackerItems, Service.Value = varMyService)`). If IT needs hard separation between services, use one SharePoint group per service and item-level permissions set by a flow. Decide with IT (ELICITATION E2).

**Delegation:** SharePoint queries from Power Apps return at most 500 rows by default (2,000 max) unless the filter is delegable. Keep filters to simple `=` on Service, RagStatus and choice columns, and index those columns. About 25 tracker types × 14 South services ≈ 350 rows, plus person-level items, so this is fine for the South but needs care if the North is added.

## 3. Why RAG is computed by a flow, not by SharePoint

SharePoint calculated columns can't use "today" reliably (they only recalculate when the item is edited). So a scheduled flow writes the status each night, and the app and the report read stored values.

## 4. Flows (Power Automate, standard connectors only)

| Flow | Trigger | What it does |
|---|---|---|
| **1. Nightly RAG refresh** | Recurrence, daily 02:00, time zone *(UTC) Dublin, Edinburgh, Lisbon, London* | For each TrackerItem: find its TrackerType; compute DueDate, DaysOverdue, RagStatus, RagReason, EscalationLevel exactly as in `docs/RAG_ACCEPTANCE_SCENARIOS.md`; update the item only if something changed. |
| **2. Escalations** | Runs after flow 1 (or daily 07:30) | Items where EscalationLevel ≥ 2 and (level went up, or LastEscalatedOn is 7+ days ago): one **digest email per person per day** to the service manager (or delegate) and deputy; at level 3 also the HeadOffice people with ReceivesEscalations. Writes LastEscalatedOn / LastEscalationLevel. |
| **3. Monday report** | Recurrence, Mondays 07:00 London time [TBC B2] | Reads TrackerItems and Actions; builds an HTML email: totals, **reds without a plan first**, all reds with owner and next step, by-service table, forward look 7/14/30/90; deep links into the app for each line. Sends from a shared mailbox to HeadOffice where ReceivesMondayReport = Yes; writes ReportLog. |
| **4. Daily exceptions** (optional, BR-02) | Weekdays 08:00 | New reds since yesterday only. |
| **5. Audit on edit** (optional) | SharePoint "When an item is created or modified" | Backstop if anyone edits the list outside the app. |

## 5. The app (canvas, phone layout first)

| Screen | Who | What |
|---|---|---|
| **My service** | Manager, deputy, team leader | Today's due and overdue checks as big tick buttons ("click, click, click"); tick = LastDone today, optional evidence photo/link. |
| **Item** | Everyone with access | Status, reason, history (from Updates), actions; add owner + next step + date in two taps. |
| **Oversight** | Head office | RAG totals; reds without a plan; by-service table; forward look; tap any number to drill down (BR-04). |
| **Rules** | Hamida, admins | TrackerTypes view with Verified / Unverified, source link and sign-off. |

Who is who: `Office365Users.MyProfileV2()` for the signed-in person; match against Services and HeadOffice lists to decide what they see.

## 6. RAG in Power Fx (for the app's live display; mirrors the flow)

```powerfx
// Inputs: item (TrackerItems record), t (its TrackerTypes record)
With(
  {
    due: If(
      !IsBlank(item.ExpiresOn), item.ExpiresOn,
      IsBlank(item.LastDone), Blank(),
      DateAdd(item.LastDone, t.IntervalN,
        Switch(t.IntervalUnit.Value, "Days", TimeUnit.Days, "Months", TimeUnit.Months, TimeUnit.Years))
    )
  },
  With(
    { over: If(IsBlank(due), Blank(), DateDiff(due, Today(), TimeUnit.Days)) },
    If(
      item.NotApplicable, "N/A",
      IsBlank(due), "Not recorded",
      over > 0 && t.Kind.Value = "Recurring" && over <= t.GraceDays, "Amber",
      over > 0, "Red",
      over = 0, "Amber",
      -over <= t.AmberDays, "Amber",
      "Green"
    )
  )
)
```

`DateAdd` with months clamps to the end of the month (31 Jan + 1 month = 28/29 Feb), which matches `src/rules/dates.js`. **Check this in the test app** with scenario S11.

## 7. Source control for the Power Platform parts

- Put the app and flows in one **Solution** (e.g. `MarksOversight`).
- Export it and unpack with the Power Platform CLI (`pac solution export` then `pac solution unpack --folder power-platform/solution`) and commit the unpacked folder here. Never commit list data.
- Keep `config/rules.json` as the master for rules and push changes into the TrackerTypes list (CSV import or a small flow).

## 8. What happens to the JavaScript in this repo

`src/rules/` stays as the **reference implementation**: it defines exactly how RAG, due dates and escalation must behave, and its tests are the source of the acceptance scenarios that the flow and app must pass. `npm run report` still produces the sample report Mark can react to. ADR-0001 is superseded.

## 9. Build order

1. With IT: environment, licences, SharePoint site, shared mailbox for the report (G8).
2. Create lists; import TrackerTypes from `config/rules.json`; enter one service (the Grange) from Hamida's trackers.
3. Flow 1 (RAG refresh) and check it against the acceptance scenarios.
4. Flow 3 (Monday report) to Zakir only, then to Mark.
5. Oversight screen, then My service screen; pilot at the Grange.
6. Flow 2 (escalations), once thresholds are agreed.
