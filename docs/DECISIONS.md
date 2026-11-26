---
title: Architecture decision records
last_reviewed: 2026-11-20
review_every_days: 30
---

# Decision log (ADRs)

Format: one section per decision. Status is `proposed`, `accepted`, `superseded by ADR-xxxx`, or `rejected`. Never delete an ADR; supersede it. Business decisions (who, what, when) go in `memory/decisions.md`; this file is for decisions that shape the system.

---

## ADR-0001: Phase 1 is built on the existing Esto Care Operations app, with a portable rules engine

- **Status:** superseded by ADR-0002 (20 Nov 2026). The JavaScript rules engine is kept as the reference implementation and test oracle.
- **Context:** Mark wants a Monday report quickly. The Operations app (single-page JS, Claude artifact, shared database, own sign-in and roles) already holds the homes, roles and a compliance section, and goes live 24 Nov. Hosting, sign-in and DPIA questions for any new platform are unanswered.
- **Decision:** Add an "Oversight" view to the Operations app for Phase 1. Keep all RAG, schedule, escalation and report logic in `src/rules/` of this repo as pure, dependency-free ES modules, so they can be copied into the Operations app build and later moved to any platform.
- **Consequences:** + fastest path to Mark; + one system for users. − Scheduled email needs something outside the page (ADR-0003). − Long-term platform still open (ADR-0002).

## ADR-0002: Long-term platform

- **Status:** accepted (20 Nov 2026): **B, Power Apps + Power Automate on SharePoint Lists**, chosen by ZACK. Design in `docs/POWER_PLATFORM_DESIGN.md`. Stay on standard connectors, no Dataverse, not a Managed Environment, so it fits Microsoft 365 licence rights.
- **Options:** (A) keep extending the Operations app; (B) Microsoft 365 low-code: SharePoint Lists + Power Apps + Power Automate, with Entra ID sign-in; (C) custom web app, e.g. Next.js + PostgreSQL + Entra ID (MSAL) + job queue, hosted in the UK.
- **Decide on:** IT's hosting and sign-in rules (ELICITATION E3, G4), DPIA outcome (G3), number of users (G5), whether managers will use phones (E5), and who maintains it if Zakir is away.

## ADR-0003: How the Monday report is sent

- **Status:** accepted (20 Nov 2026): Power Automate weekly recurrence flow, sent from a shared mailbox, logged in the ReportLog list (follows ADR-0002).
- **Options:** (1) a scheduled Claude routine that reads the app's database, runs the rules engine, and sends through the company's Microsoft 365 mailbox connector; (2) Power Automate on a weekly recurrence, if the data is mirrored to SharePoint/Excel; (3) a job in the custom platform (ADR-0002 C).
- **Constraint either way:** report content is produced by the deterministic rules engine, not written freehand by an AI, and each send is logged (BR-21).

## ADR-0004: Rules are configuration, with a human-readable mirror that cannot drift

- **Status:** accepted (19 Nov 2026).
- **Decision:** All RAG/frequency/escalation rules live in `config/rules.json`. `docs/COMPLIANCE_RULES.md` has a generated table (`npm run rules:doc`) and a test fails if they differ. Every rule carries basis (legal/guidance/policy), source, duty holder, `status` and `last_checked`.
- **Why:** Hamida can review one readable table; developers change one file; legal claims are traceable and dated.

## ADR-0005: "Not recorded" is never green; support workers are never notified

- **Status:** accepted as business rule (support workers: Mark via Hamida, 19 Nov 2026). "Not recorded" handling is proposed (BR-13).
- **Decision:** Enforced in code (`NEVER_NOTIFY`, `RAG.NOT_RECORDED`) and covered by tests.

## ADR-0006: No runtime dependencies until needed

- **Status:** accepted (19 Nov 2026).
- **Decision:** The skeleton uses only Node's standard library and `node:test`. Candidate libraries are listed in `docs/RESEARCH.md` and added only with an ADR when a feature needs them (e.g. Excel import for BR-11).

## ADR-0007: Staff sign in with company Microsoft accounts (Entra ID)

- **Status:** accepted (20 Nov 2026), IT requirement relayed by ZACK.
- **Applies to the Operations app too** (confirmed by ZACK 2026-11-20). Its own-password sign-in does not meet the rule; resolution pending with IT.
- **Consequences:** Mark's app cannot use the Operations app's own password accounts. Roles (director, service manager, deputy, team leader) should come from Entra ID groups or an app role table keyed by the Microsoft account, so leavers lose access when IT disables their account. The Monday email can go from a company mailbox via Microsoft Graph or Power Automate. The Operations app itself may need the same change: ask IT whether the rule applies to its go-live on 24 Nov.

## ADR-0008: The JavaScript rules engine is the reference; Power Platform must match it

- **Status:** accepted (20 Nov 2026).
- **Decision:** `src/rules/` and its tests define the behaviour. `docs/RAG_ACCEPTANCE_SCENARIOS.md` lists the cases the nightly RAG flow and the Power Fx formula must pass. Rules stay mastered in `config/rules.json` and are exported to the TrackerTypes list (`npm run export:tracker-types`).
- **Why:** Power Fx and flow logic are hard to unit test; a tested reference catches mistakes before Mark sees a wrong red.

## ADR-0010: QA app preview built like the Operations app; live build on Microsoft 365

- **Status:** proposed (26 Nov 2026), ZACK asked for the QA app "as you made the Esto Care Operations app".
- **Decision:** The QA & Compliance app is built in `app/` the same way as the Operations app: one page, vanilla JavaScript, inlined by a build script (`npm run build:app`), published as a Claude artifact for review. Its logic lives in `src/qa/` (pure, tested, no dependencies) next to `src/rules/`, and is inlined into the page so the preview always behaves like the tests. Data shapes match the SharePoint lists in `docs/QA_APP.md`.
- **Why:** Mark, Hamida and managers can click through every screen now, while IT's Microsoft sign-in rule (ADR-0007) still points the live build at Microsoft 365 (ADR-0002). One logic, two front ends at most.
- **Consequences:** The preview has no real sign-in and holds data in the browser only, so it must never hold real names or resident data. Before go-live, choose with IT: Power Apps canvas app, or this page hosted in SharePoint with Microsoft sign-in (ELICITATION Q6). Flows must pass the same cases as `tests/qa.test.js`.
- **Pilot home** changes from the Grange to Hall Close (Mark's email, 25 Nov 2026).

