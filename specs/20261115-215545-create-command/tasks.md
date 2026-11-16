# Tasks

## Phase 1: Red

- [ ] T001 Run the runnable line on `develop`: it fails, since there is no `cli/create.mjs`.

## Phase 2: Build

- [ ] T002 `cli/create.mjs`: arguments, `--help`, validation shared with `scripts/init.mjs`.
- [ ] T003 The copy with its skip list, the `bin` entry dropped from the copy, `git init`.
- [ ] T004 The hand-off to the copy's `scripts/init.mjs`.
- [ ] T005 Questions in a terminal with defaults; exit 1 naming the flag with no terminal.
- [ ] T006 Refuse a target folder that exists and is not empty, before any write.
- [ ] T007 `cli/create.test.mjs`, and `cli/*.test.mjs` in the `test` script.
- [ ] T008 `scripts/init.mjs` drops the create passages from a copy.
- [ ] T009 `init-check.yml`: the create step, with no token and `GIT_SSH_COMMAND=false`.
- [ ] T010 `package.json` `bin`.
- [ ] T011 README "Starting your own"; `docs/architecture.md`; `docs/testing.md`; `CLAUDE.md`.

## Phase 3: Green

- [ ] T012 `npx <path to this checkout> sample-system --prefix sds --owner sample-owner --dir <temp>` creates a system whose `npm run verify` exits 0, with no token and no SSH key.
- [ ] T013 The runnable line prints the usage line; `npm run verify` exits 0 on the branch.
- [ ] T014 (after merge) `npx github:chrisgriffin/agentic-design-system sample-system --prefix sds --owner sample-owner` from an empty folder creates a system that verifies.
- [ ] T015 (after merge) The vault's System Map entry for this repo names the create command.
