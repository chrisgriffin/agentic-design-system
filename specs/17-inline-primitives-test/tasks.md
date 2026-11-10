# Tasks

## Phase 1: Red

- [x] T001 Run the runnable line on `develop`: it prints 0. Build `tokens.css` there and keep its hash.

## Phase 2: Build

- [x] T002 `tokens/scripts/inline-primitives.test.mjs`, failing while the module does not exist.
- [x] T003 Move `inlinePrimitives` into `tokens/scripts/inline-primitives.mjs`; `build-css.mjs` imports it and exports nothing.
- [x] T004 Drop `export` from `tokenIds` and `primitives` in `source.mjs`.
- [x] T005 `docs/architecture.md`: name the module and its test in the token paragraph.

## Phase 3: Green

- [x] T006 Rebuild `tokens.css` and compare its hash with T001's; run the runnable line; `npm run verify` green.
