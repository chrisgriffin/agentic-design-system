# Architecture

How this repo works, written for a person rather than a parser. It describes
the repo as it is on `develop` today, and a change that adds, removes or
renames a directory, or changes what a part does, updates this file in the
same PR.

## What it is

agentic-design-system is a template for a design system that a coding agent can work in without drifting from it. A copy of this repo is a design system's starting point: a token source, a handful of example components with contracts, a Storybook, and the hooks and rulebook that let an agent build the next component and get told, before it finishes, when its code, its stylesheet and its contract disagree.

It exists because a design system maintained by agents fails in one particular way: the code quietly stops matching the design. The template's answer is the one the [design-delta](https://github.com/chrisgriffin/design-delta) engine takes: a per-component **contract** is the fixed point, and every check compares one side against it.

## How it works

### Tokens

`tokens/json/` is the source, in the DTCG format, in two tiers: `primitives/` (the raw palette, scale and families) and `semantics/` (the names a component may use, each an alias of a primitive, the colors with a value per theme). `tokens/scripts/source.mjs` merges the tiers into one document and holds `PREFIX`, the one constant every custom property starts with.

`npm run build:tokens` runs `tokens/scripts/build-css.mjs`: Terrazzo parses the document with `terrazzo.config.mjs`, its CSS plugin writes `tokens/css/tokens.css` with the dark theme under `[data-theme="dark"]`, and a post-pass, `inlinePrimitives` in `tokens/scripts/inline-primitives.mjs`, inlines every primitive with its final value (following a primitive that aliases another, and failing the build on a reference cycle) and drops its declaration, so only the semantic `--ads-*` properties ship; `tokens/scripts/inline-primitives.test.mjs` tests it on its own. `tokens/scripts/build-manifest.mjs` computes the same tokens as literal values, per theme, for the Storybook Tokens page. `tokens/scripts/tokens.test.mjs` holds all of that.

### Components

`components/<name>/` is one component: `<name>.tsx` (a React function component over a CSS Module), `<name>.module.css` (every value a `--ads-*` property), `<name>.stories.tsx`, `<name>.test.tsx`, `<name>.figma.tsx` (Code Connect, a placeholder file key until one is set), `<name>.contract.json` and `index.ts`. A composed part (`card-header`) adds its own `.tsx`, `.module.css` and `.contract.json` to the parent's directory. `badge` is the minimal one; `button` shows enum props with defaults, a slot and a design-only axis; `card` shows composition.

The contract declares the props, the element structure and the tokens the stylesheet binds. `design-delta.json` tells the engine where everything is, and `npm run drift:verify` fails when a component or a stylesheet disagrees with its contract. Stylelint (`.stylelintrc.json`) refuses a literal where a token belongs, reading the token names from the built CSS.

### Storybook

`.storybook/` runs Storybook on Vite with docs, accessibility checks and a theme toggle that sets `data-theme` on the root. `main.ts` inlines the token manifest and `design-delta audit --json` at start, so the two system pages under `.storybook/pages/` (Tokens, Design Drift) render what the build and the gate already compute. `npm run build-storybook` writes `storybook-static/`, which `deploy-pages.yml` publishes to GitHub Pages on every push to `main`.

### The agent layer

`.claude/settings.json` wires three hooks: `hooks/bash-guard.sh` before every Bash call, and after every edit `hooks/post-edit-check.sh` (Prettier, Stylelint on CSS) and `hooks/design-delta-verify.mjs`, which `design-delta dock` generates and which runs the gate. `.claude/skills/` holds the dock's two skills: `design-delta/SKILL.md` is a stub pointing at the installed engine's own skill, and `design-delta-verify/SKILL.md` carries its own instructions: run `npx design-delta verify --json`, fix what it finds, and re-run until it passes. `scripts/scaffold-component.mjs` (`npm run scaffold -- <name>`) writes a new component directory in the shape of `badge` plus the contract the engine drafts from its props. `CLAUDE.md` is the rulebook an agent reads first.

<!-- init -->

`scripts/init.mjs` turns a fresh copy of the template into a named system: it rewrites the name, prefix and owner, installs, docks the engine and runs the gate, then removes itself, `init-check.yml`, the README's "Starting your own" section and every passage marked `<!-- init -->` (this one included), and, unless `--fleet` is passed, the two stubs that need a private operator.

<!-- /init -->

### Everything else in the repo

- `docs/` — this file and the rest of the written record; `docs/adr/` holds the decision records.
- `specs/` — the Spec Kit spec, plan and tasks behind each build.
- `.github/workflows/` — CI, the Storybook check, <!-- init -->the init check, <!-- /init -->the Pages deploy, and the release and review-loop triggers.
- `.design-delta/` — the engine's output, not tracked today: its reports and state are ignored, and a gathered snapshot of the design side will be committed under `snapshots/` once `design-delta.json` names a design file (`design.files` is empty, so none exists yet).

## How it connects

- **design-delta** is the engine, a dev dependency from the public npm registry on a caret range (`^0.27.0`: patch releases within the minor), so installing it needs no git access and `npm ci` gets exactly the engine the lockfile records. A copy's owner moves to a new minor deliberately, with `npm install design-delta@^<version>` and a green `npm run verify` read against the previous `drift:verify` report ([ADR-003](./adr/ADR-003-engine-from-the-registry.md)). It reads `design-delta.json` and the contracts; nothing in this repo reimplements a check.
- **Terrazzo** builds the tokens; **Vite**, **Vitest**, **Testing Library** and **Storybook** build and test the components; **Code Connect** maps each component to its Figma node once a file key is set.
- **The shared configs** `@chrisgriffin/config` supply Prettier, ESLint and the TypeScript base.
- **CI.** Every workflow in `.github/workflows/` but the Pages deploy is a thin trigger stub calling one of the `_reusable-*.yml` workflows in the public [chrisgriffin/workflows](https://github.com/chrisgriffin/workflows) repo at its `v1` tag, passing this repo's own facts as inputs. The Pages deploy is GitHub's standard upload-then-deploy workflow.
- **Nothing depends on this repo as code.** It is a template: a copy of it, renamed, is a new design system.

## Running it

```bash
npm install
npm run build:tokens      # tokens/json → tokens/css/tokens.css
npm run storybook         # the stories and the two system pages
npm run drift:verify      # every contract against its code and styles
npm run scaffold -- name  # a new component directory plus a draft contract
npm run verify            # the gate CI runs as build / ci; Storybook builds in storybook / ci
```

The gate CI runs, and the one to run before pushing, is `npm run verify`: `build:tokens`, `prettier:check`, `lint`, `lint:styles`, `drift:verify` and `test`, in that order. `storybook / ci` is the only check that builds this checkout's Storybook (`npm run build:tokens && npm run build-storybook`)<!-- init -->; `init / ci` builds the renamed copy's<!-- /init -->, and `deploy-pages.yml` builds it again on a push to `main`.

## Where to look next

- [README.md](../README.md) — what the template is and how to start from it.
- [testing.md](./testing.md) — what each test covers and where a new one belongs.
- [releasing.md](./releasing.md) — how a change becomes a tagged release.
- [adr/README.md](./adr/README.md) — the decision records.
- [CLAUDE.md](../CLAUDE.md) — the rules an agent working in this repo follows.
