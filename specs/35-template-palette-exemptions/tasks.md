# Tasks

## Phase 1: Red

- [x] T001 Two `#35` tests in `cli/init-manifest.test.mjs` fail on `develop`'s `design-delta.json`: the template's audit and the init'd copy's each list 50 findings.

## Phase 2: Build

- [x] T002 `design-delta.json`: `tokens/token-unreferenced` ignores `tokens/json/primitives/*`.
- [x] T003 `design-delta.json`: one `accepted` exemption with a reason per unused semantic token, by literal id.
- [x] T004 `README.md` § Tokens states the choice; the config's `_doc` keys point at it.
- [x] T005 `docs/testing.md` names the new tests.
- [x] T006 File the engine's exemption gap: chrisgriffin/design-delta#43.

## Phase 3: Green

- [x] T007 `npm run drift:audit` prints `0 review(s)` with and without `tokens/css`, the `#35` tests pass, and `npm run verify` is green.
