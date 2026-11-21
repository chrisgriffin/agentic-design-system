# Tasks

## Phase 1: Red

- [x] T001 Run the runnable line on `develop`: it prints `0`.

## Phase 2: Build

- [x] T002 `test-utils/variants.ts`: `variantCases(contract)` over code-side enums, skipping `code: none`.
- [x] T003 `test-utils/a11y-coverage.test.ts`: cases for the helper (product, `code: none` skipped, no enum → defaults); a check per contract with a code-side enum that its folder's test imports it and calls `variantCases`.
- [x] T004 `badge`, `button`, `card` tests: replace the hand-typed lists with `variantCases` on their contract.
- [x] T005 `scripts/scaffold-component.mjs`: the first test uses `variantCases` on the new contract.

## Phase 3: Green

- [x] T006 The runnable line prints a number greater than 0; a scaffolded probe passes `npm test`, then is deleted; `npm run verify` green.

## Phase 4: Surfaces

- [x] T007 `docs/testing.md` and `docs/architecture.md` updated.
- [x] T008 `README.md`, `CLAUDE.md`: read, no change needed. cost: none.
