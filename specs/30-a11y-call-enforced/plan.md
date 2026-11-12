# Plan: A component test that never runs the accessibility assertion fails npm test

## Technical context

- Vitest runs on Vite, so `import.meta.glob("../components/**/*.test.tsx", { query: "?raw", import: "default", eager: true })` hands the test every component test file's source as a string, keyed by path, with no Node `fs` import and no new dependency.
- The check parses each source as TSX with the TypeScript compiler (already a dev dependency) and looks for a call expression whose callee is the identifier `expectNoViolations`. The parser decides what is a comment, a string, a template or JSX, so `/*` or `//` inside a string or a JSX attribute never hides a real call, and a call inside a comment or a string never counts. Importing without calling fails: an import is not a call.
- `test.each` over the found paths gives one case per file, titled with the path, so a failure names the file.
- The test lives at `test-utils/a11y-coverage.test.ts`, beside the helper it enforces; `vite.config.ts`'s `include` gains `test-utils/**/*.test.ts` so `vitest run` collects it.

## Surfaces touched

- `test-utils/a11y-coverage.test.ts` — new: the check.
- `vite.config.ts` — `include` gains `test-utils/**/*.test.ts`.
- `docs/testing.md` — § Running tests (what `vitest run` collects), § What is tested and § Adding a test say the gate enforces the call.
- `docs/architecture.md` § `test-utils/` — names the new test beside `axe.ts`.
- `CLAUDE.md` § CI accessibility line — read; it states the rule, which now holds, so it stays as is.
- `scripts/scaffold-component.mjs` — read; its test template already calls `expectNoViolations`, so untouched; proven by scaffolding a probe, running `npm test`, deleting it.
- cost — none: a few milliseconds inside the existing `npm test`; no trigger, cron or agent fire added.
- none else — no directory added, no published surface, workflow, ruleset, Routine, vault note or Mac-installed file.
