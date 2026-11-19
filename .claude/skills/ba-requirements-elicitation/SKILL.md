---
name: ba-requirements-elicitation
description: Use when processing meeting notes, Teams transcripts, emails or documents from Mark, Yasmin, Hamida or others, writing questions for the next meeting, or updating the BRD, assumptions and elicitation log.
last_reviewed: 2026-11-19
review_every_days: 60
---

# BA requirements elicitation

Zakir is the BA and developer. Help him capture what stakeholders actually said, find gaps, and keep the BRD honest.

## Processing a transcript or meeting notes

1. Convert `.docx` with `pandoc file.docx -t gfm` (images are just speaker avatars; drop them).
2. Extract, with timestamps where possible:
   - **Requirements** (what someone wants the app to do) → `docs/BRD.md` (new BR-xx or update existing).
   - **Decisions** (who decided what) → `memory/decisions.md`.
   - **Answers** to open questions → `docs/ELICITATION.md` (fill Answer, set Status `answered (date, who)`).
   - **Assumptions** confirmed or broken → `docs/ASSUMPTIONS_AND_OPEN_QUESTIONS.md`.
   - **Actions** (who will send what, by when) → `memory/meeting-log.md`.
   - **New terms** → `docs/GLOSSARY.md`.
3. Quote the speaker for anything important ("Mark, 18 Nov: 'I need to know the actions behind it'"). Do not paraphrase into certainty: if a speaker was vague, say so.
4. Transcripts mis-hear names (e.g. "Kamida" = Hamida, "Jihad" may be Jawad, "Legion ELA" = legionella). Check against `memory/stakeholders.md` and flag guesses.
5. Never copy resident names or personal details from transcripts into the repo.

## Writing questions

- One question per row, with an ID (section letter + number), who to ask, ★ for priority.
- Ask for **examples and documents**, not opinions ("show me last month's tracker" beats "how often do you check?").
- For every rule ask: who does it, who owns it, how often, what counts as done, what evidence, what happens if missed.
- Watch for the known tension: Mark asks for "everything"; Yasmin wants one stage at a time. Frame questions so Mark can rank.

## Keeping the BRD honest

- `[ASSUMPTION]` and `[TBC]` stay until a named person confirms.
- Priority uses MoSCoW. Don't upgrade to Must without the sponsor (Mark).
- Bump the BRD version and `last_reviewed`, and add a changelog line at the bottom when it changes materially.
- Sign-off: Mark signs the BRD per phase; Hamida signs compliance rules.

## Stakeholder cues (from meetings so far)

- **Mark:** outcome-focused, wants to be told, not to search; hates being caught out by Abi; wants actions and owners behind every number; wants to challenge priority.
- **Yasmin:** pragmatic, phases work, protects Zakir from overload, owns go-live.
- **Hamida:** detail owner of trackers and QA; wants managers to own it, head office last resort.
