# Tasks

## Phase 1: Red

- [x] T001 Run the runnable line on `develop`: it prints `0`.

## Phase 2: Build

- [x] T002 `README.md` § Development: `npm install` → `npm ci`.
- [x] T003 `docs/architecture.md` § Running it: `npm install` → `npm ci`.
- [x] T003a The engine-move step in `README.md` § Development and `docs/architecture.md` § How it connects: `npm install design-delta@^<version>` → `npx npm@10 install design-delta@^<version>`.

## Phase 3: Green

- [x] T004 The runnable line prints 1 or more; `npm run verify` green.

## Phase 4: Surfaces

- [x] T005 ADR-003 and `scripts/init.mjs` read: ADR-003 records the decision and stays; init already runs `npm ci`.
- [x] T006 No `CLAUDE.md` § Architecture coupling, Routine, ruleset or workflow touched.
