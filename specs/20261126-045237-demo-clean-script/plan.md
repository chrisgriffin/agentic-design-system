# Plan: npm run demo:clean removes the demo folder

## Technical context

`package.json` holds `"demo": "node cli/demo.mjs"`; `scripts/init.mjs` deletes `pkg.scripts.demo`; `cli/init-manifest.test.mjs` checks the copy has no `demo` script.

## Design

- Add `"demo:clean": "node cli/demo.mjs --clean"` after `demo`.
- In init, `delete pkg.scripts["demo:clean"]` beside `delete pkg.scripts.demo`.
- `cli/init-manifest.test.mjs`: the copy has neither script. `cli/demo.test.mjs`: `npm run demo:clean` with `TMPDIR` set removes `demo-ds`.

## Surfaces touched

- `README.md` — the demo paragraph names `npm run demo:clean`.
- `docs/testing.md` — the `cli/demo.test.mjs` and `cli/init-manifest.test.mjs` entries name the `demo:clean` checks.
- `docs/architecture.md` — the init sentence that names the removed `demo` script names `demo:clean` too, and the demo sentence names the script.
- Published surface: none — `package.json` scripts are not part of the packed create command's behavior, and init removes both from a created system.
