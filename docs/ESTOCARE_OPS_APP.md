---
title: The existing Esto Care Operations app (Phase 0)
source: github.com/israrrahimsmbg-stack/esto-care-operations @ 6de8f07 ("Switch to beds-only: resident records stay in PCS")
last_reviewed: 2026-11-19
review_every_days: 30
---

# Esto Care Operations app: what it is and how Mark's app fits

Read from the repo on 19 Nov 2026. **ZACK to confirm this is the version going live on Tue 24 Nov** (AS-02). The coordinator's brief mentions housing benefit and money loss, which were not obvious in this code; there is also an `esto-care-operations-gpt` repo.

## Stack

- Single-page app in **vanilla JavaScript**, no framework. Source in `src/` (`core.js`, `auth.js`, `admin.js`, `flows.js`, `views1-3.js`, `beds.js`, `regs.js`, `directory.js`, `style.css`, `shell.html`).
- `tools/build.py` concatenates everything (plus `data/homes.json` and `data/geo3.json`) into one `index.html`.
- Published as a **Claude artifact**; live data is in the artifact's **shared database** (Firestore-style `db.collection(...)`).
- Collections seen: `homes`, `units`, `residents`, `carelog`, `activity`, `appusers`, `authaudit`, `directory`, `integrations`.
- Own sign-in: salted PBKDF2-SHA256 password hashes, 12-hour sessions, lockout after 5 failures, live revocation.

## Roles already in place

| Role | Scope |
|---|---|
| super-admin | Everything |
| director | All homes and sections; manages users (Mark fits here) |
| home-manager | Assigned homes: rooms, compliance (write) |
| contributor | Front-line staff (read most, write people/care) |
| viewer | Read-only |

Per-home scoping (`inScope`) limits non-admins to their homes. **Gap for Mark's app:** there is no separate *deputy* or *team leader* role, and no *support worker* flag, which escalation needs. Propose adding `deputy-manager` and `team-leader` (or a "position" field on home-manager/contributor).

## Compliance today

- `CHECKS` in `regs.js`: per-home items tied to sources (CQC registration, manager in post, PAMMS rating, fire risk assessment, gas, electrical, DBS, Oliver McGowan training, DoLS, medicines audit, CQC notifications, HMO, s117).
- State per item: `ok`, `due` (within 30 days), `overdue`, `na`, `unknown` (`compState` in `core.js`). Data held at `homes/<id>.compliance[<key>] = {status, due, note}`.
- This maps cleanly onto Mark's app: `ok→GREEN`, `due→AMBER`, `overdue→RED`, `unknown→NOT_RECORDED`, `na→NA`. Mark's app adds: owner, next action, history, forward look, escalation, more item types (weekly/fortnightly checks).

## Data and privacy decisions already made

- Resident records stay in **PCS** (latest commit). People/care views are switched off.
- No resident data in the repo. DPIA flagged as needed before real names.

## Integration plan for Phase 1 (proposed)

1. Copy `src/rules/*.js` into the Operations app build (or load as a module) and add `config/rules.json` as data.
2. Add an **Oversight** view (director and head office only): RAG summary, reds without a plan, by-service table, forward look; each row opens the item with owner, next action and history.
3. Add `actions` and `updates` (append-only) collections.
4. Extend the compliance editor so a manager can set owner + next step + date in two taps.
5. Monday email via ADR-0003.

## Sign-in rule applies (2026-11-20)

ZACK confirmed IT's rule (company Microsoft accounts only) applies to this app as well. It currently uses its own PBKDF2 password accounts inside a Claude artifact. How this is resolved at or after go-live is for ZACK and IT; record the outcome here as an ADR when known.
