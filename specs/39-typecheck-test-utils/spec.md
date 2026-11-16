# Spec: The typecheck covers the gate's own tests in test-utils/

**Issue**: [#39](https://github.com/chrisgriffin/agentic-design-system/issues/39)

## Overview

`npm run typecheck` checked the components, the token scripts, Storybook and `types/`, but not the two gate tests under `test-utils/`. Those tests enforce the template's accessibility and contract invariants, so a type mistake in either one passed the gate. This puts `test-utils/` in the type-checked program and fixes the type errors that surfaces.

## User scenarios

- A person edits `test-utils/a11y-coverage.test.ts` and makes a type mistake: `npm run verify` fails and names the file and the line.
- A person removes `test-utils` from `tsconfig.json`: `npm test` fails and says the typecheck no longer covers the folder.

## Functional requirements

- FR-001: `tsconfig.json`'s `include` lists `test-utils`.
- FR-002: `test-utils/a11y-coverage.test.ts` type-checks: `import.meta.glob` is typed.
- FR-003: A test fails when `test-utils` leaves `tsconfig.json`'s `include`.
- FR-004: `docs/testing.md` and `CLAUDE.md` name `test-utils` where they list what the typecheck covers.

## Success criteria

- [x] Both test files under `test-utils/` are part of what `npm run typecheck` checks, so a type error in either one fails `npm run verify`.
- [x] **Runnable:** `npm run typecheck -- --listFilesOnly | grep -c "test-utils/.*\.test\.ts$"` prints `2` (it prints `0` on `develop`).
- [x] The docs that list what the typecheck covers name `test-utils/`.
- [x] `npm run verify` exits 0.

## Out of scope

- Type-checking the `.mjs` token scripts: they are plain ESM outside the program, as `docs/testing.md` says.
