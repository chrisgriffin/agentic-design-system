# Releasing

A release of agentic-ds is a `vX.Y.Z` tag with a GitHub Release, whose notes are that version's `CHANGELOG.md` entry<!-- init -->, and the create command published to npm as `create-agentic-ds`<!-- /init -->. The Release attaches no file.

## How a release happens

1. Work merges into `develop` through a PR.
2. Every push to `develop` runs `release-pr.yml`. It computes the next
   version from the Conventional Commits since the last `vX.Y.Z` tag,
   updates `package.json` and `CHANGELOG.md`, and keeps one rolling
   `release/next` PR into `main` up to date. A push that only merges `main`
   back into `develop` has nothing to release and changes nothing.
3. A human merges `release/next` into `main`. That merge is the release.
4. The merge runs `create-github-release.yml`, which tags `vX.Y.Z` and
   creates the GitHub Release from that version's `CHANGELOG.md` entry<!-- init -->, and
   `publish.yml`, which publishes the create command to npm (below)<!-- /init -->.
5. `sync-main-to-develop.yml` merges `main` back into `develop`. When the
   merge conflicts, or `develop`'s ruleset refuses the push, it opens a
   `sync/main-to-develop-*` PR instead, for a human to merge.

All three files are thin stubs calling the shared release workflows in the
public `chrisgriffin/workflows` repo. The same push to `main` also runs
`deploy-pages.yml`, so the published Storybook follows the release.

## Versioning

- `feat` is a minor bump; `fix`, `perf` and every other type are a patch; a
  `type!:` subject or a `BREAKING CHANGE:` footer is a major, or a minor
  while the version is below `1.0.0`.
- Tags are bare `vX.Y.Z`.
- `release-pr.yml` pushes and opens the release PR with `RELEASE_PR_TOKEN`,
  a personal access token, because GitHub starts no workflows for events
  created by the built-in `GITHUB_TOKEN`: without it, the release PR's
  checks never run on their own.

## Hotfixes

A hotfix is only a change Chris calls a hotfix. It branches off `main` as
`hotfix/<name>`, opens its PR into `main`, and bumps the patch version and
adds its `CHANGELOG.md` entry in that same PR, because it never passes
through `release-pr.yml`. Merging it runs steps 4 and 5 above.

## What this repo ships

- A tag and a GitHub Release: `create-github-release.yml` passes no build command, no assets and no registry, so it publishes nothing.
- The Storybook at the repo's GitHub Pages URL, rebuilt by `deploy-pages.yml` from the same push to `main`.

<!-- init -->

- The `create-agentic-ds` npm package, which `npm create agentic-ds` runs: the create command, published to the public npm registry by `publish.yml` with the `NPM_TOKEN` secret. `publish.yml` is this repo's own workflow, not a stub, and a created system does not receive it: `scripts/init.mjs` removes it and sets the system's `package.json` to its own name and `private`.
- `publish.yml` runs when a `release/*` or `hotfix/*` PR merges into `main`, beside step 4, at the version `package.json` holds on the merge commit, and by hand from the Actions tab on `main`, to retry a publish that failed. A version the registry already has is skipped, green.
- The package holds `cli/create.mjs`, `cli/defaults.mjs` and `scripts/init.mjs` (`package.json`'s `files`) plus the README and LICENSE npm always adds, and installs nothing with it; `cli/pack.test.mjs` holds that list. The template itself is cloned when the command runs.
- It is published with provenance: npm records which commit and workflow run built it. That needs the job's `id-token: write`, which `publish.yml` grants, and a `repository.url` in `package.json` naming this repo.

Before the first publish, once, by the repo's owner:

1. Pick the npm account that will own `create-agentic-ds`; the first publish claims the name.
2. Make an access token on that account that can publish a package that does not exist yet: a granular token with read and write access to all packages, since one limited to selected packages has none to select. It can be narrowed to `create-agentic-ds` after the first publish.
3. Add it as the `NPM_TOKEN` repository secret before merging the release. Without it the publish job fails after the tag and Release are made; add the secret, then run `publish.yml` by hand on `main`.

<!-- /init -->

## Setting up on GitHub

Once, for a new repo, by its owner: nothing in this repo creates or configures one.

1. Create an empty repository and push `main` to it.
2. Branch `develop` from `main` and push it. Work merges there (step 1 above).
3. In Settings → Pages, set the source to GitHub Actions, so `deploy-pages.yml` can publish the Storybook.
4. Add a `RELEASE_PR_TOKEN` repository secret: a fine-grained personal access token with read and write access to this repo's contents and pull requests. Without it the release PR still opens, but its checks never start on their own.
5. Add a branch ruleset on `main` and `develop` that requires a pull request and the checks `build / ci` and `storybook / ci`. A check is required by its job's name, so renaming a job in `.github/workflows/` means changing the ruleset too.

After that, a release takes two human merges: the `release/next` PR, and then the `sync/main-to-develop-*` PR that step 5 of "How a release happens" opens, because the ruleset on `develop` names no bypass actor and so refuses the sync's push.

A copy made with `--fleet` also needs an `OPS_GH_TOKEN` repository secret, the fleet's token for its conflict sweep. A copy made without `--fleet` cannot hold one, and `release-pr.yml` passes it anyway: the shared body's first step starts the fleet's conflict sweep with `OPS_GH_TOKEN` and fails when it is unset. So in such a copy Release PR fails on every push to `develop` and no `release/next` PR opens, until that shared step skips itself when the secret is unset.
