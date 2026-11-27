# Plan: a created system starts its own changelog

## Technical context

- `scripts/init.mjs`: before the install, cut `CHANGELOG.md` at the first match of `/^###? \[?v?[0-9]/m`, the pattern `_reusable-release-pr.yml` in chrisgriffin/workflows uses to find the first entry, and write back the preamble. The `package.json` and lock file edits also set `version` to `0.0.0`.
- `cli/init-manifest.test.mjs`: the `before()` fixture appends a `### [0.1.1](…)` entry above a `## 0.1.0` entry and sets version `0.1.1` in both manifests; two `#81` tests check the changelog has no release heading of either level and that every version is `0.0.0`.
- Docs that list what init changes: the USAGE text in `scripts/init.mjs`, `README.md` § Starting your own, `docs/architecture.md`, the header of `.github/workflows/init-check.yml`, and the `cli/init-manifest.test.mjs` bullet in `docs/testing.md`.

## Surfaces touched

- `scripts/init.mjs`, `cli/init-manifest.test.mjs`, `README.md`, `docs/architecture.md`, `docs/testing.md`, `.github/workflows/init-check.yml` (comment only).
- `cost` — none: no workflow step, trigger, job name or ruleset change.
