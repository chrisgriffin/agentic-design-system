# agentic-design-system — context for Claude

A template for a design system a coding agent can work in without drifting from its tokens and contracts. How it works, for a person: [README.md](README.md).

## Commands

```bash
npm run build:tokens      # tokens/json → tokens/css/tokens.css (semantic --ads-* only)
npm run drift:verify      # design-delta: every contract against its code and styles
npm run scaffold -- name  # a new component directory plus a draft contract
npm run storybook         # the stories, the Tokens page, the Design Drift page
npm run verify            # the gate CI runs as build / ci; Storybook builds in storybook / ci
```

## Non-negotiable invariants

1. **Token-first styling.** Every color, space, font, radius and motion value in a stylesheet is a `--ads-*` custom property from `tokens/css/tokens.css`. Stylelint refuses a literal where a token belongs; do not widen its ignore list, add a token.
2. **The contract is the source of truth.** `name.contract.json` declares a component's props, anatomy and token bindings; the code and the stylesheet conform to it, never the other way around. A component with no contract fails the gate ([`docs/testing.md`](docs/testing.md)). An axis the contract marks `code: none` is design-only and never becomes a prop.
3. **Semantic tokens only ship.** Primitives alias into semantics and are inlined at build; code never references a primitive, and a new value starts as a primitive aliased by a semantic token.
4. **Generated files are not edited.** `tokens/css/`, `storybook-static/`, `.design-delta/reports/` and the dock-generated hook and skills are overwritten by their generators.

## Component directory shape

`components/<name>/` holds, and only holds: `<name>.tsx`, `<name>.module.css`, `<name>.stories.tsx`, `<name>.test.tsx`, `<name>.figma.tsx`, `<name>.contract.json` and `index.ts`. A composed part (`card-header`) adds its own `.tsx`, `.module.css` and `.contract.json` to the parent's directory. `components/badge` is the one to copy; `npm run scaffold -- <name>` copies it.

Code Connect: `<name>.figma.tsx` carries a placeholder file key until the Figma file is set with `init --figma-file <key>`; then every component maps its real node, and `design-delta` compares the contract against the design side too.

## Architecture — the couplings no check catches

| If you touch                                              | Then                                                                                                                    |
| --------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `PREFIX` in `tokens/scripts/source.mjs`                   | `conventions.cssVarPrefix` in `design-delta.json`, and every `--ads-*` reference in `components/**` and `.storybook/**` |
| a font family in `tokens/json/primitives/typography.json` | the font links in `.storybook/preview-head.html`                                                                        |
| a semantic token's `$extensions.mode`                     | `modeSelectors` in `terrazzo.config.mjs`, and the theme test in `tokens/scripts/tokens.test.mjs`                        |
| a prop or an element in `<name>.tsx`                      | `<name>.contract.json` (props, anatomy) and `<name>.figma.tsx`; `npm run drift:verify` reports the first two            |
| a job name in `.github/workflows/*.yml`                   | the branch ruleset on GitHub, which requires each check by name (admin-only)                                            |
| `components/badge/*`                                      | the templates in `scripts/scaffold-component.mjs`, which copy its shape                                                 |

## Agent layer

- `.claude/settings.json` wires three hooks: `bash-guard.sh` before every Bash call, `post-edit-check.sh` (Prettier, and Stylelint on CSS) and `design-delta-verify.mjs` after every edit. A failing hook feeds its text back; fix the cause, never the hook.
- `.claude/skills/design-delta/SKILL.md` is a stub pointing at the installed engine's own skill; read that one, then `design-delta.json`'s `_`-prefixed keys.
- `design-delta` also serves contracts and tokens over MCP (`npx design-delta mcp`), read-only.

## CI

Every workflow in `.github/workflows/` is a thin stub calling a reusable workflow in the public [chrisgriffin/workflows](https://github.com/chrisgriffin/workflows) repo at its `v1` tag, except the Pages deploy, which is GitHub's standard one.
The gate is `npm run verify`; `storybook / ci` is the only check that builds this checkout's Storybook<!-- init --> (`init / ci` builds the renamed copy's)<!-- /init -->, and `deploy-pages.yml` builds it again on a push to `main` to deploy it.
Accessibility: every component test calls `expectNoViolations` (`test-utils/axe.ts`, axe-core in jsdom), so a violation fails the gate; fix the component, never the rule. The Storybook a11y addon only shows a panel and fails nothing; it is the only contrast check, since jsdom cannot measure contrast.
