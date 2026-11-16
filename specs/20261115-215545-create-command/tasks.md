# Tasks

## Phase 1: Red

- [x] T001 Run the runnable line on `develop`: it fails, since there is no `cli/create.mjs`.

## Phase 2: Build

- [x] T002 `cli/create.mjs`: arguments, `--help`, validation asked of `scripts/init.mjs --check`.
- [x] T003 The clone, the fresh git history.
- [x] T004 The hand-off to the copy's `scripts/init.mjs`.
- [x] T005 Questions in a terminal with defaults; exit 1 naming the flag with no terminal.
- [x] T006 Refuse a target folder that exists and is not empty, before any write.
- [x] T007 `cli/create.test.mjs`, and `cli/*.test.mjs` in the `test` script.
- [x] T008 `scripts/init.mjs` removes `cli/`, the `bin` entry and the CLI test glob from a copy.
- [x] T009 `init-check.yml`: the create step, with no token and `GIT_SSH_COMMAND=false`.
- [x] T010 `package.json` `bin`.
- [x] T011 README "Starting your own"; `docs/architecture.md`; `docs/testing.md`.

## Phase 3: Green

- [x] T012 `node cli/create.mjs sample-system --prefix sds --owner sample-owner --dir <temp> --from <this checkout>` creates a system whose `npm run verify` exits 0, with no token and no SSH key.
- [x] T013 The runnable line prints the usage line; `npm run verify` exits 0 on the branch.
- [ ] T014 (after merge) `npx github:chrisgriffin/agentic-design-system sample-system --prefix sds --owner sample-owner` from an empty folder creates a system that verifies.
- [ ] T015 (after merge) The owner's record of what this template offers names the create command.
