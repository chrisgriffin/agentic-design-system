# Tasks

## Phase 1: Red

- [ ] T001 Run the runnable line on `develop`: it prints `built twice` and exits 1.

## Phase 2: Build

- [ ] T002 `package.json`: drop `&& npm run build-storybook` from `verify`.
- [ ] T003 `scripts/init.mjs`: `run("npm run build-storybook")` after `run("npm run verify")`, before the removals; usage text and closing message.
- [ ] T004 Prove T003: on a throwaway copy, break the Storybook build and run the init check's commands; the script exits non-zero and survives. Then the same copy unbroken passes.

## Phase 3: Surfaces

- [ ] T005 `.github/workflows/storybook-check.yml`, `build-check.yml`, `init-check.yml`: comments say which check builds the Storybook; no job renamed.
- [ ] T006 `docs/testing.md`: six-step chain, `storybook / ci` named as the Storybook gate.
- [ ] T007 `CLAUDE.md`: the `verify` line and the CI paragraph.
- [ ] T008 `README.md`: "Starting your own" names the Storybook build.
- [ ] T009 `docs/architecture.md`: the gate sentence.
- [ ] T010 `specs/3-storybook/spec.md`, `specs/6-init-script/spec.md`: say what replaced `verify`'s Storybook build.
- [ ] T011 Cost line recorded in the PR body; no ruleset change, recorded there too.

## Phase 4: Green

- [ ] T012 The runnable line prints `built once`; `npm run verify` and `npm run build:tokens && npm run build-storybook` green.
