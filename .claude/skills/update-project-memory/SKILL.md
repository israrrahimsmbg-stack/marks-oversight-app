---
name: update-project-memory
description: Use at the end of every working session, and straight after any meeting, transcript, decision or requirement change, to keep memory/, docs/ and the skills themselves up to date.
last_reviewed: 2026-11-19
review_every_days: 60
---

# Update project memory

The project outlives any one session. Anything a future session would otherwise have to ask Zakir again must be written down **before you finish**.

## Checklist (do all that apply)

1. **Meeting or transcript processed?** Add a dated entry to `memory/meeting-log.md`: date, attendees, 3–6 key points, decisions, actions (who, what, by when). Then run the `ba-requirements-elicitation` skill steps.
2. **Decision made?** Add to `memory/decisions.md` (date, decision, who decided, source). If it shapes the system, also add/supersede an ADR in `docs/DECISIONS.md`.
3. **Question answered?** Update `docs/ELICITATION.md`, `docs/ASSUMPTIONS_AND_OPEN_QUESTIONS.md` and the BRD.
4. **New person or role change?** Update `memory/stakeholders.md`. Use role, not personal details beyond work name.
5. **Rule changed or verified?** `config/rules.json` → `npm run rules:doc` → `npm test`. Record who verified and when.
6. **State moved on?** Rewrite `memory/current-state.md`: phase, done, next, blockers, dates. Keep it under one screen.
7. **Skill wrong or stale?** Fix that skill's `SKILL.md` now and bump its `last_reviewed`. Skills are living documents: when you learn how the business really works, the skill should change.
8. **Reviewed a doc and it's still right?** Bump its `last_reviewed`.
9. Update `memory/MEMORY.md` index if you added a file.
10. Run `npm test` and `npm run check:freshness`. Fix or list anything stale in `memory/current-state.md`.
11. Commit with a message that says what changed in plain words (e.g. "Record Hamida's tracker list; add 3 rules").

## Style

- Dates as absolute dates (2026-11-24), never "next Tuesday".
- Facts with a source ("Hamida, 19 Nov transcript").
- No resident or staff personal data beyond work names and roles. No secrets.
- Keep files short; split by subject rather than growing one huge file.
