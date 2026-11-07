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
- `npm run lint:styles` — Stylelint over every `.css` file: a color, size, font, radius, gap or motion value that is not a `--ads-*` property fails, and so does a property name the built CSS does not define.
- `npm run drift:verify` — `design-delta verify`: every contract validated, then compared with its component and stylesheet; an error-severity finding fails it.
- `npm test` — `node --test` over `tokens/scripts/*.test.mjs`, then `vitest run` over `components/**/*.test.tsx` in jsdom.
- `npm run build-storybook` — the Storybook build, which also runs the engine's audit for the Design Drift page.

`storybook-check.yml` runs the token and Storybook builds again as their own check, `storybook / ci`.

Narrower runs while working: `npx vitest run components/badge` for one component, `npx vitest` to watch, `node --test tokens/scripts/tokens.test.mjs` for the tokens alone.

## What is tested

- `tokens/scripts/tokens.test.mjs` — the built CSS holds only `--ads-*` properties with no primitive and no `var()` left, both themes are present and differ, and every manifest value is a literal.
- `components/<name>/<name>.test.tsx` — each component renders its content and the class its stylesheet keys off, with Testing Library; CSS Module class names are unscoped in tests so an assertion can name them.
- `design-delta verify` — not a test file but the gate's own check: the contract's props against the component's, its anatomy against the rendered tree, its token bindings against the stylesheet.

## Adding a test

- A component's test is `components/<name>/<name>.test.tsx`; `vite.config.ts` collects `components/**/*.test.tsx` only.
- A token test is a `.test.mjs` beside the scripts under `tokens/scripts/`, on `node:test`.
- `vitest.setup.ts` loads jest-dom's matchers and cleans the DOM after each test.
