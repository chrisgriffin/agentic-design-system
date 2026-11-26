# Tasks: the create command's output reads as steps and a summary

## Phase 1: foundational

- [x] T001 `cli/ui.mjs`: the painter, `title`, `pending`, `tick`, `header`, `rows`, `next`, `warn`, `failure`
- [x] T002 `cli/ui.test.mjs`: plain text when piped and with `NO_COLOR`, color in a forced terminal, rows aligned, `next` numbered with its last step last

## Phase 2: the three scripts

- [x] T003 `cli/create.mjs`: title, styled prompts, pending steps, author tick, `CREATE_AGENTIC_DS=1` for init, `Next` block, failures through `failure`
- [x] T004 `scripts/init.mjs`: a header per command, a failed command as one failure line and exit 1, the ready line and summary rows, `Next` when run on its own
- [x] T005 `cli/demo.mjs`: the warning through `warn`, the closing folder and `git status` count
- [x] T006 `package.json`: `cli/ui.mjs` in `files`

## Phase 3: tests

- [x] T007 update the create, create-in-place, create-branch, demo, pack and setup-skill tests to the new wording; a test that a failed init command exits 1 on one line naming it
- [x] T008 `npm run verify` green; a demo run in a real terminal checked by eye

## Phase 4: surfaces

- [x] T009 `README.md`: the demo paragraph
- [x] T010 `docs/architecture.md`: `cli/ui.mjs` among the packed files, and the closing
- [x] T011 `docs/testing.md`: `cli/ui.test.mjs` and the changed assertions
- [x] T012 published surface: `cli/pack.test.mjs` lists `cli/ui.mjs`
