# Tasks: The template typechecks, and the gate runs it

Spec: `specs/20261111-143054-typecheck-in-the-gate/spec.md` · Plan: `plan.md` in the same folder.

Run `npx tsc --noEmit` at the start and after every phase: it is the spec's runnable line and it starts red with 12 errors (4 × TS2307, 8 × TS2339).

## Phase 1 — setup

- [ ] T001 Record the red baseline: run `npx tsc --noEmit` on the branch point and keep its exit code and the 12 error lines; the PR body quotes the count before and after.

## Phase 2 — foundational: put the missing types in the program

- [ ] T002 Add `types/css-modules.d.ts` declaring `declare module "*.module.css"` as `{ readonly [key: string]: string }`, with a one-line comment saying Vite resolves these at build time and this is the type side of that.
- [ ] T003 Add `"types"` to `tsconfig.json`'s `include`, then run `npx tsc --noEmit`: the 4 × TS2307 are gone and the 8 × TS2339 remain.
- [ ] T004 Add `"vitest.setup.ts"` to `tsconfig.json`'s `include`, then run `npx tsc --noEmit`: it exits 0 and prints no `error TS` line.
- [ ] T005 Fix any error that T003 or T004 surfaced which is not one of the original twelve, by supplying the declaration or program entry it is missing (FR-006), then confirm nothing was silenced: `! grep -rn "@ts-ignore\|@ts-expect-error" components tokens/scripts .storybook types *.ts` exits 0, and `tsconfig.json`'s `include` lost no entry.

## Phase 3 — the gate runs it

- [ ] T006 Add `"typecheck": "tsc --noEmit"` to `package.json`'s `scripts`, and run `npm run typecheck` on its own.
- [ ] T007 Put `npm run typecheck` into `verify`, after `build:tokens` and before `prettier:check`, then run `npm run verify` green end to end.
- [ ] T008 Prove the gate bites: give a component a deliberate type error, confirm `npm run verify` fails naming that file and line, then revert it. Quote the failure in the PR body.

## Phase 4 — surfaces

One task per `## Surfaces touched` line in the plan, in its order.

- [ ] T009 `tsconfig.json` — `include` names `types` and `vitest.setup.ts` (done in T003/T004; tick only once both are in the committed file).
- [ ] T010 `types/css-modules.d.ts` — the new file exists, and `docs/architecture.md`'s directory list gains `types/` so CI's `Check docs/` step passes.
- [ ] T011 `package.json` — the `typecheck` script exists and `verify` runs it as its seventh step.
- [ ] T012 `docs/testing.md` — "these six in order" becomes seven with the `typecheck` bullet, and `Adding a test` says `vitest.setup.ts` is in the TypeScript program.
- [ ] T013 `README.md` — the Development block's `verify` comment lists `typecheck` in the chain.
- [ ] T014 `CLAUDE.md` — the Commands block lists `npm run typecheck` and its `verify` line says the gate typechecks. Keep every line inside the file's character cap.
- [ ] T015 `docs/architecture.md` — the gate sentence lists seven steps (the directory list is T010).
- [ ] T016 `.github/workflows/build-check.yml` — confirm no change is needed: it runs `npm run verify` and names no chain step, so `build / ci` keeps its name and the branch ruleset needs no edit. Say so in the PR body.
- [ ] T017 `scripts/init.mjs` — read its sweep and removal lists and confirm `types/css-modules.d.ts` needs no entry (it holds no `--ads-` reference and no `<!-- init -->` marker), and say so in the PR body. Do not run the script on this checkout: it renames in place. `init / ci` runs it on the pull request, so that check, not a local run, is what proves the claim; if it fails, fix `scripts/init.mjs` here.
- [ ] T018 cost — confirm in the PR body that no trigger, cron, agent fire or scheduled function is added, and `tsc` adds only seconds inside the existing `build / ci` job.
- [ ] T019 `docs/adr/` — confirm no ADR is owed: this enforces strictness the repo already configured. Say so in the PR body.
- [ ] T020 none else — confirm in the PR body: no reusable workflow body in chrisgriffin/workflows touched, no required check renamed, nothing published changed, and no rule newly stated in a second doc.

## Phase 5 — polish

- [ ] T021 Run the full gate: `npm run verify`, then `npm run build-storybook`, both green. `.storybook` is in the program, so a Storybook type error would surface in T007.
- [ ] T022 Confirm `git status` is clean of generated output: `tokens/css/tokens.css` is byte-identical to the branch point, since no token source changed.
