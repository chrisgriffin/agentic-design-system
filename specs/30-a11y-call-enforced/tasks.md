# Tasks

## Phase 1: Red

- [x] T001 Run the runnable line on `develop`: it exits 1, because `npm test` passes with the probe in place.

## Phase 2: Build

- [x] T002 `test-utils/a11y-coverage.test.ts`: one case per `components/**/*.test.tsx`, failing and naming the file when it never calls `expectNoViolations`; fails when no files are found.
- [x] T003 `vite.config.ts`: `include` gains `test-utils/**/*.test.ts`.

## Phase 3: Surfaces

- [x] T004 `docs/testing.md`: § Running tests, § What is tested and § Adding a test say the gate enforces the call.
- [x] T005 `docs/architecture.md`: `test-utils/` names the new test.

## Phase 4: Green

- [x] T006 The badge, button and card tests pass; a file from `npm run scaffold -- zz-scaffold` passes, then the directory is deleted.
- [x] T007 The runnable line exits 0; `npm run verify` green.
