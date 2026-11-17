# Plan: The README's Development steps install with npm ci

## Technical context

- Docs only: one line in `README.md` § Development and one in `docs/architecture.md` § Running it, `npm install` → `npm ci`.
- No test suite covers README prose; the runnable line and `npm run verify` are the checks.

## Surfaces touched

- `README.md` — § Development code block, and its engine-move step, which now runs with npm 10.
- `docs/architecture.md` — § Running it code block, the same steps; changed so no doc still teaches a bare `npm install`; § How it connects' engine-move step runs with npm 10 too.
- `docs/adr/ADR-003-engine-from-the-registry.md` — read; it records the decision, unchanged.
- `scripts/init.mjs` — read; already `npm ci`, and the § Development section it keeps in a copy now matches it.
- none of `CLAUDE.md` § Architecture's couplings; no Routine, cron, ruleset, workflow or vault note.
