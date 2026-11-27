# Plan: Every variant a component's contract declares gets an accessibility check

## Technical context

- The base tsconfig sets `resolveJsonModule`, so a test can `import contract from "./<name>.contract.json"`; Vite imports JSON natively.
- `test-utils/variants.ts` exports `variantCases(contract)`: the cartesian product of the code-side enum props' values, as `[title, props]` pairs for `test.each`, titled like `size sm, variant outline` (`defaults` when there is none). The props are cast to the component's prop type: a contract value the type does not know yet is exactly the case to run, and `drift:verify` already reports a contract and a prop type that disagree.
- `a11y-coverage.test.ts` already parses each test file with the TypeScript parser to find `expectNoViolations` calls; the same parse finds the contract file's import binding and a `test.each(variantCases(<that binding>))` whose case calls `expectNoViolations`. Contracts are globbed eagerly as JSON (`import.meta.glob`), so the check reads their props.
- No third `test-utils/*.test.ts` file: `contract-coverage.test.ts` pins exactly two gate tests, and the helper's own cases sit in `a11y-coverage.test.ts`, the rule they serve.

## Surfaces touched

- `test-utils/variants.ts` — new helper.
- `test-utils/a11y-coverage.test.ts` — the helper's cases, and the per-contract check.
- `components/badge/badge.test.tsx`, `components/button/button.test.tsx`, `components/card/card.test.tsx` — read their contract through the helper.
- `scripts/scaffold-component.mjs` — the first test it writes uses the helper (CLAUDE.md: `components/badge/*` → the scaffold templates).
- `docs/testing.md` — § What is tested and § Adding a test.
- `docs/architecture.md` § `test-utils/` — names `variants.ts` and the new check.
- `README.md`, `CLAUDE.md` — read; both already say each component's test runs axe over its variants, which now holds by construction, so unchanged.
- cost — none: a few milliseconds inside the existing `npm test`; no trigger, cron or agent fire added.
- none else — no directory added, no published surface, workflow, ruleset, Routine or Mac-installed file.
