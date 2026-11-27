# Plan: the template runs on design-delta 0.29.0

## Design

- `npx npm@10 install design-delta@^0.29.0` (docs/architecture.md's procedure for a new minor), then `npx design-delta dock` and Prettier.
- 0.29.0's `styles` check keeps only the winning background, so `.success` and `.danger` restating the root's `color-bg-muted` background read as an undeclared binding. The contract is the source of truth and declares no variant background, so the two redundant declarations go; the rendered background and every contrast pair are unchanged.

## Surfaces touched

- `package.json`, `package-lock.json`: the engine at `^0.29.0`, resolved to 0.29.0.
- `.claude/skills/design-delta*/`: the stubs `dock` writes.
- `components/badge/badge.module.css`: two redundant background declarations removed.
- `README.md`, `docs/architecture.md`: the version and the dock's stubs.
- `CLAUDE.md` § Agent layer: the `agentic-ds-*` skills take precedence over the engine's token and build stubs.
- Published surface: none. The packed create command's files are unchanged.
- CI, required checks: none.
