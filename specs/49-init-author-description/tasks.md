# Tasks

## Phase 1: Red

- [x] T001 `cli/create.test.mjs`: "--author and --description reach the init script as given" fails on `develop` (create refuses the unknown option).

## Phase 2: Build

- [x] T002 `scripts/init.mjs`: `--author`, `--description`, their defaults and one-line validation; `LICENSE`, `package.json` and README intro written; `specs` removed; `changed` a `Set`.
- [x] T003 `README.md`: intro split; "built in layers" note inside `<!-- init -->`; "Starting your own" names both flags and the `specs/` removal.
- [x] T004 `cli/create.mjs`: both flags passed through; usage; shell-quoted retry line.
- [x] T005 `cli/create.test.mjs`: line-break refusal test; `withTemplate` helper.
- [x] T006 `init-check.yml`: default and flag assertions, each naming #49.
- [x] T007 `docs/testing.md`, `docs/architecture.md`: the new checks and removal.

## Phase 3: Green

- [x] T008 `node --test cli/create.test.mjs` green; a create run and an init run on a local copy pass every `init-check.yml` assertion; `npm run verify` green.

## Phase 4: Surfaces

- [x] T009 `init-check.yml` job name and triggers unchanged: no ruleset change.
- [x] T010 No `CLAUDE.md` § Architecture coupling, Routine or cron touched.
