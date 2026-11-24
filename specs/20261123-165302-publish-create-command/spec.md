# Spec: The create command is publishable to npm as create-agentic-ds

## Overview

The create command runs today only as `npx github:chrisgriffin/agentic-design-system`. The name `agentic-design-system` is taken on npm by an unrelated package, so the command is published as `create-agentic-ds`, which `npm create agentic-ds` runs. This change makes the package publishable and adds the publish path; it publishes nothing.

## The shape, and why

`package.json` is both the template's manifest and the base of every created system. Two shapes were open:

- A second package directory holding only the create command. The release flow reads the version from the root `package.json` and `release-pr.yml` bumps only that file, so a second manifest would need its own versioning and a publish from a subdirectory the shared release workflow has no input for.
- Keep the root manifest as the published package, and have `scripts/init.mjs` strip what belongs to the create command from a created system. Init already removes `bin` and `cli/` and renames the lock file; today the package name is renamed only because it equals the repo name.

The second is the smallest correct one. The root manifest becomes `create-agentic-ds` with a `files` list of the three scripts the command runs (`cli/create.mjs`, `cli/defaults.mjs`, `scripts/init.mjs`); the template itself is still cloned from GitHub at run time, so the tarball embeds none of it and has no dependencies. Init sets the created system's `name` and `private: true` and removes `files`, as it removes `bin`.

The publish step lives in a workflow file of its own, `publish.yml`, not as inputs on `create-github-release.yml`: init removes whole workflow files, and every copy keeps `create-github-release.yml`, so a copy keeps a release stub that publishes nothing and never receives the publish workflow.

## User scenarios

- Someone runs `npm create agentic-ds` in the folder that will be their system and gets what `npx github:chrisgriffin/agentic-design-system` gives today, from the latest release.
- Someone runs `npx github:chrisgriffin/agentic-design-system` and it still works, from the default branch.
- The owner of a created system reads its `package.json` and finds their own name, `private: true`, and no `bin`, `files` or publish workflow.
- The maintainer merges `release/next` into `main` and the release is published to npm, once the `NPM_TOKEN` secret exists.

## Functional requirements

- FR-001: `package.json` is named `create-agentic-ds`, is not private, has one `bin`, `create-agentic-ds` → `cli/create.mjs`, and a `files` list of what the command runs. `package-lock.json` carries the same name and bin.
- FR-002: `scripts/init.mjs` sets the created system's `name` to `--name` and `private` to `true`, removes `files` and `.github/workflows/publish.yml`, and still removes `bin` last.
- FR-003: `publish.yml` publishes to the public npm registry with the `NPM_TOKEN` secret and provenance when a `release/*` or `hotfix/*` PR merges into `main`, or when dispatched by hand on `main`; a version already on the registry is skipped, green.
- FR-004: `npx github:chrisgriffin/agentic-design-system` keeps working; the README names both commands.
- FR-005: The docs that describe the create command, init and the release say what is true after this change.

## Success criteria

- [ ] The package is named `create-agentic-ds` with a `create-agentic-ds` bin, so `npm create agentic-ds` runs the create command once it is published; `npx github:chrisgriffin/agentic-design-system` still runs it.
- [ ] `npm pack --dry-run` lists only `package.json`, `README.md`, `LICENSE`, `cli/create.mjs`, `cli/defaults.mjs` and `scripts/init.mjs`, and a test fails when the list changes or the packed command cannot run.
- [ ] A created system has its own name, `private: true`, and no `bin`, `files`, `publishConfig` or publish workflow, and names `create-agentic-ds` nowhere; a test fails if it inherits any of them.
- [ ] A merged release publishes the package to npm through a workflow a created system does not receive, and `docs/releasing.md` says what must exist before the first publish.
- [ ] **Runnable:** `node --test cli/pack.test.mjs cli/init-manifest.test.mjs` exits 0 with `# fail 0` (fails on `develop`: `cli/pack.test.mjs` does not exist).

## Out of scope

- Publishing: the first publish happens when a release merges after the `NPM_TOKEN` secret is set.
- Renaming the GitHub repo.
- Pinning the cloned template to the published version: the command clones the template's default branch, as today, and the clone's own init script decides what it accepts.
