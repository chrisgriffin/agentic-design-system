# Testing

The tests prove that the token build emits what the components may use and nothing else, that each component renders what its contract says, and that the engine's gate agrees with both.

## The gate

- CI runs this repo's gate on every PR; the commands are the `run:` steps of
  its CI workflow in `.github/workflows/`.
- A PR merges only when that gate is green.
- Run the same commands locally before pushing. A failing test is fixed in
  the code, never by weakening the assertion.
- A behavior change starts with a test that fails without it.

## Running tests

`build-check.yml` runs `npm run verify`, which is these seven in order:

- `npm run build:tokens` — Terrazzo over `tokens/json`, then the primitive inlining; the later steps read its output.
- `npm run prettier:check` — Prettier over everything `.prettierignore` does not exclude, in the shared `@chrisgriffin/config/prettier` style.
- `npm run lint` — ESLint from `eslint.config.mjs`, which spreads `@chrisgriffin/config/eslint` first.
- `npm run lint:styles` — Stylelint over every `.css` file: a color, fill or stroke, font family, size or weight, line height, border radius, margin or padding, gap, or transition or animation duration or timing value that is not a `--ads-*` property fails (other sizes, such as `width`, are not checked), and so does a property name the built CSS does not define.
- `npm run drift:verify` — `design-delta verify`: every contract validated, then compared with its component and stylesheet; an error-severity finding fails it.
- `npm test` — `node --test` over `tokens/scripts/*.test.mjs`, then `vitest run` over `components/**/*.test.tsx` in jsdom.
- `npm run build-storybook` — the Storybook build, which also runs the engine's audit for the Design Drift page.

`storybook-check.yml` runs the token and Storybook builds again as their own check, `storybook / ci`.

<!-- init -->

`init-check.yml` runs `scripts/init.mjs` with sample values on the PR's checkout, renaming it in place, as `init / ci`: the script runs the whole chain itself on the renamed checkout, and the check fails when the script survives, when an `--ads-` reference is left outside `specs/`, `node_modules` and `storybook-static`, or when a Markdown file outside those still holds an `<!-- init -->` marker or names the script or its workflow.

<!-- /init -->

Narrower runs while working: `npx vitest run components/badge` for one component, `npx vitest` to watch, `node --test tokens/scripts/*.test.mjs` for the tokens alone.

## What is tested

- `tokens/scripts/tokens.test.mjs` — the built CSS declares no `--ads-primitive-*` property, has no `var()` left and declares more than 40 `--ads-*` properties, both themes are present and differ, and every manifest value is a literal.
- `tokens/scripts/inline-primitives.test.mjs` — `inlinePrimitives` on its own, without running the build: a primitive reference becomes the primitive's value, primitive declarations are gone from the output, and an undeclared primitive throws.
- `components/<name>/<name>.test.tsx` — each component renders its content and the class its stylesheet keys off, with Testing Library; CSS Module class names are unscoped in tests so an assertion can name them.
- `design-delta verify` — not a test file but the gate's own check: the contract's props against the component's, its anatomy against the rendered tree, its token bindings against the stylesheet.

## Adding a test

- A component's test is `components/<name>/<name>.test.tsx`; `vite.config.ts` collects `components/**/*.test.tsx` only.
- A token test is a `.test.mjs` beside the scripts under `tokens/scripts/`, on `node:test`.
- `vitest.setup.ts` loads jest-dom's matchers and cleans the DOM after each test.
