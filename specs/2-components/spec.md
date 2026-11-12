# Spec: Components: badge, button and card with contracts, stories, tests and Code Connect stubs, verified by design-delta

**Issue**: [#2](https://github.com/chrisgriffin/agentic-design-system/issues/2)

## Overview

Three example components that use the token tier and exercise every contract feature design-delta checks: `badge` (the minimal one to copy), `button` (enum props with defaults, an icon slot, a design-only state axis the code must not carry) and `card` (composition, `Card` and `Card.Header` as two contracts in one directory). Each ships as a React component with a CSS Module, a story, a test, a contract and a Code Connect stub, and `npm run verify` now runs the engine's gate.

## User scenarios

- A contributor copies `components/badge/` to start a new component and `npm run verify` tells them what the contract, the stylesheet and the code disagree on.
- A contributor adds a `state` prop to `Button`; `drift:verify` fails, because the contract declares that axis as design-only.
- A contributor writes `color: #333` in a module; `lint:styles` fails, because the property must be a `--ads-*` token.

## Functional requirements

- FR-001: `components/badge`, `components/button` and `components/card` each hold `name.tsx`, `name.module.css`, `name.stories.tsx`, `name.test.tsx`, `name.figma.tsx`, `name.contract.json` and `index.ts`; `card` also holds `card-header.{tsx,module.css,contract.json}` and exposes `Card.Header`.
- FR-002: `badge` has `children: string` and `tone` (`neutral | accent | success | danger`, default `neutral`); `button` has `children: string`, `size` (`sm | md | lg`, default `md`), `variant` (`default | outline`, default `default`), an `iconBefore` slot and a design-only `state` axis (`code: none`); `card` has a `children` slot and `padding` (`default | none`); `card-header` has `title: string` and a `trailing` slot.
- FR-003: Every contract declares an `anatomy` root and the `styles` bindings its stylesheet makes, so the audit reports no `styles/*` finding at warn or above.
- FR-004: `design-delta.json` at the root names `components` as both components and contracts dir, `tokens/json` as the token file, `tokens/css` as a style root, the `--ads-` prefix and the file suffixes, and `provider: figma` with no files.
- FR-005: Tests run on Vitest with jsdom and Testing Library; `npm test` runs the token test and the component tests.
- FR-006: `npm run verify` is `build:tokens → prettier:check → lint → lint:styles → drift:verify → test`, and `drift:audit`, `drift:contracts`, `drift:lint` and `drift:scaffold` scripts expose the engine's other commands.
- FR-007: design-delta installs from its public repo until its first npm release; the dependency moves to the npm range then.

## Success criteria

- [x] `components/badge`, `components/button` and `components/card` each hold `name.tsx`, `name.module.css`, `name.stories.tsx`, `name.contract.json`, `name.figma.tsx` (placeholder file key), `index.ts` and `name.test.tsx`; styles use only `--ads-*` custom properties.
- [x] `design-delta.json` at the root, `provider: figma` with no files, so `verify` runs contract-to-code only.
- [x] `npm run drift:verify` passes with 0 errors, and `npm run verify` includes it.
- [x] **Runnable:** `npx design-delta verify --json | node -p "JSON.parse(require('fs').readFileSync(0)).ok"` prints `true` (there is no `design-delta.json` today).

## Out of scope

- Storybook itself (#3): the stories import `@storybook/react-vite` types only, and nothing renders them yet.
- The `dock` output, hooks and `CLAUDE.md` (#4); `init --figma-file` (#6).
- The 48 review-level token findings (`token-unreferenced`, `token-unemitted`): a template defines more tokens than three components use, and primitives are inlined by design.
