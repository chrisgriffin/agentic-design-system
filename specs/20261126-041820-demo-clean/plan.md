# Plan: npm run demo -- --clean removes the demo folder

## Technical context

Node 22, no dependency. `cli/demo.mjs` already computes the default folder (`path.join(tmpdir(), "demo-ds")`) and wipes it with `rmSync` before each run; `cli/ui.mjs` has `tick` and `failure`.

## Design

- In `cli/demo.mjs`, before the uncommitted-changes warning: if `--clean` is given in a flag's place (read as the create command reads flags, so a free-text flag's value is skipped), refuse with `failure(...)` and exit 1 when any other argument is given; otherwise `rmSync` the default folder when it exists, print `tick("Removed", folder)` or `tick("Clean", "nothing at <folder>")`, and exit 0.
- Tests in `cli/demo.test.mjs`, with `TMPDIR` pointed at a temp folder as the others do.

## Surfaces touched

- `README.md` — the demo paragraph names `npm run demo -- --clean`.
- `docs/testing.md` — the `cli/demo.test.mjs` entry lists the `--clean` tests.
- `docs/architecture.md` — the `cli/demo.mjs` sentence names `--clean`.
- Published surface: none — `cli/demo.mjs` is not in `package.json`'s `files`, and init removes `cli/` and the `demo` script from a created system.
