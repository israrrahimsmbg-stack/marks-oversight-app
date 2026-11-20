---
title: Architecture decision records
last_reviewed: 2026-11-20
review_every_days: 30
---

# Decision log (ADRs)

Format: one section per decision. Status is `proposed`, `accepted`, `superseded by ADR-xxxx`, or `rejected`. Never delete an ADR; supersede it. Business decisions (who, what, when) go in `memory/decisions.md`; this file is for decisions that shape the system.

---

## ADR-0001: Phase 1 is built on the existing Esto Care Operations app, with a portable rules engine

- **Status:** at risk (20 Nov 2026): the Operations app uses its own password accounts and runs as a Claude artifact, which does not meet IT's Microsoft sign-in rule (ADR-0007). The portable rules engine part still stands.
- **Context:** Mark wants a Monday report quickly. The Operations app (single-page JS, Claude artifact, shared database, own sign-in and roles) already holds the homes, roles and a compliance section, and goes live 24 Nov. Hosting, sign-in and DPIA questions for any new platform are unanswered.
- **Decision:** Add an "Oversight" view to the Operations app for Phase 1. Keep all RAG, schedule, escalation and report logic in `src/rules/` of this repo as pure, dependency-free ES modules, so they can be copied into the Operations app build and later moved to any platform.
- **Consequences:** + fastest path to Mark; + one system for users. − Scheduled email needs something outside the page (ADR-0003). − Long-term platform still open (ADR-0002).

## ADR-0002: Long-term platform

- **Status:** open, narrowed (20 Nov 2026). Microsoft sign-in is required, so the choice is now **B (Power Platform)** or **C (web app on Azure with Entra ID)**; A only survives if it is rehosted behind Microsoft sign-in. Recommendation: C on Azure Static Web Apps (built-in Entra ID sign-in) + Azure Functions (timer trigger for the Monday report, runs `src/rules` unchanged) + a UK South data store, because it reuses the JavaScript already written for both apps. B is the fallback if IT prefers no Azure subscription. Needs ZACK/IT decision.
- **Options:** (A) keep extending the Operations app; (B) Microsoft 365 low-code: SharePoint Lists + Power Apps + Power Automate, with Entra ID sign-in; (C) custom web app, e.g. Next.js + PostgreSQL + Entra ID (MSAL) + job queue, hosted in the UK.
- **Decide on:** IT's hosting and sign-in rules (ELICITATION E3, G4), DPIA outcome (G3), number of users (G5), whether managers will use phones (E5), and who maintains it if Zakir is away.

## ADR-0003: How the Monday report is sent

- **Status:** open.
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
- **Consequences:** Mark's app cannot use the Operations app's own password accounts. Roles (director, service manager, deputy, team leader) should come from Entra ID groups or an app role table keyed by the Microsoft account, so leavers lose access when IT disables their account. The Monday email can go from a company mailbox via Microsoft Graph or Power Automate. The Operations app itself may need the same change: ask IT whether the rule applies to its go-live on 24 Nov.
