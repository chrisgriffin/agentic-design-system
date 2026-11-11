# Spec: The template typechecks, and the gate runs it

## Overview

`tsconfig.json` is present and `noEmit`, but nothing ever runs TypeScript. Run it and the template does not typecheck: `npx tsc --noEmit` on `develop` at `0c0a17d` exits `2` with **12 errors**, none of them a real defect and all of them missing type wiring.

- **4 × TS2307** — `Cannot find module './<name>.module.css' or its corresponding type declarations` in `badge.tsx`, `button.tsx`, `card.tsx` and `card-header.tsx`. Vite resolves CSS Modules at build time; TypeScript has no ambient declaration for them.
- **8 × TS2339** — `Property 'toHaveClass' does not exist` and `Property 'toBeInTheDocument' does not exist` across the three component test files. `vitest.setup.ts` imports `@testing-library/jest-dom/vitest`, which is what registers those matchers, but `tsconfig.json`'s `include` is `["components", "tokens/scripts", ".storybook"]` and does not name that file, so the augmentation never reaches the program.

`package.json` has no `typecheck` script, and `npm run verify` is `build:tokens → prettier:check → lint → lint:styles → drift:verify → test`, so a type error ships green. For a public template whose promise is that an agent can work in it without drifting from its tokens and contracts, the first `tsc` an agent or a copy-taker runs reports twelve errors on an untouched checkout. That teaches them the config is wrong, and it hides the next real type error behind noise.

## User scenarios

- Someone takes a copy of the template, opens it in an editor with the workspace TypeScript, and sees no errors in files they have not touched.
- An agent working in a copy adds a prop whose type does not match its usage; `npm run verify` fails on it, in `build / ci` as well as locally.
- A contributor runs `npm run typecheck` and gets the type verdict on its own, without the rest of the chain.

## Functional requirements

- FR-001: An ambient declaration covers `*.module.css` imports, typed as a read-only record of class names, and it is inside `tsconfig.json`'s program.
- FR-002: `vitest.setup.ts` is inside `tsconfig.json`'s program, so `@testing-library/jest-dom/vitest`'s matcher augmentation applies to the component test files.
- FR-003: `package.json` has a `typecheck` script running `tsc --noEmit`.
- FR-004: `npm run verify` runs `typecheck`. It runs after `build:tokens`, so the generated token CSS exists, and the chain's other steps keep their order.
- FR-005: `docs/testing.md`, `README.md` and `docs/architecture.md` name `typecheck` where they list what the gate runs; `CLAUDE.md`'s Commands block lists the script.
- FR-006: The zero-error result covers the whole program, not only `components/`. `.storybook` is brought into the program with a `.storybook/**/*` entry, and its errors are fixed by supplying what is missing, exactly as the twelve are; none is excluded to avoid it. Today it surfaces five: 3 × TS2591 for `node:*` imports in `main.ts` (`@types/node` is missing), TS7016 for `../tokens/scripts/build-manifest.mjs` (it has no declaration) and TS2882 for `preview.ts`'s side-effect import of `tokens/css/tokens.css` (no `*.css` declaration). Bringing `vitest.setup.ts` and `types` in may surface others, fixed the same way.
  - _Corrected in review:_ this requirement first said `tokens/scripts` and `.storybook` were already inside the program. Neither was: `tsc`'s `include` expansion skips a dot-directory named bare, so `".storybook"` added no file, and `tokens/scripts` holds only `.mjs`, which `tsc` reads only under `allowJs`. `npx tsc --listFilesOnly` on the branch listed only `components/`, `types/` and `vitest.setup.ts`, so a Storybook type error passed the gate. The `tokens/scripts` entry stays (FR-007); it now reaches `build-manifest.d.mts`, and its `.mjs` files stay outside the program like the tests in Out of scope.
- FR-007: No existing error is silenced to reach zero — no `@ts-ignore`, no `@ts-expect-error`, no `skipLibCheck` widening and no file excluded from `include` to drop its errors. Each of the twelve is cleared by supplying the declaration or the program entry it is missing.

## Success criteria

- [ ] **Runnable:** `npx tsc --noEmit` exits 0 and prints no `error TS` line. Red on `develop` today, where it exits 2 and prints 12 of them.
- [ ] `npm run verify` fails when a component is given a type error, and the failure names the file and the line.
- [ ] `npm run typecheck` exists and runs the same check on its own.
- [ ] No `@ts-ignore` or `@ts-expect-error` is added anywhere, and nothing is removed from `tsconfig.json`'s `include` to clear an error. Checked with `! grep -rn "@ts-ignore\|@ts-expect-error" components tokens/scripts .storybook *.ts`, which already exits 0 today and must keep doing so. It is a constraint on the change rather than an acceptance test, so it is deliberately not marked as the runnable line.
- [ ] `docs/testing.md`, `README.md` and `CLAUDE.md` say the gate typechecks.

## Out of scope

- Turning on any stricter compiler option than `@chrisgriffin/config/tsconfig.json` already sets. The point here is that the configured strictness is actually enforced, not a new level of it.
- `scripts/`, `.specify/` and the `tokens/scripts/*.test.mjs` files, which are plain ESM and not in the program today; widening `include` to reach them is a separate decision.
- The 48 `tokens/token-unreferenced` findings `drift:verify` reports at `review` severity. Unrelated surface, and whether the token scale stays complete is the repo owner's call.
