# Tasks: a created system keeps three agent skills for its everyday work, and one command keeps them current

## Phase 1: the update command

- [ ] T001 `scripts/update-skills.mjs`: `MANAGED`, `--from`, the source order, clone, the four outcomes, one line each, the clone removed in `finally`, one failure line on a failed clone or an unknown argument.
- [ ] T002 `scripts/update-skills.test.mjs`: against a local template repo, a missing skill is added, a stale one updated, a current one left, a claimed one kept and named, a skill without the line never copied; a failed clone and an unknown argument exit 1 and write nothing.
- [ ] T003 `package.json`: `"update:skills": "node scripts/update-skills.mjs"`.

## Phase 2: the skills

- [ ] T004 `.claude/skills/add-component/SKILL.md`.
- [ ] T005 `.claude/skills/add-token/SKILL.md`.
- [ ] T006 `.claude/skills/change-theme/SKILL.md`.
- [ ] T007 `cli/agent-skills.test.mjs`: each skill's frontmatter, the managed line, every path it names exists and is none init removes, nothing init rewrites.

## Phase 3: init

- [ ] T008 `scripts/init.mjs`: `skillsFrom` from `TEMPLATE`.
- [ ] T009 `cli/init-manifest.test.mjs`: a created copy keeps the skills, the script and its test, and has `skillsFrom`.

## Phase 4: surfaces

- [ ] T010 `CLAUDE.md`: the Agent layer names the three skills and `npm run update:skills`.
- [ ] T011 `README.md`: the Agent layer section names them.
- [ ] T012 `docs/architecture.md`: the `.claude/skills/` passage names them and the update.
- [ ] T013 `docs/testing.md`: entries for `cli/agent-skills.test.mjs` and `scripts/update-skills.test.mjs`; the `cli/init-manifest.test.mjs` entry names the kept script.
- [ ] T014 Published surface: confirm `package.json`'s `files` is unchanged.
- [ ] T015 CI: `npm run verify` green.
