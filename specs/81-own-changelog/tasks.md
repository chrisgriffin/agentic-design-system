# Tasks

## Phase 1: Red

- [x] T001 With `scripts/init.mjs` as on `develop`, `node --test cli/init-manifest.test.mjs` fails the #79 check and both #81 tests.

## Phase 2: Build

- [x] T002 `scripts/init.mjs`: cut `CHANGELOG.md` at the first release heading of either level.
- [x] T003 `scripts/init.mjs`: reset `version` to `0.0.0` in `package.json` and the lock file.
- [x] T004 `cli/init-manifest.test.mjs`: the patch and minor release fixture, the released version, and the two `#81` tests.
- [x] T005 The USAGE text, `README.md`, `docs/architecture.md`, `docs/testing.md` and the `init-check.yml` header say init drops the release entries and resets the version.

## Phase 3: Green

- [x] T006 The runnable line passes 7 of 7, and `npm run verify` is green.
