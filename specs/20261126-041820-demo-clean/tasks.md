# Tasks: npm run demo -- --clean removes the demo folder

## Phase 1: the change

- [x] T001 `cli/demo.mjs`: `--clean` alone removes the default `demo-ds` folder, or says nothing was there, and exits 0; with another argument, one failure line and exit 1
- [x] T002 `cli/demo.test.mjs`: `--clean` after a run removes the folder; with nothing there exits 0 and says so; with `--dir` exits 1 and removes nothing

## Phase 2: surfaces

- [x] T003 `README.md`: the demo paragraph names `npm run demo -- --clean`
- [x] T004 `docs/testing.md`: the `cli/demo.test.mjs` entry lists the `--clean` tests
- [x] T005 `docs/architecture.md`: the `cli/demo.mjs` sentence names `--clean`
