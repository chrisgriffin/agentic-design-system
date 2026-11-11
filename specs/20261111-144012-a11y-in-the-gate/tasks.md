# Tasks: The gate asserts accessibility, not just a Storybook panel

Spec: `specs/20261111-144012-a11y-in-the-gate/spec.md` · Plan: `plan.md` in the same folder.

The spec's runnable line checks that each of `badge`, `button` and `card` calls `expectNoViolations` and that the suite then passes. It exits 1 today, printing `no accessibility assertion in: badge, button, card`. T001 records that baseline.

## Phase 1 — setup

- [ ] T001 Record the baseline: the spec's runnable line, exiting 1 and naming all three components, plus `npx vitest run components` (5 tests, 3 files). Both go in the pull request.
- [ ] T002 Add `axe-core` to `devDependencies` with `^4.14.0`, run `npm install`, and confirm `package-lock.json` now records it as a direct dependency.

## Phase 2 — foundational: the shared helper

- [ ] T003 Add `test-utils/axe.ts` at the repo root, exporting `async expectNoViolations(container: HTMLElement)`: run `axe.run(container)` with `color-contrast` disabled and a comment saying jsdom has no layout or computed colour, then fail with each violation formatted as `<rule id>: <help> (<n> node(s)) — <first target>`. Confirm `vite.config.ts` does not collect it as a test.
- [ ] T004 Call it once from `components/badge/badge.test.tsx` on the default render and run `npx vitest run components/badge`. **Whatever it reports is the real baseline** — if there is a violation, stop and record it before writing more tests.

## Phase 3 — cover every component and variant

- [ ] T005 `components/badge/badge.test.tsx` — an accessibility test over all four tones (`neutral`, `accent`, `success`, `danger`).
- [ ] T006 `components/button/button.test.tsx` — an accessibility test over three sizes × two variants, plus one render with `iconBefore` filled. Do not render the design-only `state` axis: the code must not carry it.
- [ ] T007 `components/card/card.test.tsx` — an accessibility test over `padding` default and `none`, each containing a `Card.Header` with a `title` and a `trailing` slot, which is also `card-header`'s coverage.
- [ ] T008 Fix every violation the three tests found in the component or its stylesheet, never in the test. Disable a rule only with a comment saying why it cannot apply here. List each violation and its fix in the pull request. A violation needing a design decision rather than a mechanical fix is split into its own issue, linked from the pull request, and this one ships the gate.
- [ ] T009 Prove the gate bites: remove a component's accessible name, confirm `npm run verify` fails naming the component and the axe rule, then revert. Quote the failure in the pull request.

## Phase 4 — the scaffold

- [ ] T010 `scripts/scaffold-component.mjs` — the `${name}.test.tsx` template gains the `../../test-utils/axe` import and one `expectNoViolations` call beside its existing class assertion, in the same shape as badge's test.
- [ ] T011 Run `npm run scaffold -- scratch-thing`, confirm the generated test contains the assertion and that `npx vitest run components/scratch-thing` passes, then delete the directory. Confirm `git status` shows nothing left behind.

## Phase 5 — surfaces

One task per `## Surfaces touched` line in the plan, in its order.

- [ ] T012 `test-utils/axe.ts` — the file exists at the repo root, and `docs/architecture.md`'s layout description names `test-utils/` so CI's `Check docs/` step passes.
- [ ] T013 `components/badge/badge.test.tsx`, `components/button/button.test.tsx`, `components/card/card.test.tsx` — each carries its accessibility test (T005–T007).
- [ ] T014 `components/badge/*`, `components/button/*`, `components/card/*` — the pull request lists every violation found and its fix, or says none was found.
- [ ] T015 `scripts/scaffold-component.mjs` — the template matches badge's test shape, holding the `components/badge/*` → scaffold-templates coupling.
- [ ] T016 `package.json` and `package-lock.json` — `axe-core` is a direct `devDependency`.
- [ ] T017 `docs/testing.md` — `What is tested` names the axe assertion and what it covers; `Adding a test` names the helper's path and says a new component's test calls it. Both say contrast is not checked here and why.
- [ ] T018 `README.md` — the Storybook paragraph separates the addon's panel from the gate's assertion.
- [ ] T019 `docs/architecture.md` — the `.storybook/` sentence no longer implies the addon is the accessibility check (the layout line is T012).
- [ ] T020 `CLAUDE.md` — says the gate asserts accessibility, beside what the Storybook addon shows. Leave the Component directory shape paragraph alone: the helper sits at the repo root so that rule needs no amendment. Every line inside the file's character cap.
- [ ] T021 `.github/workflows/build-check.yml` — confirm no change is needed: it runs `npm run verify`, so `build / ci` keeps its name and no ruleset edit is owed. Say so in the pull request.
- [ ] T022 `scripts/init.mjs` — confirm the new root `test-utils/` needs no entry in its sweep or removal lists, and say so in the pull request. `init / ci` is what proves it; fix the script here if that check fails.
- [ ] T023 cost — confirm in the pull request that no trigger, cron, agent fire or scheduled function is added, and the axe runs sit inside the existing `npm test` step.
- [ ] T024 `docs/adr/` — confirm no ADR is owed, or say in the pull request why one is and write it.
- [ ] T025 none else — confirm in the pull request: no reusable workflow body in chrisgriffin/workflows touched, no required check renamed, nothing published changed, and no rule newly stated in a second doc.

## Phase 6 — polish

- [ ] T026 `npm run verify` green end to end, then `npm run build-storybook` green, so the addon still loads beside the new gate.
- [ ] T027 Confirm `git status` is clean of generated output and `tokens/css/tokens.css` is byte-identical to the branch point, since no token source changed.
