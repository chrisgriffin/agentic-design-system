# agentic-design-system

A design system template an agent can build in and keep honest: design tokens
in the [DTCG](https://www.designtokens.org/tr/2025.10/format/) format, built
into CSS custom properties by [Terrazzo](https://terrazzo.app); React
components with CSS Modules, each with a contract, a story and a test;
Storybook; and the [design-delta](https://github.com/chrisgriffin/design-delta)
gate, which fails CI when code and contracts disagree.

> This repo is built in layers. Today it carries the token layer; components,
> Storybook, the agent hooks and the release flow follow in that order.

## Tokens

- `tokens/json/primitives/` holds literal values (a neutral ramp, one accent
  ramp, a space scale, two font families, a type scale, radii, durations). A
  component never uses a primitive.
- `tokens/json/semantics/` aliases primitives by role (`color.bg.canvas`,
  `inset.md`, `font-size.lg`). Colors carry a `light` and a `dark` mode. This
  is the only tier a component may use.
- `npm run build:tokens` writes `tokens/css/tokens.css`: every semantic token
  as `--ads-<id>`, light values on `:root` and dark ones under
  `[data-theme="dark"]`, with every primitive inlined and dropped. The prefix
  is one constant in `tokens/scripts/source.mjs`.
- `tokens/scripts/build-manifest.mjs` exports the same tokens with resolved
  values, for the token pages.

Token files are plain JSON with one-line diffs, so any DTCG editor works on
them as-is.

## Development

```bash
npm install
npm run verify   # build:tokens → prettier:check → lint → lint:styles → test
```

Prettier, ESLint and TypeScript come from the shared
[`@chrisgriffin/config`](https://github.com/chrisgriffin/config); Stylelint
holds every `.css` file to the token tier (a color, size or font that is not a
`--ads-*` custom property fails).

## License

MIT.
