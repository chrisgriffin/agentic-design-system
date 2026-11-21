# Plan: Components: badge, button and card with contracts, stories, tests and Code Connect stubs, verified by design-delta

## Technical context

- Components are plain React 19 function components with `interface` props extending the matching DOM attributes, class names joined by hand (no class utility), and CSS Modules with native nesting. Every color, size, font, radius, gap and motion value is a `--ads-*` custom property.
- Contracts follow the engine's schema: `props` with enums, defaults, a `slot` and one `code: none` axis; an `anatomy` root bound to a prop; `styles.root.base` naming the token each declaration binds, and `variants` keyed by prop value. The header is the second contract in the card directory, conforming against its own file.
- `design-delta.json` is the engine's config with explicit paths and conventions; the design side is `figma` with no files, so only contract-to-code runs. Reports, snapshots and state go under `.design-delta/`, with reports and state ignored.
- `vite.config.ts` carries the React plugin and the Vitest config (jsdom, non-scoped CSS Module class names so a test can assert on them, a setup file with jest-dom and cleanup). `npm test` runs the token test on `node --test` and the component tests on Vitest.
- Stories type against `@storybook/react-vite`; `storybook` and `@storybook/react-vite` are installed for the types, and #3 configures them. `@figma/code-connect` is installed for the stubs.
- Stylelint allows camelCase class selectors alongside kebab-case, as CSS Modules read them as properties.
- design-delta is a git dependency on its public repo until its first npm release.

## Surfaces touched

- `package.json`: new dev dependencies and scripts; still private.
- `design-delta.json`, `vite.config.ts`, `vitest.setup.ts`: new.
- `.stylelintrc.json`: the class pattern.
- `README.md`: the components section.
- No workflow, vault note, Routine or cron.
