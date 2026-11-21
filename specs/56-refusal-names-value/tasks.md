# Tasks

## Phase 1: Red

- [x] T001 `cli/create.test.mjs`: #56 tests for init's named reason, create's first and clone checks, and the quoted empty argument fail on `develop`; the runnable line prints 0.

## Phase 2: Build

- [x] T002 `scripts/init.mjs`: per-flag `RULES`, one refusal line per value, quoted values, quoted unknown argument.
- [x] T003 `cli/create.mjs`: `initRefusal()` passes init's reason through on both checks.
- [x] T004 `cli/create.test.mjs`: #49 and #52 tests updated to the named reason and quoted argument.
- [x] T005 `docs/architecture.md`: both check descriptions.

## Phase 3: Green

- [x] T006 `node --test cli/create.test.mjs` green; the runnable line prints 1; `npm run verify` green.

## Phase 4: Surfaces

- [x] T007 No workflow, `CLAUDE.md` § Architecture coupling, Routine, cron or vault note touched.
