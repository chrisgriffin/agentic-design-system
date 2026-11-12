# Tasks

## Phase 1: Red

- [ ] T001 Run the runnable line on `develop`: it exits 1, because `npm test` passes with the untested probe folder in place.

## Phase 2: Build

- [ ] T002 `test-utils/a11y-coverage.test.ts`: one case per component folder under `components/`, failing and naming the folder when it holds no `.test.tsx`; fails when no component folders are found.

## Phase 3: Green

- [ ] T003 The badge, button and card folders pass; a folder from `npm run scaffold -- zz-scaffold` passes, then the folder is deleted.
- [ ] T004 The runnable line exits 0; `npm run verify` green.

## Phase 4: Surfaces

- [ ] T005 `docs/testing.md`: § What is tested and § Adding a test say the gate fails a component folder with no test file.
- [ ] T006 `docs/architecture.md`: `test-utils/` says `a11y-coverage.test.ts` also fails a component folder with no test.
- [ ] T007 `CLAUDE.md`, `README.md` and `scripts/scaffold-component.mjs`: read, no change needed.
- [ ] T008 cost: none; no trigger, cron or agent fire added.
