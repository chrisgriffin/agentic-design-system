# Releasing

A release of agentic-design-system is a `vX.Y.Z` tag with a GitHub Release, whose notes are that version's `CHANGELOG.md` entry. The template is a private package: a release attaches no file and publishes to no registry.

## How a release happens

1. Work merges into `develop` through a PR.
2. Every push to `develop` runs `release-pr.yml`. It computes the next
   version from the Conventional Commits since the last `vX.Y.Z` tag,
   updates `package.json` and `CHANGELOG.md`, and keeps one rolling
   `release/next` PR into `main` up to date. A push that only merges `main`
   back into `develop` has nothing to release and changes nothing.
3. A human merges `release/next` into `main`. That merge is the release.
4. The merge runs `create-github-release.yml`, which tags `vX.Y.Z` and
   creates the GitHub Release from that version's `CHANGELOG.md` entry.
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

- A tag and a GitHub Release, nothing more: `create-github-release.yml` passes no build command, no assets and no registry.
- The Storybook at the repo's GitHub Pages URL, rebuilt by `deploy-pages.yml` from the same push to `main`.

## Manual steps

None. Merging the `release/next` PR is the only human step.
