# Plan: Fleet files: the remaining workflow stubs, docs, changelog and the first release

## Technical context

- The five stubs follow the public precedent: `release-pr.yml` (push to `develop`, `RELEASE_PR_TOKEN` and `OPS_GH_TOKEN`), `create-github-release.yml` (merged PR into `main`, no inputs, no secrets), `sync-main-to-develop.yml` (`RELEASE_PR_TOKEN`), `claude-mention.yml` (`target: agentic-design-system`, `OPS_GH_TOKEN`), `evaluator-gate.yml` (the four loop secrets, `TARGET_TOKEN` from `RELEASE_PR_TOKEN`). All five secrets exist on the repo.
- The docs take the public precedent's shape, with the fleet's doc standard (one title, kebab-case, ADR frontmatter and sections) and no fleet blocks, since the repo owes no templated doc. Two ADRs record the decisions Builds 1 and 2 made.
- `CHANGELOG.md` is a title and a sentence; `package.json` stays at `0.0.0`, so the first release computes `0.1.0` from the `feat` commits.
- `.github/CODEOWNERS` already exists and is unchanged.

## Surfaces touched

- `.github/workflows/`: five new stubs; `storybook-check.yml`, `build-check.yml` and `deploy-pages.yml` unchanged.
- the branch ruleset on GitHub — `Evaluator` returns to the `develop` ruleset's required checks after merge, an admin step recorded in the PR body; `storybook / ci` is added with it.
- `docs/`: new. `docs/architecture.md` names every directory, so a later structural change updates it.
- `CHANGELOG.md`: new. `README.md`: the layers note and two doc links.
- No Routine, cron or Mac-installed file.
