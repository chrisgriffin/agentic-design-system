# Plan: npm run demo shows the create command in action

## Technical context

- Node 22, ESM, no dependencies: `node:child_process`, `node:fs`, `node:os`, `node:path`, the same as `cli/create.mjs`.
- Tests run under `node --test` with the other `cli/*.test.mjs` files, through `npm test`.

## Design

- `cli/demo.mjs`, about 30 lines: resolve the checkout from its own path; when `git status --porcelain` there prints anything, warn on stderr; `rmSync` then `mkdirSync` `path.join(os.tmpdir(), "demo-ds")`; `spawnSync(process.execPath, [cli/create.mjs, "--from", root, "--dir", folder, ...process.argv.slice(2)], { stdio: "inherit" })`; then print the folder and `git -C <folder> status --short`, and exit with the create command's status.
- The create command's parser keeps the last value a flag is given, so a passed-through `--dir` or `--from` overrides the demo's.
- The folder is `demo-ds`, so the system is named `demo-ds` and the prefix prompt offers `dd`.
- `os.tmpdir()` reads `TMPDIR`, so the test points the demo at a temp folder of its own without a flag the demo would otherwise need.
- `package.json`: `"demo": "node cli/demo.mjs"`. `scripts/init.mjs`: `delete pkg.scripts.demo` in the edit that already rewrites `scripts.test`.

## File structure

- `cli/demo.mjs` (new), `cli/demo.test.mjs` (new)
- `package.json`, `scripts/init.mjs`, `cli/init-manifest.test.mjs`
- `README.md`, `docs/architecture.md`, `docs/testing.md`

## Surfaces touched

- `README.md` — "Starting your own" (which init removes) says how to watch the create command with `npm run demo`.
- `docs/architecture.md` — the `<!-- init -->` passage on `cli/create.mjs` names `cli/demo.mjs`, and the `scripts/init.mjs` passage says init drops the `demo` script.
- `docs/testing.md` — lists `cli/demo.test.mjs` and the new init-manifest check.
- published surface (`bin`, `files`) — none: `cli/demo.mjs` is not in `package.json`'s `files`, so the npm package and `cli/pack.test.mjs` are unchanged.
- `CHANGELOG.md` — none: the release workflow writes it from the commits.
- CI workflows, required checks, rulesets — none: the new test runs inside `npm test`.
- cost — none: no trigger, cron or agent run added.
- vault notes — none: no living note covers these paths.
