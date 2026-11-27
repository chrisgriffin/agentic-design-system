# Plan: the create command's output reads as steps and a summary

## Technical context

- Node 22, ESM, no dependencies. `util.styleText` exists from Node 20.12; its own stream check arrived in 22.13, so `cli/ui.mjs` checks `isTTY` and `NO_COLOR` itself and passes `validateStream: false`.
- Tests run under `node --test` with the other `cli/*.test.mjs` files, through `npm test`. Their output is piped, so every existing assertion reads plain text.

## Design

- `cli/ui.mjs`, about 80 lines: `color(stream)` returns a painter that is the identity when the stream is not a terminal or `NO_COLOR` is set. Exports `title`, `pending(label, detail)` (returns `done()`; in a terminal it writes a dim `◇` line without a newline and `done` rewrites it with `\r\x1b[2K` as a green `✓`), `tick`, `header(command)` (`── <command> ──…`, dim), `rows(pairs)` (keys dimmed and padded to the longest), `next(steps)` (`Next`, then `1  …`), `warn` and `failure` (stderr, `!` yellow and `✗` red; `failure` first closes an open pending line).
- `cli/create.mjs`: `fail` prints through `failure`; a title before the prompts; `ask` prints `◆ <question> › ` and the default dimmed; `pending` around the clone, the values check and the copy; the author line through `tick`; spawns init with `CREATE_AGENTIC_DS=1`; ends on `console.log(next([...]))`, the replaced files in a warning-free line above it.
- `scripts/init.mjs`: `run` prints `header(cmd)` and catches a failed `execSync`, printing `failure("<cmd> failed")` and exiting 1. The closing is `tick("<name> is ready")` and `rows(...)`; `next(...)` follows unless `CREATE_AGENTIC_DS` is set, and is the last line printed. The refusal and usage paths are unchanged.
- `cli/demo.mjs`: the warning through `warn`; the closing is `rows([["Demo", folder], ["git status", counts]])`.
- The removed list in init's summary shows folders with a trailing `/` and the workflows as their file names under one `.github/workflows/` entry.

## File structure

- `cli/ui.mjs` (new), `cli/ui.test.mjs` (new)
- `cli/create.mjs`, `scripts/init.mjs`, `cli/demo.mjs`, `package.json` (`files`)
- tests reading the old wording: `cli/create.test.mjs`, `cli/create-in-place.test.mjs`, `cli/create-branch.test.mjs`, `cli/demo.test.mjs`, `cli/pack.test.mjs`, `cli/setup-skill.test.mjs`
- `README.md`, `docs/architecture.md`, `docs/testing.md`

## Surfaces touched

- `README.md` — the demo paragraph says it ends on a count of `git status`, not the list.
- `docs/architecture.md` — the `<!-- init -->` passage on `cli/create.mjs` names `cli/ui.mjs` among the packed files, and says how its closing reads.
- `docs/testing.md` — lists `cli/ui.test.mjs` and the changed assertions in the create, demo and pack tests.
- published surface (`files`) — `cli/ui.mjs` is added, so the npm package holds four files; `cli/pack.test.mjs` lists it.
- `.github/workflows/init-check.yml` — none: it reads init's last line for `/setup-system`, which the `Next` block keeps as the last line when init runs on its own.
- `CHANGELOG.md` — none: the release workflow writes it from the commits.
- CI workflows, required checks, rulesets — none: the new test runs inside `npm test`.
- cost — none: no trigger, cron or agent run added.
- vault notes — none: no living note covers these paths.
