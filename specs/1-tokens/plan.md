# Plan: Tokens: a DTCG source built by Terrazzo into prefixed CSS, with a manifest and the shared lint configs

## Technical context

- The source is ten JSON files, one per group per tier, written as plain DTCG (`$type`, `$value`, `$extensions.mode` for themed colors). `tokens/scripts/source.mjs` deep-merges them into one document, the way the Terrazzo CLI merges several token files, and guards against an id that lives in both tiers.
- `terrazzo.config.mjs` is one `@terrazzo/plugin-css` instance: `variableName` prefixes primitives so the build can find them, and one `modeSelectors` entry puts the dark mode of every semantic color under `[data-theme="dark"]`. Lint keeps Terrazzo's recommended rules plus kebab-case naming, sRGB and the required modes.
- `build-css.mjs` is Terrazzo's own parse → build → write, with one post-pass over the emitted CSS: a map of `--ads-primitive-*` declarations, substituted into every `var()` and then dropped. Primitives are literals, so one pass suffices.
- `build-manifest.mjs` reads the parsed token set and formats each token with `transformCSSValue` from `@terrazzo/token-tools`, per mode for colors, so the manifest and the CSS cannot disagree on a value.
- One `node --test` file builds the CSS and asserts the invariants that matter: no primitive and no `var()` left, both themes present and different, every manifest value literal.
- Lint: `@chrisgriffin/config` for Prettier, ESLint and TypeScript as the shared README shows; Stylelint with the standard and CSS Modules presets, `value-no-unknown-custom-properties` reading the built CSS, and `declaration-strict-value` on the properties a token must drive. The built CSS is ignored by Stylelint and Prettier.
- `build-check.yml` is the public sibling's stub: `build / ci`, `docs_owed: ""`, `npm run verify`. The branch ruleset requires `build / ci` only until the gate stub lands in #5.

## Surfaces touched

- `package.json`: new, private, no published surface.
- `.github/workflows/build-check.yml`: new; runs on this PR.
- Branch rulesets: `Evaluator` removed from the required checks for the bootstrap, restored after #5.
- No vault note, Routine or cron.
