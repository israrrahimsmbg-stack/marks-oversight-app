---
name: estocare-ops-app-context
description: Use for anything involving the existing Esto Care Operations app (Phase 0): its code, data, roles, compliance checks, build and publishing, or how Mark's app plugs into it.
last_reviewed: 2026-11-20
review_every_days: 30
---

# Esto Care Operations app context

Full notes: `docs/ESTOCARE_OPS_APP.md`. Re-read the repo when it changes; don't rely on memory.

## Facts (checked 19 Nov 2026 at commit 6de8f07)

- Repo: `israrrahimsmbg-stack/esto-care-operations` (private). Also exists: `esto-care-operations-gpt`. Confirm with ZACK which one is live.
- Vanilla JS single-page app → `python3 tools/build.py` → one `index.html` → published to the same Claude artifact URL so live data is kept.
- Data in the artifact's shared database: `homes`, `units`, `activity`, `appusers`, `authaudit`, `directory`, `integrations` (resident collections disabled: records stay in PCS).
- Roles: super-admin, director, home-manager, contributor, viewer; per-home scope.
- Compliance states: ok / due (≤30 days) / overdue / na / unknown, stored at `homes/<id>.compliance[<key>]`.
- 24 services listed (South S01–S14, North N01–N10) from estocare.com, Oct 2026. Mark Horton is listed as the South contact.

## Sign-in rule (2026-11-20)

IT requires company Microsoft accounts (ADR-0007). This app's own PBKDF2 accounts don't meet that; check with ZACK whether it affects the Phase 0 go-live, and don't build Mark's app on these accounts.

## Phase 0 status

- Validation: Zara and Hamida (compliance), Jawad (finance), week of 19 Nov.
- Demo to Abi Mon 23 Nov; go live Tue 24 Nov 2026.
- Don't change the live app for Mark's work before go-live unless Yasmin asks.

## How to work with it

1. Attach the repo (read) and clone shallow.
2. Keep Mark's logic in this repo's `src/rules/` and copy it into the ops app build; don't fork logic.
3. Map states: ok→GREEN, due→AMBER, overdue→RED, unknown→NOT_RECORDED, na→NA.
4. Gaps to close for Mark's app: deputy/team-leader roles, support-worker flag, `actions` and append-only `updates` collections, owner/next-step fields, scheduled report delivery.
5. Publishing the artifact affects live users: confirm with ZACK before any publish.
