# agentic-design-system

A design system template an agent can build in and keep honest: design tokens
in the [DTCG](https://www.designtokens.org/tr/2025.10/format/) format, built
into CSS custom properties by [Terrazzo](https://terrazzo.app); React
components with CSS Modules, each with a contract, a story and a test;
Storybook; and the [design-delta](https://github.com/chrisgriffin/design-delta)
gate, which fails CI when code and contracts disagree.

> This repo is built in layers, each a merged build: the tokens, the
> components with contracts, the Storybook, the agent layer, and the release
> flow.<!-- init --> `scripts/init.mjs` turns a copy into a named system: see
> [Starting your own](#starting-your-own).<!-- /init -->

## Starting your own

```bash
node scripts/init.mjs --name my-system --prefix my --owner my-login [--figma-file <key>]
```

One run rewrites the name, the `--ads-*` prefix and the owner everywhere they
appear, writes the Figma file key into `design-delta.json` and the Code
Connect stubs when given one, installs, docks the engine, runs `npm run verify`,
builds the Storybook and then removes itself, its CI check and this section. Pass `--fleet` to keep
`evaluator-gate.yml` and `claude-mention.yml`, which need a private operator
behind them; without it they are removed. Nothing is committed: read the
diff, then commit.

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

## Components

Three examples under `components/`, each a directory of the same seven files:
`name.tsx`, `name.module.css`, `name.stories.tsx`, `name.test.tsx`,
`name.figma.tsx` (Code Connect, a placeholder file key until one exists),
`name.contract.json` and `index.ts`.

| Component | What it shows                                                                                    |
| --------- | ------------------------------------------------------------------------------------------------ |
| `badge`   | The minimal component, the one to copy.                                                          |
| `button`  | Enum props with defaults, an icon slot, and a design-only `state` axis the code must not carry.  |
| `card`    | Composition: `Card` and `Card.Header` are two contracts in one directory, each against its file. |

A **contract** (`*.contract.json`) is the source of truth for a component: its
props, its element structure and the tokens its styles bind. `npm run
drift:verify` runs [design-delta](https://github.com/chrisgriffin/design-delta)
over `design-delta.json` and fails when the code or a stylesheet disagrees with
a contract. Styles use only `--ads-*` custom properties; Stylelint refuses a
literal where a token belongs.

## Storybook

`npm run storybook` serves the component stories plus two system pages, and
`npm run build-storybook` writes `storybook-static/`, published to
[GitHub Pages](https://chrisgriffin.github.io/agentic-design-system/) on every
push to `main`.

- **Tokens** renders every semantic token from the build manifest, the colors
  in both themes side by side, and the primitive palette.
- **Design Drift** renders `design-delta audit --json`, run when Storybook
  starts: the same verdict `npm run verify` gates on.

The toolbar's theme toggle sets `data-theme` on the preview's root, which is
what the token CSS keys off. Docs and accessibility checks come from
`@storybook/addon-docs` and `@storybook/addon-a11y`.

## Development

```bash
npm install
npm run verify   # build:tokens → prettier:check → lint → lint:styles → drift:verify → test
npm run build-storybook   # the Storybook; this checkout's is built by storybook / ci on a PR, deploy-pages.yml on main
```

How the repo fits together, in prose: [docs/architecture.md](docs/architecture.md);
how a change becomes a release: [docs/releasing.md](docs/releasing.md).

Prettier, ESLint and TypeScript come from the shared
[`@chrisgriffin/config`](https://github.com/chrisgriffin/config); Stylelint
holds every `.css` file to the token tier (a color, size or font that is not a
`--ads-*` custom property fails).

## Agent layer

`.claude/settings.json` wires three hooks: `bash-guard.sh` before every Bash
call (no force push, no push to `main`), `post-edit-check.sh` after every
edit (Prettier, and Stylelint on CSS), and `design-delta-verify.mjs`, which
`design-delta dock` generates and which runs the gate after every edit so an
agent sees drift before it finishes. `.claude/skills/design-delta/` is the
dock's stub, pointing at the installed engine's own skill.
`npm run scaffold -- <name>` writes a new component directory in the shape of
`components/badge` plus the contract the engine drafts from its props.
`CLAUDE.md` is the rulebook an agent reads first.

## License

MIT.
