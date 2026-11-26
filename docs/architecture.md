# Architecture

How this repo works, written for a person rather than a parser. It describes
the repo as it is on `develop` today, and a change that adds, removes or
renames a directory, or changes what a part does, updates this file in the
same PR.

## What it is

agentic-ds is a template for a design system that a coding agent can work in without drifting from it. A copy of this repo is a design system's starting point: a token source, a handful of example components with contracts, a Storybook, and the hooks and rulebook that let an agent build the next component and get told, before it finishes, when its code, its stylesheet and its contract disagree.

It exists because a design system maintained by agents fails in one particular way: the code quietly stops matching the design. The template's answer is the one the [design-delta](https://github.com/chrisgriffin/design-delta) engine takes: a per-component **contract** is the fixed point, and every check compares one side against it.

## How it works

### Tokens

`tokens/json/` is the source, in the DTCG format, in two tiers: `primitives/` (the raw palette, scale and families) and `semantics/` (the names a component may use, each an alias of a primitive, the colors with a value per theme). `tokens/scripts/source.mjs` merges the tiers into one document and holds `PREFIX`, the one constant every custom property starts with.

`npm run build:tokens` runs `tokens/scripts/build-css.mjs`: Terrazzo parses the document with `terrazzo.config.mjs`, its CSS plugin writes `tokens/css/tokens.css` with the dark theme under `[data-theme="dark"]`, and a post-pass, `inlinePrimitives` in `tokens/scripts/inline-primitives.mjs`, inlines every primitive with its final value (following a primitive that aliases another, and failing the build on a reference cycle, a primitive declared twice, or a primitive left in its output) and drops its declaration, so only the semantic `--ads-*` properties ship; `tokens/scripts/inline-primitives.test.mjs` tests it on its own. `tokens/scripts/build-manifest.mjs` computes the same tokens as literal values, per theme, for the Storybook Tokens page, and `build-manifest.d.mts` beside it types that export for `.storybook/main.ts` and the page. `tokens/scripts/tokens.test.mjs` holds all of that, and `tokens/scripts/contrast.test.mjs` reads the same manifest to hold every text pair a component stylesheet sets to 4.5:1 in both themes.

### Components

`components/<name>/` is one component: `<name>.tsx` (a React function component over a CSS Module), `<name>.module.css` (every value a `--ads-*` property), `<name>.stories.tsx`, `<name>.test.tsx`, `<name>.figma.tsx` (Code Connect, a placeholder file key until one is set), `<name>.contract.json` and `index.ts`. A composed part (`card-header`) adds its own `.tsx`, `.module.css` and `.contract.json` to the parent's directory. `badge` is the minimal one; `button` shows enum props with defaults, a slot and a design-only axis; `card` shows composition.

The contract declares the props, the element structure and the tokens the stylesheet binds. `design-delta.json` tells the engine where everything is, and `npm run drift:verify` fails when a component or a stylesheet disagrees with its contract. Stylelint (`.stylelintrc.json`) refuses a literal where a token belongs, reading the token names from the built CSS.

### Storybook

`.storybook/` runs Storybook on Vite with docs, an accessibility panel (`@storybook/addon-a11y`, which shows findings and fails nothing; the gate's accessibility checks are each component's axe test and, for text contrast, which jsdom cannot measure, `tokens/scripts/contrast.test.mjs`) and a theme toggle that sets `data-theme` on the root. `main.ts` inlines the token manifest and `design-delta audit --json` at start, so the two system pages under `.storybook/pages/` (Tokens, Design Drift) render what the build and the gate already compute. `npm run build-storybook` writes `storybook-static/`, which `deploy-pages.yml` publishes to GitHub Pages on every push to `main`.

### The agent layer

`.claude/settings.json` wires three hooks: `hooks/bash-guard.sh` before every Bash call, and after every edit `hooks/post-edit-check.sh` (Prettier, Stylelint on CSS) and `hooks/design-delta-verify.mjs`, which `design-delta dock` generates and which runs the gate. `.claude/skills/` holds the dock's two skills: `design-delta/SKILL.md` is a stub pointing at the installed engine's own skill, and `design-delta-verify/SKILL.md` carries its own instructions: run `npx design-delta verify --json`, fix what it finds, and re-run until it passes. It also holds `setup-system/`, which a new system's owner runs once after init to write its own docs and brand, and which deletes itself after that one run. `scripts/scaffold-component.mjs` (`npm run scaffold -- <name>`) writes a new component directory in the shape of `badge` plus the contract the engine drafts from its props. `CLAUDE.md` is the rulebook an agent reads first.

<!-- init -->

`cli/create.mjs` is the template's `bin`, `create-agentic-ds`, which is also the name `package.json` gives the package on npm, so `npm create agentic-ds` runs a release of it and `npx github:chrisgriffin/agentic-ds` the default branch's copy, with no clone (#79). The package holds only that file, `cli/defaults.mjs`, `cli/ui.mjs` and `scripts/init.mjs` (`package.json`'s `files`); the template itself is cloned when it runs. It sets up the folder it is run in or the one `--dir` names, named after that folder unless `--name` is given (#75): it asks for any value it was not given, asks `scripts/init.mjs --check` whether the values are valid, refuses a folder that is neither empty nor in a git work tree with nothing uncommitted, untracked or ignored under it, clones the template's default branch into a temporary folder, asks that clone's `scripts/init.mjs --check` again (a refusal from either shows the reason lines init gives and nothing else it prints, #56), copies it in without its `.git`, starts a repository on `main` where there was none, or points a repository with no commit yet at `main` (#68), and runs that copy's `scripts/init.mjs`, first saying which name `LICENSE` gets when `--author` was not given and handing init that name (#68). It ends on numbered next steps, after naming each file it replaced; its own output, and init's (a header above each command init runs, whose output is shown as that command prints it, then a summary of what was set up), comes from `cli/ui.mjs`, in color only on a terminal with `NO_COLOR` unset (#88). Init prints the same next steps only when the create command did not run it, which says so with `CREATE_AGENTIC_DS=1`. Any failure before the copy leaves the folder as it was. It holds no rewrite logic of its own. `cli/demo.mjs` (`npm run demo`, #86) runs it against this checkout in a fresh `demo-ds` folder under the system temp folder, prompts live, then prints that folder and a count of its `git status`, or the folder a passed-through `--dir` names, which it never wipes (it reads `--dir` with the flag sets `cli/defaults.mjs` shares with the create command); it warns first when the checkout has uncommitted changes, which the cloned template does not see, though the create command runs from the files on disk.

`scripts/init.mjs` turns a fresh copy of the template into a named system: it refuses an argument it does not recognize, naming it, and every invalid value, naming the flag, the value it got (quoted, so an empty one shows) and what it accepts, and names a missing flag or one given no value as such, before it writes anything (#52, #56), rewrites the name, prefix and owner, writes the author into `LICENSE` and the description into `package.json` and the README intro, sets `package.json`'s `name` to the system's, marks it `private` and drops its `files` list, so a system inherits nothing of the published create command (#79), installs, docks the engine and runs the gate, drops the template's release entries from `CHANGELOG.md`, keeping only its preamble, and resets `version` to `0.0.0` in `package.json` and the lock file, so a system's first release is its own (#81), then removes itself, `cli/`, the template's `specs/`, the `bin` entry and the `demo` script (#86), `init-check.yml`, `publish.yml`, the README's "Starting your own" section and every passage marked `<!-- init -->` (this one included), and, unless `--fleet` is passed, the two stubs that need a private operator. Its closing line, and the create command's, point at `/setup-system`.

`.claude/skills/setup-system/SKILL.md` is the step init cannot do: a skill a copy's owner runs once in Claude Code, after committing init's result, which asks what the system is for, how other projects get it, its brand and which examples and ADRs to keep, rewrites the docs that still describe the template, sets the font and accent primitives (holding each text pair the stylesheets use to 4.5:1 in both themes), runs the gate and the Storybook build, and deletes itself. It stops in a checkout whose `package.json` still has a `bin`, which is the template or a copy init has not finished in (init removes the `bin` last). `cli/setup-skill.test.mjs` fails when it names a path a copy does not have.

<!-- /init -->

### Everything else in the repo

- `docs/` — this file and the rest of the written record; `docs/adr/` holds the decision records.<!-- init -->
- `specs/` — the Spec Kit spec, plan and tasks behind each build.<!-- /init -->
- `specs/` — the spec, plan and tasks behind each change, one folder per change; a new system starts with none.<!-- init --> Init removes the template's, so the folder appears with its first spec.<!-- /init -->
- `test-utils/` — helpers the component tests import: `axe.ts` holds `expectNoViolations`, the accessibility assertion every component's test calls, `variants.ts` holds `variantCases`, which turns a contract's code-side enums into those tests' cases, and `a11y-coverage.test.ts` fails the gate on a component test that never calls it, on a component folder with no test file, on a contract with code-side variants that its folder's test does not read through `variantCases`, and on a contract with a code-side enum that has no usable value, so it would give no case; `contract-coverage.test.ts` fails it unless a component with no contract fails `drift:verify`.
- `types/` — ambient declarations TypeScript cannot infer: `css-modules.d.ts` types a `*.module.css` import and a plain stylesheet's side-effect import, both of which Vite resolves at build time. It is the one declaration of either.
- `.github/workflows/` — CI, the Storybook check, <!-- init -->the init check, `publish.yml` (the create command's npm publish), <!-- /init -->the Pages deploy, and the release and review-loop triggers.
- `.design-delta/` — the engine's output, not tracked today: its reports and state are ignored, and a gathered snapshot of the design side will be committed under `snapshots/` once `design-delta.json` names a design file (`design.files` is empty, so none exists yet).

## How it connects

- **design-delta** is the engine, a dev dependency from the public npm registry on a caret range (`^0.27.0`: patch releases within the minor), so installing it needs no git access and `npm ci` gets exactly the engine the lockfile records. A copy's owner moves to a new minor deliberately, with Node 22's npm 10 (`npx npm@10 install design-delta@^<version>`; an npm 11 install re-resolves the lock and drops an entry CI's `npm ci` needs, #44) and a green `npm run verify` read against the previous `drift:verify` report ([ADR-003](./adr/ADR-003-engine-from-the-registry.md)). It reads `design-delta.json` and the contracts; nothing in this repo reimplements a check.
- **Terrazzo** builds the tokens; **Vite**, **Vitest**, **Testing Library** and **Storybook** build and test the components; **Code Connect** maps each component to its Figma node once a file key is set.
- **The shared configs** `@chrisgriffin/config` supply Prettier, ESLint and the TypeScript base.
- **CI.** Every workflow in `.github/workflows/` but the Pages deploy<!-- init --> and `publish.yml`<!-- /init --> is a thin trigger stub calling one of the `_reusable-*.yml` workflows in the public [chrisgriffin/workflows](https://github.com/chrisgriffin/workflows) repo at its `v1` tag, passing this repo's own facts as inputs. The Pages deploy is GitHub's standard upload-then-deploy workflow.<!-- init --> `publish.yml` is this repo's own: it publishes the create command to npm ([releasing.md](./releasing.md)).<!-- /init -->
- **Nothing depends on this repo as code.** It is a template: a copy of it, renamed, is a new design system.

## Running it

```bash
npm ci
npm run build:tokens      # tokens/json → tokens/css/tokens.css
npm run storybook         # the stories and the two system pages
npm run drift:verify      # every contract against its code and styles
npm run scaffold -- name  # a new component directory plus a draft contract
npm run verify            # the gate CI runs as build / ci; Storybook builds in storybook / ci
```

The gate CI runs, and the one to run before pushing, is `npm run verify`: `build:tokens`, `typecheck`, `prettier:check`, `lint`, `lint:styles`, `drift:verify` and `test`, in that order. `storybook / ci` is the only check that builds this checkout's Storybook (`npm run build:tokens && npm run build-storybook`)<!-- init -->; `init / ci` builds the renamed copy's<!-- /init -->, and `deploy-pages.yml` builds it again on a push to `main`.

## Where to look next

- [README.md](../README.md) — what the template is and how to start from it.
- [testing.md](./testing.md) — what each test covers and where a new one belongs.
- [releasing.md](./releasing.md) — how a change becomes a tagged release.
- [adr/README.md](./adr/README.md) — the decision records.
- [CLAUDE.md](../CLAUDE.md) — the rules an agent working in this repo follows.
