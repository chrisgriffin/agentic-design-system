# Spec: docs/testing.md and CLAUDE.md name everything npm test and the typecheck actually run

**Issue**: [#77](https://github.com/chrisgriffin/agentic-design-system/issues/77)

## Overview

Two lines in the template's docs say the gate runs less than it does. `docs/testing.md`'s `npm test` bullet names only `tokens/scripts/*.test.mjs` under `node --test`, though `package.json` also runs `cli/*.test.mjs` in the template. `CLAUDE.md`'s `npm run typecheck` comment leaves out `tokens/scripts`, which `tsconfig.json`'s `include` covers.

## User scenarios

- An agent reads `docs/testing.md` to learn what `npm test` runs and finds the `cli/` suite named in the template, and not named in a created copy, where init removes it.
- An agent reads `CLAUDE.md` § Commands and sees every path the typecheck covers.

## Functional requirements

- FR-001: `docs/testing.md`'s `npm test` bullet names `cli/*.test.mjs` inside an inline `<!-- init -->` … `<!-- /init -->` pair, so the sentence holds before init and after it.
- FR-002: `CLAUDE.md`'s `npm run typecheck` line names every entry of `tsconfig.json`'s `include`, `tokens/scripts` included.

## Success criteria

- [ ] `docs/testing.md`'s `npm test` bullet names the `cli/*.test.mjs` suite in the template, and a created copy (after init) does not mention it.
- [ ] `CLAUDE.md`'s `npm run typecheck` line names everything `tsconfig.json`'s `include` covers, `tokens/scripts` included.
- [ ] **Runnable:** `grep -c 'cli/\*\.test\.mjs' docs/testing.md` prints `1` or more (prints `0` on `develop`).

## Out of scope

- Any change to what `npm test` or the typecheck runs.
