# Plan: The typecheck covers the gate's own tests in test-utils/

## Technical context

- `tsconfig.json` gains `test-utils` in `include`. That surfaces three errors, all in `a11y-coverage.test.ts` and all one cause: `import.meta.glob` has no type, because nothing in the program loads Vite's types.
- The fix is one reference at the top of that file to `vite/types/importMeta.d.ts`, which types `import.meta.glob` and nothing else. `vite/client` is not used: it also declares `*.module.css`, which `types/css-modules.d.ts` already owns.
- The guard is one test in `test-utils/contract-coverage.test.ts`, the Node-side gate test, which reads `tsconfig.json` and expects `test-utils` in `include`. It sits in an existing file so the folder still holds two test files, the count the issue's runnable line prints.

## Surfaces touched

- `tsconfig.json`: the `include` entry.
- `test-utils/a11y-coverage.test.ts`: the type reference. `test-utils/contract-coverage.test.ts`: the guard test.
- `docs/testing.md`, `CLAUDE.md`: `test-utils` named in the typecheck's coverage.
- `docs/architecture.md`, the README: unchanged, since neither lists what the typecheck covers.
- No workflow, ruleset, Routine, cron or Mac-installed file.
