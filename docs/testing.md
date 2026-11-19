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
- `npm run typecheck` — `tsc --noEmit` over the program `tsconfig.json` includes: `components`, `.storybook` (named by its `.storybook/**/*` glob, since `tsc` skips a dot-directory a bare name reaches), `test-utils` (the gate's own tests), `types`, `vitest.setup.ts`, and from `tokens/scripts` only `build-manifest.d.mts`, its `.mjs` scripts being plain ESM outside the program; a type error fails it, naming the file and the line.
- `npm run prettier:check` — Prettier over everything `.prettierignore` does not exclude, in the shared `@chrisgriffin/config/prettier` style.
- `npm run lint` — ESLint from `eslint.config.mjs`, which spreads `@chrisgriffin/config/eslint` first.
- `npm run lint:styles` — Stylelint over every `.css` file: a color, fill or stroke, font family, size or weight, line height, border radius, margin or padding, gap, or transition or animation duration or timing value that is not a `--ads-*` property fails (other sizes, such as `width`, are not checked), and so does a property name the built CSS does not define.
- `npm run drift:verify` — `design-delta verify`: every contract validated, then compared with its component and stylesheet; an error-severity finding fails it, and a component no contract references is one (`coverage/uncontracted-component`, raised to `error` in `design-delta.json`).
- `npm test` — `node --test` over `tokens/scripts/*.test.mjs`, then `vitest run` over `components/**/*.test.tsx` and `test-utils/**/*.test.ts` in jsdom (`test-utils/contract-coverage.test.ts` in Node, since it runs the engine).

`storybook-check.yml` is the Storybook gate, `storybook / ci`, and the only check that builds this checkout's Storybook: `npm run build:tokens && npm run build-storybook`, the Storybook build also running the engine's audit for the Design Drift page. Run it with `verify` before pushing a change to a component, a story or `.storybook/`.

<!-- init -->

`init-check.yml` first runs `cli/create.mjs` with sample values into a temp folder, with no token, SSH disabled and npm 11 on the path, so the check fails when a created system does not install without credentials, does not pass its own gate, or still holds `cli/`, `scripts/init.mjs` or the template's `specs/`, when its README intro is not `The <name> design system.` or its `LICENSE` still names the template's copyright holder (#49), when its `package-lock.json` differs from the template's past the name and the removed `bin`, or when `npm@10 ci --dry-run`, Node 22's npm, refuses that lock file (#44). It then drops the nested `yaml-to-momoa` entry from the PR checkout's lock file, as an npm 11 install does, and runs `scripts/init.mjs` with sample values on that checkout, renaming it in place, as `init / ci`: the script runs `npm run verify` and then `npm run build-storybook` itself on the renamed checkout, and the check fails when the script, `cli/` or `specs/` survives, when `LICENSE`, `package.json`'s `description` or the README intro does not carry the `--author` and `--description` it was given, or the README still describes the template (#49), when an `--ads-` reference is left outside `specs/`, `node_modules` and `storybook-static`, when the lock file it leaves is not the committed one renamed (#44), or when a Markdown file outside those still holds an `<!-- init -->` marker or names the script, `cli/create.mjs` or its workflow. Both runs fail when the copy has no `.claude/skills/setup-system/SKILL.md`, and the init run when its closing line does not name `/setup-system` (#59).

<!-- /init -->

Narrower runs while working: `npx vitest run components/badge` for one component, `npx vitest` to watch, `node --test tokens/scripts/*.test.mjs` for the tokens alone.

## What is tested

- `tokens/scripts/tokens.test.mjs` — the built CSS declares no `--ads-primitive-*` property, has no `var()` left and declares more than 40 `--ads-*` properties, both themes are present and differ, and every manifest value is a literal.
- `tokens/scripts/inline-primitives.test.mjs` — `inlinePrimitives` on its own, without running the build: a primitive reference becomes the primitive's value, primitive declarations are gone from the output, an undeclared primitive throws, a primitive aliasing another inlines to its final value, a reference cycle throws naming it (a self-reference and a cycle nothing references too), a reference with whitespace or a fallback is inlined, a semantic name containing `-primitive-` is left alone, a primitive declared in two blocks throws, and a primitive left in the output in any other form throws.

<!-- init -->

- `cli/create.test.mjs` — the create command up to its hand-off to `scripts/init.mjs`, under `node --test`: `--help` prints the usage line and calls `--owner` your GitHub username, a missing value with no terminal exits 1 and names the flag, an unknown option, a value flag with no value and a second name are refused with the usage; `--author` and `--description` reach the init script as given, and one holding a line break is refused (#49); a value the init script refuses (this copy's or the cloned template's), a target that is a file, a target folder that is not empty, a failed clone and a missing git all exit 1 with one message and leave nothing behind; the init script in a copy with a `node_modules` and no committed lock exits 1 naming #44 and changes nothing; the init script refuses an argument it does not recognize with the usage, naming it, before it writes anything, and still takes `--check`, `--fleet`, `--help` and `-h` (#52); an empty target folder is used; the closing line names the folder it made; a run writes the template as a new git repository with no history; and the prefix and owner defaults it offers in a terminal.
- `cli/lockfile.test.mjs` — no `minimatch` in `package-lock.json` resolves inside GHSA-g3hv-75wg-m249's range (`>= 7.0.0, < 11.0.1`), the advisory `package.json`'s `minimatch` override fixes, and the range check counts its bounds and a pre-release of 11.0.1 as the advisory does (#43).
- `cli/setup-skill.test.mjs` — the setup skill a copy runs after init (#59): it ships as `.claude/skills/setup-system/SKILL.md` with that name in its frontmatter, every repo path it names exists and is none init removes, it names nothing init rewrites or strips (the template's name and prefix, an `<!-- init -->` marker, the init script, the create command or its check), and both closing lines name `/setup-system`.

<!-- /init -->

- `components/<name>/<name>.test.tsx` — each component renders its content and the class its stylesheet keys off, with Testing Library; CSS Module class names are unscoped in tests so an assertion can name them.
- The same files' accessibility tests — `expectNoViolations` from `test-utils/axe.ts` runs axe-core over the rendered DOM and fails on any violation, naming the rule, how many elements broke it and the first one. It covers each component's default and every variant its contract gives code: `badge`'s four tones, `button`'s three sizes by two variants plus the `iconBefore` slot, and `card`'s two paddings, each with a `Card.Header`, which is also `card-header`'s coverage. `color-contrast` is switched off: jsdom has no layout and no computed colour, so axe cannot measure it, and rules that need layout report incomplete rather than failing. Contrast is checked only by the Storybook accessibility panel (`@storybook/addon-a11y`), which shows findings in the browser and fails nothing.
- `test-utils/a11y-coverage.test.ts` — the gate enforces the rule that every component test calls `expectNoViolations`: it reads each `components/**/*.test.tsx` and fails, naming the file, when one never calls it (comments do not count, and importing it is not calling it). It also fails, naming the folder, when a folder under `components/` holds a component source file but no `.test.tsx`; the check is per folder, so `card-header.tsx` is covered by `card.test.tsx`.
- `test-utils/contract-coverage.test.ts` — the gate enforces the rule that every component has a contract: it copies the config, `components/` and `tokens/` into a temp directory, adds a component no contract references, runs the installed `design-delta`, and fails unless `audit` reports `coverage/uncontracted-component` at `error` and `verify` exits non-zero naming it. Lowering that rule's severity in `design-delta.json` fails it. It also guards the typecheck: it asks TypeScript which files `tsconfig.json`'s program holds and fails unless both `test-utils/*.test.ts` files are among them, so dropping `test-utils` from `include`, or an `exclude` that reaches it, fails `npm test`.
- Keyboard, which axe does not check: axe reads the markup and never presses a key, so `button.test.tsx` drives Button with `userEvent` the way a keyboard user would. Tab reaches an enabled Button, Enter and Space each fire its `onClick` exactly once, and a disabled Button is skipped by Tab and fires nothing on Enter or Space. Button is the only interactive component, so Badge and Card have no keyboard tests.
- `design-delta verify` — not a test file but the gate's own check: the contract's props against the component's, its anatomy against the rendered tree, its token bindings against the stylesheet.

## Adding a test

- A component's test is `components/<name>/<name>.test.tsx`; `vite.config.ts` collects `components/**/*.test.tsx` and `test-utils/**/*.test.ts` only.
- A component's test also calls `expectNoViolations` from `../../test-utils/axe` on each variant its contract gives code; `npm run scaffold` writes the first call for you, and `test-utils/a11y-coverage.test.ts` fails `npm test` on a test file without one, and on a component folder with no test file at all. A violation is fixed in the component, never by switching a rule off.
- A token test is a `.test.mjs` beside the scripts under `tokens/scripts/`, on `node:test`.
- `vitest.setup.ts` loads jest-dom's matchers and cleans the DOM after each test. It is in the TypeScript program, so `typecheck` sees those matchers on every test file.
