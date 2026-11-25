# Tasks: npm run demo shows the create command in action

## Phase 1: tests first

- [x] T001 `cli/demo.test.mjs`: with `TMPDIR` set to a temp folder, `node cli/demo.mjs --prefix dd --owner sample-owner --no-init` exits 0, writes `demo-ds` there, prints its path and `git status`; a stale file in `demo-ds` is gone after a second run; a refused value (`--prefix 9`) exits 1; a dirty checkout copy gets the warning
- [x] T002 `cli/init-manifest.test.mjs`: the created copy's `package.json` has no `demo` script; confirm T001 and T002 fail

## Phase 2: the demo

- [x] T003 `cli/demo.mjs`: the warning, the fresh folder, the create run with the terminal passed through, the closing path and `git status`, the create command's exit code
- [x] T004 `package.json`: `"demo": "node cli/demo.mjs"`
- [x] T005 `scripts/init.mjs`: drop `scripts.demo` from a created system's `package.json`

## Phase 3: surfaces

- [x] T006 `README.md` — "Starting your own" says how to watch the create command with `npm run demo`
- [x] T007 `docs/architecture.md` — the `cli/create.mjs` passage names `cli/demo.mjs`; the `scripts/init.mjs` passage says init drops the `demo` script
- [x] T008 `docs/testing.md` — lists `cli/demo.test.mjs` and the new init-manifest check
- [x] T009 published surface — confirm `npm pack --dry-run` still lists only the six files `cli/pack.test.mjs` holds
- [x] T010 `CHANGELOG.md`, CI, cost, vault notes — none, per the plan
