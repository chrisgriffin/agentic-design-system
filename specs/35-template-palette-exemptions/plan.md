# Plan: a fresh copy's drift audit lists only actionable findings

## Technical context

- design-delta `0.27.0`: `rules["tokens/token-unreferenced"]` takes `["review", {"ignoreSources": [...]}]`, globs matched against the file a token was authored in, applied to `tokens/token-unemitted` as well (its `docs/config-reference.md`). `exemptions` entries are `{entity, decision, reason}`; a literal entity that matches nothing is reported as `coverage/stale-exemption`, a glob never is.
- An unused primitive moves between the two rules with the build state (`tokens/token-unemitted` only when `paths.styleRoots` exists). A literal exemption therefore goes stale in one state, and a glob over a mixed root (`radius.*`, `duration.*`) would also cover semantic tokens. The tier option covers both rules in both states and leaves the semantic tier fully reported.
- `scripts/init.mjs` rewrites `--ads-` and the repo name; token ids are neither, so the entries survive it.
- The test runs the installed engine from the checkout's `node_modules`: once in the checkout, and in the harness's init'd copy with `node_modules` linked in, before and after `tokens/scripts/build-css.mjs`.

## Surfaces touched

- `design-delta.json` — the rule option and 27 exemption entries.
- `README.md` § Tokens — the decision, once.
- `cli/init-manifest.test.mjs` and its bullet in `docs/testing.md`.
- A published surface? No: no `bin`, export, schema or report shape changes.
- `cost` — none: no workflow, trigger or job change.
