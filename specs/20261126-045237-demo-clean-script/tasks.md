# Tasks: npm run demo:clean removes the demo folder

## Phase 1: the change

- [x] T001 `package.json`: a `demo:clean` script running `node cli/demo.mjs --clean`
- [x] T002 `scripts/init.mjs`: remove `demo:clean` with `demo`
- [x] T003 `cli/demo.test.mjs` and `cli/init-manifest.test.mjs`: `npm run demo:clean` removes `demo-ds`; a created system has neither script

## Phase 2: surfaces

- [x] T004 `README.md`: the demo paragraph names `npm run demo:clean`
- [x] T005 `docs/testing.md`: the two test entries name the `demo:clean` checks
- [x] T006 `docs/architecture.md`: the init and demo sentences name `demo:clean`
