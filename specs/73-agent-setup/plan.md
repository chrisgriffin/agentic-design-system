# Plan: A created system says how to put it on GitHub, and an agent can run its setup skill

## Technical context

- `docs/releasing.md`: "Manual steps: None" becomes "## Setting up on GitHub", once per copy. Check names are `<job> / ci`, the caller's job id and the reusable node CI's job.
- `cli/github-setup.test.mjs` (`node --test`, template-only since init removes `cli/`): the backticked `<job> / ci` names in that section equal the jobs of `.github/workflows/*.yml` that run on `pull_request`, use `_reusable-node-ci.yml` and survive init (not `init-check.yml`).
- `cli/create.mjs`: the closing line adds the skill's path; `cli/setup-skill.test.mjs` asserts the path it names exists.
- `.claude/skills/setup-system/SKILL.md`: step 2 takes given answers; the summary step points at `docs/releasing.md`.
- `CLAUDE.md` coupling row for job names, `README.md` "Starting your own", `docs/testing.md`: the new section and test.

## Surfaces touched

- `docs/releasing.md`, `CLAUDE.md`, `README.md`, `docs/testing.md`.
- `cli/create.mjs`, `.claude/skills/setup-system/SKILL.md`.
- `cli/github-setup.test.mjs` — new; `cli/setup-skill.test.mjs`.
- `cost` — none: no workflow, trigger, job name or ruleset change.
