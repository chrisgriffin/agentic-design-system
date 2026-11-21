# Plan: Call --owner "your GitHub username" in the create command, the init script and the README

## Technical context

- Wording only: three strings in `cli/create.mjs`, two in `scripts/init.mjs`, two in `README.md`. The flag name, its validation (`cli/defaults.mjs`) and the swap that writes the owner are unchanged.
- `cli/create.test.mjs` gains one test asserting the `--help` line for `--owner`.

## Surfaces touched

- `README.md` — the "Starting your own" section, which `scripts/init.mjs` removes from a copy.
- `cli/create.mjs`, `scripts/init.mjs` — usage, help and prompt strings.
- `cli/create.test.mjs` — one new test.
- `docs/testing.md` — lists what `cli/create.test.mjs` covers; gains the help-text check.
- `.github/workflows/init-check.yml` — read; it passes flags and greps for init references, never the help text, so unchanged.
- none of `CLAUDE.md` § Architecture's couplings; no Routine, cron, ruleset, workflow or vault note.
