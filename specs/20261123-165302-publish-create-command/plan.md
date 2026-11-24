# Plan: The create command is publishable to npm as create-agentic-ds

## Technical context

- `package.json`: `name` → `create-agentic-ds`; `private` removed; `bin` key → `create-agentic-ds`; `files`: `cli/create.mjs`, `cli/defaults.mjs`, `scripts/init.mjs` (npm adds `package.json`, `README.md` and `LICENSE` itself). No `publishConfig`: an unscoped package is public on the default registry. `package-lock.json`: the root name (two places) and the root `bin` key, edited by hand so no install re-resolves it (#44).
- `scripts/init.mjs`: the first manifest edit also sets `pkg.name = name` and `pkg.private = true` and deletes `pkg.files`; the name swap no longer reaches it, since the package name is no longer the repo name. `.github/workflows/publish.yml` joins `removed`. `bin` still goes last, the setup skill's mark of an unfinished init.
- `.github/workflows/publish.yml`: `pull_request` closed on `main` (merged, head `release/*` or `hotfix/*`) and `workflow_dispatch` (on `main` only). Checks out the merge commit, sets up Node 22 with the npm registry, skips when `npm view create-agentic-ds@<version>` answers, else `npm publish --provenance --access public` with `NODE_AUTH_TOKEN` from `NPM_TOKEN`. `permissions: contents: read, id-token: write`; the ID token is what signs the provenance statement.
- `create-github-release.yml`: its header comment only; the stub passes nothing new, so a copy's release publishes nothing.
- `cli/pack.test.mjs` (new): the manifest's name, bin and non-private state; `npm pack --dry-run --json`'s file list, exactly; the listed files copied to a temp folder still refuse a bad `--prefix` with init's reason line, which needs all three scripts; the publish workflow names `NPM_TOKEN` and provenance, and no workflow a copy keeps publishes.
- `cli/init-manifest.test.mjs`: the copy's manifest is private with no `files` or `publishConfig`, `publish.yml` is gone and no file names `create-agentic-ds`.
- `init-check.yml`: the create run and the init run each fail when the manifest keeps the template's name, `bin`, `files` or a non-private state, or `publish.yml` survives.

## Surfaces touched

- `package.json`, `package-lock.json`, `scripts/init.mjs`, `cli/create.mjs` (header comment), the two tests above, `cli/setup-skill.test.mjs` (its list of what init removes).
- `.github/workflows/publish.yml` (new; job `publish`, not a required check: no ruleset change), `create-github-release.yml` (comment), `init-check.yml` (job name and triggers unchanged).
- Published surface, a `bin`: `README.md` ("Starting your own"), `docs/architecture.md`, `docs/releasing.md`, `docs/testing.md`, `CLAUDE.md` (the CI paragraph). `CHANGELOG.md` is written by `release-pr.yml` from the commit.
- `cost` — `publish.yml` runs once per PR closed into `main`: a few releases a month, under one billed minute each.
- Outside the diff: the `NPM_TOKEN` repository secret and the npm account that owns the package, the maintainer's to set before the first release merges.
