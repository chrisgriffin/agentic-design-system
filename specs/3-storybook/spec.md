# Spec: Storybook with Tokens and Design Drift pages, published to GitHub Pages

**Issue**: [#3](https://github.com/chrisgriffin/agentic-design-system/issues/3)

## Overview

Storybook for the template: the component stories plus two system pages, Tokens (from the build manifest) and Design Drift (the engine's own audit), with docs, accessibility checks and a theme toggle. A check stub builds it on every PR and a Pages stub publishes it on every push to `main`.

## User scenarios

- A contributor runs `npm run storybook`, opens Tokens, and reads every semantic value in both themes without opening the JSON.
- A contributor opens Design Drift after a change and sees the same findings `npm run verify` reports, grouped by rule.
- A reviewer opens the Pages URL after a release and sees the template's components rendered against the tokens.

## Functional requirements

- FR-001: `.storybook/main.ts` runs `@storybook/react-vite` with `@storybook/addon-docs`, `@storybook/addon-a11y` and `@storybook/addon-themes`, and inlines the token manifest and `design-delta audit --json` at start.
- FR-002: `.storybook/preview.ts` loads `tokens/css/tokens.css` and a theme toggle that sets `data-theme` on the root; `preview-head.html` loads the two font families the tokens name.
- FR-003: A Tokens page lists the semantic colors in both themes, every other semantic token by category, and the primitive palette, all from the manifest.
- FR-004: A Design Drift page lists the audit's findings grouped by rule with their severity, and the counts.
- FR-005: `npm run build-storybook` writes `storybook-static/` (ignored), and `npm run verify` ends with it. Replaced by `specs/21-storybook-built-once/`: `verify` no longer builds the Storybook, and FR-006's `storybook / ci` is the one Storybook gate.
- FR-006: `storybook-check.yml` calls the fleet's reusable Node CI with `npm run build:tokens && npm run build-storybook` on every PR, reporting as `storybook / ci`; `deploy-pages.yml` builds and deploys `storybook-static/` to GitHub Pages on push to `main`.
- FR-007: The system pages' own styles are a CSS Module of `--ads-*` tokens, held by the same Stylelint rules as the components.

## Success criteria

- [x] `.storybook/` runs `react-vite` with `addon-docs`, `addon-a11y` and the theme addon, and loads the token CSS and fonts.
- [x] A Tokens page renders every semantic token from the manifest in both themes, and a Design Drift page renders the audit's findings.
- [x] `npm run build-storybook` is part of `npm run verify`, and a `storybook-check.yml` stub builds it on every PR. (Since `specs/21-storybook-built-once/`, only the stub builds it.)
- [x] A Pages deploy stub publishes `storybook-static/` on push to `main`, at the repo's GitHub Pages URL.
- [x] **Runnable:** `npm run build-storybook && test -f storybook-static/index.html && echo built` prints `built` (there is no `.storybook/` today).

## Out of scope

- A themed docs container: the Docs tab keeps Storybook's own light surface in dark mode. The preview and the pages follow the toggle.
- A dark-mode addon that mirrors a class onto the attribute: `@storybook/addon-themes` sets `data-theme` directly, so nothing needs mirroring.
- Requiring `storybook / ci` in the branch ruleset: Build 5 settles the ruleset with the gate stub.
