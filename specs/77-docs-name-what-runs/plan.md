# Plan: docs/testing.md and CLAUDE.md name everything npm test and the typecheck actually run

## Technical context

- `docs/testing.md` § Running tests, the `npm test` bullet: add `and`cli/*.test.mjs`` inside an inline `<!-- init -->` pair. `scripts/init.mjs` strips every `<!-- init -->` … `<!-- /init -->` span and drops ` cli/*.test.mjs` from the script, so a copy's sentence and script agree.
- `CLAUDE.md` § Commands: the typecheck comment lists `tsconfig.json`'s `include` in its order, `tokens/scripts` added.

## Surfaces touched

- `docs/testing.md`, `CLAUDE.md`.
- `cost` — none: no workflow, trigger, job name or ruleset change.
