# Plan: A created system's docs say where its own specs live

## Technical context

- Docs only: one new bullet in `docs/architecture.md` § Everything else in the repo, placed after the marked `specs/` bullet and outside its `<!-- init -->` pair.
- No test suite covers this prose; the runnable line (which applies init's own strip regex) and `npm run verify` are the checks.

## Surfaces touched

- `docs/architecture.md` — § Everything else in the repo gains the unmarked bullet; the marked template bullet is untouched.
- `scripts/init.mjs` — read; its marker strip and its removal of `specs` are what the new bullet describes, unchanged.
- `README.md` — read; its one `specs/` mention is in the "Starting your own" section init removes, correct for the template, unchanged.
- `.claude/skills/setup-system/SKILL.md` — read; it rewrites the docs that still describe the template and names no spec path, unchanged.
- none of `CLAUDE.md` § Architecture's couplings; no directory added or removed, no Routine, cron, ruleset, workflow or vault note.
