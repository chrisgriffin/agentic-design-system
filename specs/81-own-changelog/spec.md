# Spec: a created system starts its own changelog

**Issue**: [#81](https://github.com/chrisgriffin/agentic-ds/issues/81)

## Overview

The v0.1.0 release PR (#13) fails `build / ci` and `init / ci`: on `release/next` the release workflow writes a 0.1.0 entry in `CHANGELOG.md` that names `create-agentic-ds` and the repo, and `scripts/init.mjs` kept the template's changelog in a created system, so the #79 check found it. On `develop` the changelog has no entries, so the check passed there.

## User scenarios

- Someone creates a system from a release of the template and finds a `CHANGELOG.md` with the template's preamble and no release of the template's, so the system's first release is the first entry.
- The same system's `package.json` reads `0.0.0`, so its first `release-pr` run proposes its own first version, not the next one in the template's line.

## Functional requirements

- FR-001: `scripts/init.mjs` keeps only the lines of `CHANGELOG.md` above the first release heading, at either level the release workflow writes (`## x.y.z` for a minor release, `### [x.y.z](…)` for a patch), matched with the release workflow's own pattern `/^###? \[?v?[0-9]/`.
- FR-002: `scripts/init.mjs` sets `version` to `0.0.0` in `package.json`, and the lock file's `version` and `packages[""].version`.
- FR-003: `cli/init-manifest.test.mjs` gives the template copy a patch entry above a minor entry and version `0.1.1`, as on `release/next`, and fails if the created copy keeps a release heading of either level or that version.

## Success criteria

- [x] a system created by init starts its own changelog with none of the template's releases
- [x] the #79 test stays strict
- [x] a test fails if a release entry leaks into a copy
- [x] **Runnable:** `node --test cli/init-manifest.test.mjs` passes 7 of 7 (2 fail with `scripts/init.mjs` as on `develop`).

## Out of scope

- The release workflow itself, and the template's own changelog.
