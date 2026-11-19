# Mark's App: Management Oversight and Internal Compliance

> **Status: DRAFT / discovery.** Requirements are still being gathered. Anything marked `[ASSUMPTION]` or `[TBC]` has not been confirmed by the business yet.

Mark Horton (Director, South) is accountable for everything that happens across the South services: compliance, finance, voids and more. Today he "doesn't know what he doesn't know". Trackers live in Excel, items go unchased for weeks (for example, a weekly fire log missed for up to three months), and when senior leadership asks, the answer is not to hand.

This app gives Mark that oversight **without him having to look for it**:

- an automatic **Monday report** (and maybe a daily exceptions summary) with a **RAG** status for every tracked item,
- a **forward look** (due in 7, 14, 30 and 90 days) next to the position today,
- a **drill-down** from every headline number to the item, its **owner**, the **next action** and its date,
- **escalation** when a tracker is not updated: service manager first, Mark and Hamida only as a last resort, support workers never,
- later, a simple **"click, click, click" tracker** for service managers, deputies and team leaders.

It extends the existing **Esto Care Operations app** (Phase 0, going live Tue 24 Nov 2026). See [`docs/PLAN.md`](docs/PLAN.md).

## Where things are

| Path | What it holds |
|---|---|
| [`CLAUDE.md`](CLAUDE.md) | How Claude works in this repo: persona, rules, and the "update memory at the end of every session" rule |
| [`docs/PLAN.md`](docs/PLAN.md) | Phased delivery plan, architecture recommendation, risks, milestones |
| [`docs/BRD.md`](docs/BRD.md) | Business requirements (from Zakir's draft v0.1) |
| [`docs/ELICITATION.md`](docs/ELICITATION.md) | Questions still to ask, with who to ask and answers as they come in |
| [`docs/DECISIONS.md`](docs/DECISIONS.md) | Architecture decision records (ADRs) |
| [`docs/ASSUMPTIONS_AND_OPEN_QUESTIONS.md`](docs/ASSUMPTIONS_AND_OPEN_QUESTIONS.md) | Everything we are assuming, and what would change if it is wrong |
| [`docs/COMPLIANCE_RULES.md`](docs/COMPLIANCE_RULES.md) | Expiry and frequency rules per item type (**unverified until signed off**) |
| [`docs/GLOSSARY.md`](docs/GLOSSARY.md) | Terms and acronyms |
| [`docs/RESEARCH.md`](docs/RESEARCH.md) | Open-source libraries and tools considered, with licences and reasons |
| [`docs/ESTOCARE_OPS_APP.md`](docs/ESTOCARE_OPS_APP.md) | What the existing Operations app already does, and how this app fits on top |
| [`memory/`](memory/MEMORY.md) | Project memory: stakeholders, meeting log, decisions, current state |
| [`.claude/skills/`](.claude/skills) | Skills that load the right expertise for each kind of task |
| [`config/rules.json`](config/rules.json) | Machine-readable RAG and frequency rules (mirrors `COMPLIANCE_RULES.md`) |
| [`src/rules/`](src/rules) | Pure, dependency-free rules engine: RAG, next-due dates, escalation |
| [`scripts/weekly-report.mjs`](scripts/weekly-report.mjs) | Prints a sample Monday report from synthetic data |

## Try it

Needs Node.js 20 or later. There are no dependencies to install.

```bash
npm test                      # rules-engine tests
npm run report                # sample Monday report from data/sample/ (synthetic data only)
npm run check:freshness       # lists docs and rules that are due for review
```

## Data protection

**No real resident, service-user or staff personal data goes in this repository.** The sample data in `data/sample/` is invented. Live data stays in the operational system. A DPIA must be completed before the app processes personal data (see `docs/ASSUMPTIONS_AND_OPEN_QUESTIONS.md`).
