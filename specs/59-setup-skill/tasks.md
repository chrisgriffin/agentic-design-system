# Tasks

## Phase 1: Red

- [ ] T001 `cli/setup-skill.test.mjs`: fails on `develop` (no skill).

## Phase 2: Build

- [ ] T002 `.claude/skills/setup-system/SKILL.md`: stop check, interview, docs, ADRs, brand, examples, verify, self-delete.
- [ ] T003 `scripts/init.mjs`, `cli/create.mjs`: closing lines name `/setup-system`.
- [ ] T004 `init-check.yml`: skill present after create and init; init's closing line names it; each message names #59.
- [ ] T005 `README.md`, `docs/architecture.md`, `docs/testing.md`: the skill, its test, the checks.

## Phase 3: Green

- [ ] T006 `node --test cli/setup-skill.test.mjs` green; an init run on a local copy passes every new `init-check.yml` assertion; `npm run verify` green.

## Phase 4: Surfaces

- [ ] T007 `init-check.yml` job name and triggers unchanged: no ruleset change.
- [ ] T008 No `CLAUDE.md` § Architecture coupling, Routine, cron or vault note touched.
