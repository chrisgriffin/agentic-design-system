# Tasks: A component with no contract fails the gate instead of only warning

Dependency-ordered. The `surfaces` phase comes last and is tasks like any
other: an unticked box means not done.

## Phase 1 — setup

- [x] T001 Install dependencies (`npm ci`) and confirm the baseline: `npm run verify` exits 0 and `npm run drift:verify` reports `0 error`, `48 review` on `develop`.
- [x] T002 Reproduce the hole once, by hand: create `components/probe/probe.tsx`, `components/probe/probe.module.css` and `components/probe/probe.test.tsx` (the test calling `expectNoViolations`), run `npm run verify`, record that it exits **0**, and keep the folder for T005.

## Phase 2 — foundational

- [x] T003 Confirm the rule id and its default severity from the engine, not from memory: `npx design-delta audit --json` with the probe folder present carries `{"ruleId": "coverage/uncontracted-component", "severity": "warn", "entity": "components/probe/probe.tsx"}`.
- [x] T004 Add the `rules` object to `design-delta.json` with exactly one entry, `"coverage/uncontracted-component": "error"`, plus a `_doc` key saying why (plan D1). Change nothing else in the file — no `exemptions`, no other rule.

## Phase 3 — the gate fails (spec FR1, FR2)

- [x] T005 With the probe folder still present, confirm `npm run drift:verify` exits non-zero with `FAIL 1 finding(s) at "error" severity or above` naming `coverage/uncontracted-component`, and that `npm run verify` therefore fails at that step.
- [x] T006 Confirm the 48 `review` findings are unchanged in the same run — the raise must not move any other rule (spec FR4).
- [x] T007 Remove the probe folder (`git clean -fd components/probe`) and confirm `npm run verify` exits 0 again on the branch with the config change in place (spec FR3).

## Phase 4 — pin it (spec FR5)

- [x] T008 Add `test-utils/contract-coverage.test.ts` with a test named exactly `a component with no contract fails the gate`, following plan D2: write a fixture component directory, read the engine's own finding for it, and assert `severity === "error"`. An `afterEach` removes the fixture whether the test passes or fails.
- [x] T009 Prove the test is a real pin, not a vacuous one: with `design-delta.json`'s entry temporarily back at `"warn"`, the new test **fails**; restore `"error"` and it passes.
- [x] T010 Run the spec's runnable line and record its output: `npx vitest run --reporter=verbose 2>&1 | grep -c "a component with no contract fails the gate"` prints `1`.
- [x] T011 `npm run verify` green end to end on the branch.

## Phase 5 — polish

- [x] T012 Keep the new test file within the repo's style: Prettier and ESLint clean, a docblock saying which rule it pins and why, matching `test-utils/a11y-coverage.test.ts`'s shape.

## Phase 6 — surfaces

One task per `## Surfaces touched` line in `plan.md`, in that order.

- [x] T013 `README.md` — the gate paragraph says a component with no contract fails CI, not only that code and contracts disagreeing does.
- [x] T014 `CLAUDE.md` — invariant 2 names the gate that now enforces it; § CI's gate line stays accurate.
- [x] T015 `docs/architecture.md` — confirm no directory is added, removed or renamed, so CI's `Check docs/` step needs nothing; its `test-utils/` line names the new test, and the PR body says so.
- [x] T016 `CHANGELOG.md` — confirm nothing is hand-written; the release flow generates it from conventional-commit history.
- [x] T017 `docs/adr/` — confirm no record is owed: this applies an invariant `CLAUDE.md` already states.
- [x] T018 Required check names — confirm none changes, so the branch ruleset is untouched (`build / ci` still runs `npm run verify`).
- [x] T019 Published surface — confirm `scripts/init.mjs` rewrites `design-delta.json` by name, prefix and Figma file key only, so a new `rules` key survives an `init` run untouched; if it does not, fix `init.mjs` in this PR.
- [x] T020 Cost — confirm no workflow trigger, cron, per-push job or Routine fire changes, and say so in the PR body.
- [x] T021 Migration — confirm none is owed: nothing outside this repo reads `design-delta.json`, and a copier gets the stricter gate by design.
- [x] T022 Vault notes — run `grep -rl "agentic-design-system:design-delta.json" AI/` against the vault, confirm no living doc's `covers:` names this path, and record the result in the PR body.
