# Plan: A component folder with no test file fails npm test

## Technical context

- `test-utils/a11y-coverage.test.ts` already globs `../components/**/*.test.tsx` with Vite's `import.meta.glob`. A second, non-eager glob of `../components/**/*.tsx` gives every `.tsx` path as a key without importing any module, so no component code runs and no new dependency is needed.
- A path is a component source file when it does not end in `.test.tsx`, `.stories.tsx` or `.figma.tsx`; its folder is its directory. A folder is covered when some test file's directory is the same folder, so `card/`'s `card-header.tsx` is covered by `card.test.tsx`.
- `test.each` over the sorted folders gives one case per folder, titled with the folder's path, so a failure names the folder.
- The check sits in the same file as the call check: both enforce one rule, that every component is checked for accessibility.

## Surfaces touched

- `test-utils/a11y-coverage.test.ts` — the per-folder check, plus a guard that the glob found component folders.
- `docs/testing.md` — § What is tested and § Adding a test say the gate fails a component folder with no test file.
- `docs/architecture.md` § `test-utils/` — says `a11y-coverage.test.ts` also fails a component folder with no test.
- `CLAUDE.md` § Component directory shape and § CI — read; they already require `<name>.test.tsx` in every folder, which now holds, so they stay as is.
- `README.md` — read; its accessibility claim now holds for a hand-written folder, so it stays as is.
- `scripts/scaffold-component.mjs` — read; it already writes a test file, so untouched; proven by scaffolding a probe, running `npm test`, deleting it.
- cost — none: a few milliseconds inside the existing `npm test`; no trigger, cron or agent fire added.
- none else — no directory added, no published surface, workflow, ruleset, Routine, vault note or Mac-installed file.
