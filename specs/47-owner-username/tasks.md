# Tasks

## Phase 1: Red

- [x] T001 `cli/create.test.mjs`: add "--help calls --owner your GitHub username"; it fails on `develop`.

## Phase 2: Build

- [x] T002 `README.md`: "and your GitHub username", `--owner my-username`.
- [x] T003 `cli/create.mjs`: usage `<github-username>`, help line and prompt "Your GitHub username".
- [x] T004 `scripts/init.mjs`: usage `<github-username>`, help line "your GitHub username (today: chrisgriffin)".
- [x] T005 `docs/testing.md`: name the help-text check in the `cli/create.test.mjs` entry.

## Phase 3: Green

- [x] T006 The new test passes; the runnable line prints `0` for each file; `npm run verify` green.

## Phase 4: Surfaces

- [x] T007 `init-check.yml` read: it passes flags and greps for init references, never the help text.
- [x] T008 No `CLAUDE.md` § Architecture coupling, Routine, ruleset, workflow or vault note touched.
