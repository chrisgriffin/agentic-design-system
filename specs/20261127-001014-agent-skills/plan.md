# Plan: a created system keeps three agent skills for its everyday work, and one command keeps them current

## Technical context

Node 22, ESM, no new dependency. `git` (already required by the create command) clones the template. Tests are `node:test`.

## Design

- **The skills** are Markdown in `.claude/skills/<name>/SKILL.md`, each a numbered procedure that points at the files that hold the rules (`CLAUDE.md`, `components/badge/`, `tokens/json/`, `terrazzo.config.mjs`, `tokens/scripts/contrast.test.mjs`) rather than restating them. The prefix is written `--<prefix>-` and named as `PREFIX` in `tokens/scripts/source.mjs`, so init's rewrite finds nothing to change.
- **The managed line** is the last line of each skill: ``Managed by `npm run update:skills`, which overwrites this file. Delete this line to keep your own edits: the update then leaves the file alone.`` It names neither the template nor the system, so init, the setup skill's template search and an update all leave it as written. It is exported once, as `MANAGED` from `scripts/update-skills.mjs`, and the tests import it.
- **`scripts/update-skills.mjs`**: parse `--from`; resolve the source (`--from`, then `package.json`'s `skillsFrom`, then `repository.url` without `git+`); `git clone --quiet --depth 1` into `mkdtemp`; walk the clone's `.claude/skills/*/SKILL.md`; compare with the local file by the rules in FR-004; print one line each; remove the clone in `finally`. Only `SKILL.md` files are managed: a skill with more files is out of scope until one exists.
- **Init** sets `pkg.skillsFrom = "https://github.com/chrisgriffin/agentic-ds.git"` built from its `TEMPLATE` constants, inside the existing `edit(manifest, …)` after the walk, so the rewrite never reaches it.

## Surfaces touched

- `.claude/skills/add-component/SKILL.md`, `.claude/skills/add-token/SKILL.md`, `.claude/skills/change-theme/SKILL.md`: new.
- `scripts/update-skills.mjs`, `scripts/update-skills.test.mjs`: new.
- `cli/agent-skills.test.mjs`: new, template-only content checks (init removes `cli/`).
- `package.json`: an `update:skills` script.
- `scripts/init.mjs`: writes `skillsFrom`.
- `cli/init-manifest.test.mjs`: a created copy keeps the script, the skills and `skillsFrom`.
- `CLAUDE.md`: the Agent layer section names the three skills and `npm run update:skills`.
- `README.md`: the Agent layer section names them.
- `docs/architecture.md`: the `.claude/skills/` passage names them and the update.
- `docs/testing.md`: entries for the two new test files; the `cli/init-manifest.test.mjs` entry names the kept script.
- Published surface: none. The packed create command's files are unchanged; the skills and the script ship with the cloned template.
- CI, required checks: none. Both tests run in `npm test`; the update test also runs in `init / ci`'s created copy.
