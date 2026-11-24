# Tasks

## Phase 1: Red

- [ ] T001 `cli/pack.test.mjs` and the new cases in `cli/init-manifest.test.mjs` fail on `develop`.

## Phase 2: Build

- [ ] T002 `package.json` and `package-lock.json`: name, bin, `files`, not private.
- [ ] T003 `scripts/init.mjs`: name, `private`, `files`, `publish.yml`.
- [ ] T004 `.github/workflows/publish.yml`; `create-github-release.yml`'s comment; `init-check.yml`'s manifest checks.
- [ ] T005 `README.md`, `docs/architecture.md`, `docs/releasing.md`, `docs/testing.md`, `CLAUDE.md`, `cli/create.mjs`'s header comment.

## Phase 3: Green

- [ ] T006 `npm run verify` green; `npm pack`, the tarball installed outside every repo, and the create command run from it end to end, the created system passing its own gate.
- [ ] T007 (after merge) The maintainer sets the `NPM_TOKEN` secret before merging the first release; `npm view create-agentic-ds version` answers after it.
