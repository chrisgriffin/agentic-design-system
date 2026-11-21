# Plan: A copy made by init gets its own author, description and an empty spec history

## Technical context

- `scripts/init.mjs`: two optional one-line flags, validated with the others so `--check` (and so `cli/create.mjs`) refuses a line break. `LICENSE`'s copyright line and `package.json`'s `description` are set whole, not by text swap, so any text is safe in JSON. The README intro becomes its own one-sentence paragraph equal to `TEMPLATE.description`, replaced once. `specs` joins the removed list; it stays in `SKIP` so the rewrite never touches it first. `changed` becomes a `Set` so README and LICENSE are counted once.
- `README.md`: the intro splits into the description sentence and an "It holds…" paragraph; the "built in layers" note moves wholly inside `<!-- init -->` markers.
- `cli/create.mjs`: `--author` and `--description` join `VALUE_FLAGS` and pass through; the retry line and refusal quote values for a shell, since both can hold spaces.
- `init-check.yml`: the create run asserts the defaults (no `specs/`, `The created-system design system.`, no template copyright holder); the init run passes both flags and asserts them in `LICENSE`, `package.json` and the README.

## Surfaces touched

- `scripts/init.mjs`, `cli/create.mjs` — flags, usage, output line.
- `cli/create.test.mjs` — pass-through and line-break refusal tests; the template-repo setup becomes a `withTemplate` helper shared with the existing clone test.
- `.github/workflows/init-check.yml` — new assertions and flags; job name and triggers unchanged, so no ruleset change. Its shakedown is this PR's own `init / ci` run.
- `README.md`, `docs/testing.md`, `docs/architecture.md` — the flags, the removal and the checks.
- none of `CLAUDE.md` § Architecture's couplings; no Routine, cron or ruleset.
