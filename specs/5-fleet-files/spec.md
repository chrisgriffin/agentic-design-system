# Spec: Fleet files: the remaining workflow stubs, docs, changelog and the first release

**Issue**: [#5](https://github.com/chrisgriffin/agentic-design-system/issues/5)

## Overview

The files that make the template a repo the shared release flow can run: the five remaining workflow stubs calling the public reusable workflows at `v1`, the architecture, releasing and testing docs with a decision-record index and two records, a changelog for `release-pr.yml` to write, and the README's final shape. The first `release/next` merge then tags `v0.1.0`.

## User scenarios

- A push to `develop` opens or updates the rolling `release/next` PR; merging it tags `v0.1.0`, creates the GitHub Release and republishes the Storybook.
- A person new to the repo reads `docs/architecture.md` and knows what each directory is for and how a change is gated.
- An `@claude` mention on an issue, or a PR opening, reaches the fleet's responder and review loop through the two stubs.

## Functional requirements

- FR-001: `.github/workflows/` holds `release-pr.yml`, `create-github-release.yml`, `sync-main-to-develop.yml`, `claude-mention.yml` and `evaluator-gate.yml`, each a thin stub of the matching public reusable workflow at `v1`, passing only the secrets that body declares, by name; `create-github-release.yml` builds, attaches and publishes nothing.
- FR-002: `docs/architecture.md`, `docs/releasing.md`, `docs/testing.md` and `docs/adr/README.md` follow the fleet's docs standard (one title, kebab-case names, ADR frontmatter) and describe the template as it is after Builds 1 to 4; `docs/adr/` holds ADR-001 (semantic tokens only ship) and ADR-002 (the contract is the source of truth).
- FR-003: `CHANGELOG.md` holds a title and one sentence, for `release-pr.yml` to write entries under; `.prettierignore` already excludes it.
- FR-004: The README's layers note says every build has landed and links the architecture and releasing docs.
- FR-005: The workflow count is eight: the three stubs Builds 1 and 3 landed plus these five. Issue #5 was filed before Build 3 added the Pages deploy, so its count of seven is one short.

## Success criteria

- [x] `.github/workflows/` holds `release-pr.yml`, `create-github-release.yml`, `sync-main-to-develop.yml`, `claude-mention.yml` and `evaluator-gate.yml` as thin stubs passing their secrets by name, alongside the build and Storybook stubs.
- [x] `docs/architecture.md`, `docs/releasing.md`, `docs/testing.md` and `docs/adr/README.md` describe the template, and `CHANGELOG.md` starts empty for `release-pr.yml` to write.
- [ ] after-merge: The first `release/next` merge tags `v0.1.0` and creates the GitHub Release.
- [x] **Runnable:** `ls .github/workflows | wc -l` prints `8` (prints `3` today).

## Out of scope

- The branch ruleset: `Evaluator` returns to the `develop` ruleset's required checks once this PR is on `develop` (bootstrap order), as an admin step recorded in the PR body.
- `scripts/init.mjs` (#6), which removes `evaluator-gate.yml` and `claude-mention.yml` from a copy that leaves the fleet.
