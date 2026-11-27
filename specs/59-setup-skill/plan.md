# Plan: A setup skill writes a new system's own docs and brand after init

## Technical context

- `.claude/skills/setup-system/SKILL.md`: frontmatter `name` and `description`, then the steps: stop check and commit-init-first, read, interview (one question at a time, each with "keep what's there" as an answer), rewrite the docs, ADRs, brand (with a contrast check of each pair the stylesheets set), examples, `prettier --write`, `npm run verify`, `build-storybook`, delete itself. It names no template value init would rewrite (the name, the prefix) and no init-only file, so the rewrite leaves it whole and `init-check.yml`'s grep for init's files stays clean.
- `cli/setup-skill.test.mjs` (`node --test`, picked up by `package.json`'s `cli/*.test.mjs`): the skill's frontmatter names it; every backticked repo path in it exists in this checkout and is none init removes; it holds no `<!-- init -->` marker; it names no template name or prefix init would rewrite.
- `scripts/init.mjs` and `cli/create.mjs`: each closing line says to commit, then run `/setup-system`.
- `init-check.yml`: the create run and the init run each fail when the copy lacks the skill; the init run's output is kept in a file and fails when its closing line does not name `/setup-system`.
- `README.md` "Starting your own" (removed by init) and `docs/architecture.md`'s agent layer (inside `<!-- init -->`) describe the skill; a copy's docs never name a skill that deletes itself.

## Surfaces touched

- `.claude/skills/setup-system/SKILL.md` — new.
- `cli/setup-skill.test.mjs` — new; template-only, since init removes `cli/`.
- `scripts/init.mjs`, `cli/create.mjs` — closing lines.
- `.github/workflows/init-check.yml` — new assertions; job name and triggers unchanged, so no ruleset change. Its shakedown is this PR's own `init / ci` run.
- `README.md`, `docs/architecture.md`, `docs/testing.md` — the skill, its test and the new checks.
- `cost` — none: no new workflow, trigger or agent run; `init / ci` gains a few greps.
- none of `CLAUDE.md` § Architecture's couplings; no Routine, cron or ruleset.
