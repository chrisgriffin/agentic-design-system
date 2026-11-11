# Plan: The template typechecks, and the gate runs it

## Technical context

- `tsconfig.json` extends `@chrisgriffin/config/tsconfig.json` and sets `module: ESNext`, `moduleResolution: Bundler`, `jsx: react-jsx`, `noEmit: true`, `allowImportingTsExtensions: true`, with `include: ["components", "tokens/scripts", ".storybook"]`. Nothing invokes `tsc`: `package.json` has no `typecheck` script and `verify` is six steps, none of them TypeScript.
- **The 4 × TS2307** are CSS Modules. Vite types them through `vite/client`, which is not in the program. Add `types/css-modules.d.ts` declaring `*.module.css` as `{ readonly [key: string]: string }` and name `types` in `include`. A local declaration is preferred over adding `"types": ["vite/client"]`: `vite/client` also pulls in Vite's whole asset-module surface, and the only thing the program is missing is the CSS Module shape. One file, one claim.
- **The 8 × TS2339** are jest-dom's matchers. `vitest.setup.ts` already imports `@testing-library/jest-dom/vitest`, whose module augmentation extends vitest's `Assertion`. An augmentation only applies to a program that contains the importing file, and `include` does not reach a root-level `.ts` file. Add `vitest.setup.ts` to `include`. That also brings `vite.config.ts`-adjacent root files into scope only if named, so name the one file, not `"*.ts"`.
- **Order in the chain.** `typecheck` goes after `build:tokens` and before `prettier:check`. `tokens/scripts` is in the program and `build-css.mjs` writes `tokens/css/tokens.css`, which no `.ts` file imports, so the dependency is not strictly needed — but keeping generated output ahead of every verifying step is the chain's existing shape, and a type failure is the cheapest signal to get first among the four linters.
- **`npm run typecheck` is `tsc --noEmit`**, not `tsc`, even though `tsconfig.json` already sets `noEmit`: the flag makes a direct invocation safe regardless of the config, and it is how `token-atlas` spells the same script.
- **No dependency is added.** `typescript` is already a `devDependency` and `tsc` is already resolvable; the change is two `include` entries, one declaration file, one script and one chain step. `package-lock.json` does not move.
- FR-007 is why this is not a config-widening change: `skipLibCheck`, an `include` removal or a `@ts-expect-error` would each reach zero errors while leaving the twelve real gaps in place. The fix is two files in the program and one declaration.

## Surfaces touched

- `tsconfig.json` — `include` gains `types` and `vitest.setup.ts`.
- `types/css-modules.d.ts` — new file, the ambient `*.module.css` declaration. A new top-level directory, so `docs/architecture.md`'s directory list gains it; CI's `Check docs/` step holds that list.
- `package.json` — a `typecheck` script, and `verify` gains it as a seventh step.
- `docs/testing.md` — "which is these six in order" becomes seven, with the `typecheck` bullet; the `Adding a test` section says `vitest.setup.ts` is in the program.
- `README.md` — the Development block's `verify` comment lists `typecheck`.
- `CLAUDE.md` — the Commands block lists `npm run typecheck`, and its `verify` line says the gate typechecks.
- `docs/architecture.md` — the directory list gains `types/`, and the gate sentence lists seven steps (FR-005 names this file).
- `.github/workflows/build-check.yml` — no change: it runs `npm run verify` and names no chain step, so the `build / ci` check name is untouched and the branch ruleset needs no edit.
- `scripts/init.mjs` — no change needed by this plan; it runs `npm run verify`, so a renamed copy typechecks through the same chain. Confirm its `--ads-` sweep and its removal list do not need `types/` added, and say so in the PR body if they do not.
- cost — none: no workflow trigger, cron, agent fire or scheduled function is added. `tsc` adds a few seconds inside the existing `build / ci` job, no new job and no new billed minute.
- `docs/adr/` — none: this enforces strictness the repo already configured rather than deciding anything new. No ADR.
- none else — no reusable workflow body in [chrisgriffin/workflows](https://github.com/chrisgriffin/workflows) is touched, no required check is renamed, nothing published changes (this package is private and ships no `bin` or export), and no rule is newly stated in a second doc: the gate's step list lives in `docs/testing.md`, and `README.md`, `CLAUDE.md` and `docs/architecture.md` each already summarise it, so they are updated rather than newly duplicated.
