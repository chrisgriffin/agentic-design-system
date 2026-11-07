# Tasks

## Phase 1: Red

- [x] T001 Run the runnable line on `develop`: it fails, since `.claude/` does not exist.

## Phase 2: Build

- [x] T002 `design-delta dock`; copy the two guard hooks; the `*.css` case; `.claude/settings.json`.
- [x] T003 `scripts/scaffold-component.mjs` and the `scaffold` script.
- [x] T004 `CLAUDE.md` and the README section.

## Phase 3: Green

- [x] T005 The three hooks exercised by hand (a force push blocked, a module checked, verify run); `npm run scaffold -- sample-tile` then `npm run verify` green with 6 tests; the probe removed; the runnable line prints `docked`.
