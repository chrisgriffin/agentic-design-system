# Spec: Tokens: a DTCG source built by Terrazzo into prefixed CSS, with a manifest and the shared lint configs

**Issue**: [#1](https://github.com/chrisgriffin/agentic-design-system/issues/1)

## Overview

The template's first layer. A small design-token source in DTCG JSON, two tiers (primitives and semantics), built by Terrazzo into one CSS file of `--ads-*` custom properties with light and dark modes, plus a manifest of resolved values for the token pages that come later. The same PR sets up the shared Prettier, ESLint, TypeScript and Stylelint configs, the `verify` chain, and the CI stub that runs it, so every later build is checked the same way.

## User scenarios

- A maintainer edits `tokens/json/semantics/color.json`, runs `npm run build:tokens`, and `tokens/css/tokens.css` carries the new value in both themes with no primitive left in it.
- A component author writes `color: var(--ads-color-fg-default)` and Stylelint accepts it; `color: #333` fails `lint:styles`.
- A PR runs `npm run verify` through the `build / ci` check.

## Functional requirements

- FR-001: `tokens/json/primitives/` holds color (neutral and blue ramps, red and green), space, typography (two families, weights, a size scale, line heights), shape (radii, border widths) and motion (durations, curves) as literal DTCG values.
- FR-002: `tokens/json/semantics/` aliases primitives by role; every color token carries `light` and `dark` under `$extensions.mode`, held by Terrazzo's `core/required-modes` rule.
- FR-003: `tokens/scripts/source.mjs` merges both tiers into one document, exports the `ads` prefix constant, and throws when a semantic id collides with a primitive id.
- FR-004: `terrazzo.config.mjs` names every semantic token `--ads-<id>` and every primitive `--ads-primitive-<id>`, puts light colors on `:root` and dark ones under `[data-theme="dark"]`.
- FR-005: `tokens/scripts/build-css.mjs` runs Terrazzo's parse and build, then inlines every `var(--ads-primitive-*)` and drops the primitive declarations.
- FR-006: `tokens/scripts/build-manifest.mjs` exports `{ semantic[], themes{light,dark}, primitivePalette[] }` with literal CSS values, resolved through Terrazzo's own CSS formatter.
- FR-007: `@chrisgriffin/config#v1` supplies Prettier, ESLint and TypeScript; `.stylelintrc.json` extends `stylelint-config-standard` and `stylelint-config-css-modules` and holds color, font, radius, spacing, gap and motion declarations to `--ads-*` values; `npm run verify` runs `build:tokens`, `prettier:check`, `lint`, `lint:styles` and `test`.
- FR-008: `.github/workflows/build-check.yml` calls `chrisgriffin/workflows@v1` and reports as `build / ci`, the check the branch rulesets require.

## Success criteria

- [x] `tokens/json/primitives/` and `tokens/json/semantics/` hold DTCG tokens for color (a neutral ramp and one accent ramp, light and dark modes), space, typography (two families, one scale), shape and motion, small enough to read in one sitting.
- [x] `npm run build:tokens` emits `tokens/css/tokens.css` with only semantic `--ads-*` custom properties (primitives inline and drop), with light and dark modes, from `terrazzo.config.mjs`; the prefix is one constant.
- [x] `tokens/scripts/build-manifest.mjs` exports the resolved values (semantic tokens, both themes, the primitive palette) for the Storybook token pages.
- [x] `@chrisgriffin/config#v1` supplies Prettier, ESLint and TypeScript; Stylelint checks every `.css` file; `npm run verify` runs `build:tokens`, `prettier:check`, `lint`, `lint:styles` and `test`, and a `build-check.yml` stub runs it on every PR.
- [x] **Runnable:** `npm run build:tokens && grep -c -- '--ads-' tokens/css/tokens.css` prints a number above 40 (there is no package.json today).

## Out of scope

- Components, Storybook and the token pages that read the manifest: #2 and #3.
- The remaining workflow stubs, docs and the release flow: #5. The `Evaluator` requirement returns to the branch ruleset once #5's gate stub is on `develop`.
