# Tasks

## Phase 1: Red

- [x] T001 Run the runnable line on `develop`: it fails, since there is no `design-delta.json`.

## Phase 2: Build

- [x] T002 Install React, Vite, Vitest, jsdom, Testing Library, Storybook types, Code Connect and design-delta; `vite.config.ts` and `vitest.setup.ts`.
- [x] T003 `design-delta.json` with explicit paths and conventions; `.design-delta/` output ignored.
- [x] T004 `components/badge`: the seven files.
- [x] T005 `components/button`: the seven files, with the slot and the design-only axis.
- [x] T006 `components/card`: the seven files plus `card-header.*` and `Card.Header`.
- [x] T007 Scripts: `drift:*` and the `verify` chain; README components section; Stylelint class pattern.

## Phase 3: Green

- [x] T008 `npm run verify` green, `drift:verify` with no finding at warn or above; the runnable line prints `true`.
