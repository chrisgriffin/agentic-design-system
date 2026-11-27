# agentic-ds

A design system template an agent can build in and keep honest.

It holds design tokens in the [DTCG](https://www.designtokens.org/tr/2025.10/format/) format, built
into CSS custom properties by [Terrazzo](https://terrazzo.app); React
components with CSS Modules, each with a contract, a story and a test;
Storybook; and the [design-delta](https://github.com/chrisgriffin/design-delta)
gate, which fails CI when code and contracts disagree, or when a component
has no contract at all.

<!-- init -->

> This repo is built in layers, each a merged build: the tokens, the
> components with contracts, the Storybook, the agent layer, and the release
> flow. One command turns it into a named system of your own: see
> [Starting your own](#starting-your-own).

<!-- /init -->

## Starting your own

```bash
npm create agentic-ds
```

Run it in the folder that will be the system, usually a fresh clone of the
repo you made for it, or point it at another with `--dir <path>`. The folder
names the system unless `--name` does. It asks for a custom property prefix
and your GitHub username (or takes them as `--prefix` and `--owner`, with
`--author <name>`, `--description <text>` and `--figma-file <key>` when you
want them), copies the template's default branch in and runs the init script
there. The folder must be empty, or in a git repository with nothing
uncommitted or ignored under it, so git can give back every file it replaces (a GitHub
repo's first README and LICENSE, say); it names each one before its next steps. A
repository keeps its history and branch; a folder that is not in one gets a
new repository on `main`, the branch its build check and Pages deploy run on. Without `--author` it says which name it writes
into `LICENSE`: git's `user.name`, else `--owner`. It needs Node 22, git and no
account or token.

`npm create agentic-ds` runs the latest release of the create command, which
npm holds as `create-agentic-ds`; with npm, flags go after a `--`, as in
`npm create agentic-ds -- --prefix my --owner my-username`.
`npx github:chrisgriffin/agentic-ds` runs the default branch's copy instead,
and takes the flags as they are. Either way the template it copies in is the
default branch's.

In a copy you made by hand, run the init script yourself:

```bash
node scripts/init.mjs --name my-system --prefix my --owner my-username [--author <name>] [--description <text>] [--figma-file <key>]
```

One run rewrites the name, the `--ads-*` prefix and the owner everywhere they
appear, writes `--author` into `LICENSE` and `--description` into
`package.json` and the intro above, writes the Figma file key into `design-delta.json` and the Code
Connect stubs when given one, installs with `npm ci` from the template's lock
file (renamed, never re-resolved, so whichever npm you run it with, CI's
`npm ci` accepts it; if you already installed in the copy, it first restores
the committed lock, and stops when there is none), docks the engine, runs `npm run verify`,
builds the Storybook and then removes itself, its CI check, the create command and its npm publish workflow, the template's `specs/`, the release entries in `CHANGELOG.md` (only its preamble stays, and the version starts at `0.0.0`) and this section; the system's `package.json` carries your name and `private: true`. Pass `--fleet` to keep
`evaluator-gate.yml` and `claude-mention.yml`, which need a private operator
behind them; without it they are removed. Nothing is committed: read the diff, then commit.

Then open Claude Code in the new folder and run `/setup-system`. It asks what
the system is for, how other projects get it, its fonts and accent color, and
which of the template's examples and decision records to keep; then it
rewrites the docs that still describe the template, sets the brand tokens,
runs `npm run verify` and the Storybook build, and deletes itself. It commits
nothing either.
An agent already in a session elsewhere reads the skill's file, as the create
command's next steps say, and takes any answers its brief already gives.
Putting the new system on GitHub is the owner's to do: `docs/releasing.md`
lists the steps.

To watch the create command run from a checkout of the template, run
`npm run demo`: it sets up a fresh `demo-ds` folder in your temp folder with
the prompts live, so Enter takes each default, then prints the folder and a
count of what `git status` shows there. The template it copies is the last commit (it warns when you have
uncommitted changes); the create command itself runs from your files. Flags
after `--` go to the create command: `npm run demo -- --no-init` stops after
the copy, and `--dir` sets up, and reports on, a folder of your own instead.
`--clean` is the demo's own flag, never passed on, and it is taken alone: when
you are done, `npm run demo:clean` (the same as `npm run demo -- --clean`)
removes the `demo-ds` folder and runs nothing else; it never removes a folder `--dir` named. The `--` is required:
`npm run demo --clean` is a flag to npm, which runs a full demo and rebuilds
the folder.

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

Both tiers are wider than the three example components on purpose: a copy
starts with whole ramps and a whole semantic layer, so the next component
needs no new token. `design-delta.json` records that choice, so
`npm run drift:audit` reports `0 review(s)` on a fresh copy:

- `tokens/token-unreferenced` ignores `tokens/json/primitives/*`, for itself
  and for `tokens/token-unemitted`. A primitive only ships through a semantic
  alias, so one nothing aliases is a spare palette step, not drift.
- Each semantic token no component uses yet is an `exemptions` entry, by its
  literal id, `accepted` with its reason. When a component starts using one,
  the audit reports that entry as `coverage/stale-exemption`: delete it. A
  semantic token you add is never covered, so an unused one is reported.

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
a contract, or when a component has no contract: `design-delta.json` raises
`coverage/uncontracted-component` to `error`, and
`test-utils/contract-coverage.test.ts` holds it there. Styles use only
`--ads-*` custom properties; Stylelint refuses a literal where a token belongs.

## Storybook

`npm run storybook` serves the component stories plus two system pages, and
`npm run build-storybook` writes `storybook-static/`, published to
[GitHub Pages](https://chrisgriffin.github.io/agentic-ds/) on every
push to `main`.

- **Tokens** renders every semantic token from the build manifest, the colors
  in both themes side by side, and the primitive palette.
- **Design Drift** renders `design-delta audit --json`, run when Storybook
  starts: the same verdict `npm run verify` gates on.

The toolbar's theme toggle sets `data-theme` on the preview's root, which is
what the token CSS keys off. Docs come from `@storybook/addon-docs`.
`@storybook/addon-a11y` shows an accessibility panel beside each story; it
reports to whoever is looking and fails nothing. What fails is the gate: every
component's test runs axe-core over its variants in jsdom, so a violation turns
`npm run verify` red. jsdom cannot measure colour contrast, so
`tokens/scripts/contrast.test.mjs` does instead: every text pair a component
stylesheet sets must reach 4.5:1 in both themes, or the gate fails naming it.

## Development

```bash
npm ci
npm run verify   # build:tokens → typecheck → prettier:check → lint → lint:styles → drift:verify → test
npm run build-storybook   # the Storybook; this checkout's is built by storybook / ci on a PR, deploy-pages.yml on main
```

How the repo fits together, in prose: [docs/architecture.md](docs/architecture.md);
how a change becomes a release: [docs/releasing.md](docs/releasing.md).

The design-delta engine comes from the public npm registry on a caret range
(`^0.27.0`), so installing the engine needs no git access or credentials and `npm ci`
gets exactly the engine the lockfile records. Move to a new minor on purpose,
with the npm 10 that CI's Node 22 runs:
`npx npm@10 install design-delta@^<version>`, then `npm run verify`, and read
any change in its findings before committing
([ADR-003](docs/adr/ADR-003-engine-from-the-registry.md)). Any install on npm 11
re-resolves `package-lock.json` and drops an entry npm 10 needs, so CI's
`npm ci` would refuse the lock (#44).

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
`.claude/skills/add-component/`, `add-token/` and `change-theme/` are the
system's own procedures for the changes an agent makes most: contract first,
primitive before semantic, both themes at 4.5:1. `npm run update:skills`
brings them up to date from the repository the system was created from, and
leaves alone any one whose managed line its owner deleted.
`npm run scaffold -- <name>` writes a new component directory in the shape of
`components/badge` plus the contract the engine drafts from its props.
`CLAUDE.md` is the rulebook an agent reads first.

`.mcp.json` connects an agent to the system's own MCP server, `npm run mcp`,
read-only: `get_component_usage` gives a component's folder, exports and
stories, `get_theme_tokens` each semantic token's value in light and dark,
and `get_rules` the invariants from `CLAUDE.md`. It also passes through every
tool `design-delta mcp` serves (contracts, tokens, coverage, drift), so an
agent connects to one server.

## License

MIT.
