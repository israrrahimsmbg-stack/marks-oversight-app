# Clickable prototype of Mark's app

A working, clickable web version of the oversight app so Mark and the team can **see and click through** every screen before the real one is built. It is a prototype, not the system itself.

## What it is (and is not)

- **It is** a single web page you can open in a browser, with realistic sample data for 14 invented South services. You can switch who you are signed in as, change the "today" date, drill into any number, open any item, add an owner and next step, and tick a check as done.
- **It is not** the real app. There is **no real sign-in** (a role switcher stands in for it), nothing you change is saved anywhere, and there is **no real data** — every service, person and certificate is invented. Compliance rules are drafts and shown as **UNVERIFIED** until the compliance lead signs them off.

## Why a web prototype when the real build is Power Apps

The agreed platform is **Power Apps + Power Automate on SharePoint** (ADR-0002), because IT requires company Microsoft sign-in (ADR-0007). That cannot be built or shared as a single link. This prototype shows the same screens, the same RAG logic and the same Monday report so Mark can react now, and the data model lines up with `docs/POWER_PLATFORM_DESIGN.md` so it maps onto SharePoint Lists later.

The RAG status, due dates, escalation and the Monday report are all produced by the **tested rules engine** in `src/rules/` (ADR-0008) — the prototype inlines it at build time, so what you see on screen is exactly what the engine and the real flows must produce.

## Screens

| Tab | Who it's for | Shows |
|---|---|---|
| **Monday report** | Mark, head office | RAG totals, reds with no owner/plan first, all reds, by-service table, forward look (7/14/30/90 days), by area. Every number drills down. |
| **Service checklists / Today's checks** | Service managers, deputies, team leaders | The "click, click, click" screen: today's due and overdue checks as big buttons; one tap records it done with today's date. |
| **Who gets told** | Everyone | The escalation ladder in action: who is in each person's digest today. Support workers appear nowhere, by design. |
| **Rules and sources** | Compliance lead | Every tracker type, how often, whether it is legal / guidance / policy, its source link, and its sign-off status. |
| **The Monday email** | Mark | The exact email text the engine produces, ready to send from a shared mailbox. |

## See it

- **Build:** `npm run build:prototype` → writes `prototype/dist/index.html` (standalone) and `prototype/dist/artifact.html`.
- **Open locally:** open `prototype/dist/index.html` in any browser.
- **Online:** published to GitHub Pages on each push to the default branch (see `.github/workflows/pages.yml`).

Do not edit anything in `prototype/dist/` by hand — it is generated. Edit `prototype/app/`, `prototype/data/` or `prototype/shell.html` and rebuild.
