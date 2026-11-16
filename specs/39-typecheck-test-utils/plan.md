# Plan: The typecheck covers the gate's own tests in test-utils/

## Technical context

- `tsconfig.json` gains `test-utils` in `include`. That surfaces three errors, all in `a11y-coverage.test.ts` and all one cause: `import.meta.glob` has no type, because nothing in the program loads Vite's types.
- The fix is `types/import-meta-glob.d.ts`, which adds `glob` to `ImportMeta`, typed by Vite's `ImportGlobFunction` from `vite/types/importGlob.d.ts`, and nothing else. Neither `vite/types/importMeta.d.ts` nor `vite/client` is used: each also adds `env` and `hot` to `import.meta` across the program, so `import.meta.env.TYPO` would type-check, and `vite/client` also declares `*.module.css`, which `types/css-modules.d.ts` already owns.
- The guard is one test in `test-utils/contract-coverage.test.ts`, the Node-side gate test, which resolves `tsconfig.json` with TypeScript's own config parser and expects both `test-utils/*.test.ts` files in the program's file list, so an `exclude`, an `include` spelled another way or JSONC comments count as `tsc` counts them. It sits in an existing file so the folder still holds two test files, the count the issue's runnable line prints.

## Surfaces touched

- `tsconfig.json`: the `include` entry.
- `types/import-meta-glob.d.ts`: the `import.meta.glob` type. `test-utils/contract-coverage.test.ts`: the guard test.
- `docs/testing.md`, `CLAUDE.md`: `test-utils` named in the typecheck's coverage.
- `docs/architecture.md`, the README: unchanged, since neither lists what the typecheck covers.
- No workflow, ruleset, Routine, cron or Mac-installed file.
