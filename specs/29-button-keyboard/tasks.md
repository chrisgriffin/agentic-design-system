# Tasks

## Phase 1: Red

- [x] T001 Run the runnable line on `develop`: it prints `0` and exits 1.

## Phase 2: Build

- [x] T002 `components/button/button.test.tsx`: Tab reaches an enabled Button; Enter fires `onClick` once; Space fires `onClick` once.
- [x] T003 `components/button/button.test.tsx`: a disabled Button is skipped by Tab and fires nothing on Enter or Space.
- [x] T004 Prove the tests bite: with the button given `tabIndex={-1}`, the Tab test fails; restore.

## Phase 3: Surfaces

- [x] T005 `docs/testing.md`: the keyboard bullet under § What is tested.
- [x] T006 `specs/20261111-144012-a11y-in-the-gate/spec.md` and `checklists/gate.md` CHK034 point at this spec.

## Phase 4: Green

- [x] T007 The runnable line prints 1 or more and exits 0; `npm run verify` green.
