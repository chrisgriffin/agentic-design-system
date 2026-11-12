# Tasks

## Phase 1: Red

- [x] T001 Run the runnable line on an empty checkout: it fails, since there is no package.json.

## Phase 2: Build

- [x] T002 `package.json`, `.gitignore`, `@chrisgriffin/config`, Terrazzo, Stylelint and ESLint installed.
- [x] T003 Ten DTCG token files under `tokens/json/primitives/` and `tokens/json/semantics/`.
- [x] T004 `tokens/scripts/source.mjs`, `terrazzo.config.mjs`, `tokens/scripts/build-css.mjs` with the primitive inlining pass.
- [x] T005 `tokens/scripts/build-manifest.mjs` over Terrazzo's parsed set and CSS formatter.
- [x] T006 `tokens/scripts/tokens.test.mjs` on `node --test`.
- [x] T007 `eslint.config.mjs`, `tsconfig.json`, `.stylelintrc.json`, `.stylelintignore`, `.prettierignore`, `README.md`, `LICENSE`, `.github/workflows/build-check.yml`.

## Phase 3: Green

- [x] T008 `npm run verify` green; the runnable line prints a number above 40.
