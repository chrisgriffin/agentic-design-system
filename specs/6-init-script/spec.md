# Spec: An init script turns a fresh copy of the template into a named design system

**Issue**: [#6](https://github.com/chrisgriffin/agentic-design-system/issues/6)

## Overview

`scripts/init.mjs` turns a fresh copy of the template into a named design system in one run: it rewrites the template's own name, prefix and owner wherever they appear, optionally writes a Figma file key, installs, docks the engine, runs the verify chain, and then deletes itself along with its CI check, its README section and the two stubs that need a private operator. The template carries no placeholders: it is a working system as cloned, and the script rewrites the concrete values it ships with, so `npm run verify` is green both before and after.

## User scenarios

- A person copies the repo, runs the script with a name, a prefix and their login, reads the diff, and commits a system whose CSS, contracts, Storybook and rulebook all carry their prefix.
- A person passes a Figma file key; every Code Connect stub maps against that file and `design-delta.json` lists it, so the engine's design side has a file to gather.
- CI runs the script on every PR's checkout and fails the PR when the result no longer passes the gate or still carries the template's prefix.

## Functional requirements

- FR-001: `node scripts/init.mjs --name <kebab> --prefix <prefix> --owner <login> [--figma-file <key>] [--fleet]` validates its arguments, prints usage on `--help`, and refuses a bad value with exit 1.
- FR-002: It rewrites, in every tracked text file but the lock file and `specs/`: `agentic-design-system` to the name, `--ads-` to `--<prefix>-`, the `PREFIX` constant, and the owner only where it names this repo (the repository URL, the Pages URL, `CODEOWNERS`); the shared config and the public workflows stay as they are.
- FR-003: With `--figma-file`, it sets `design.files` in `design-delta.json` to the key and replaces `FIGMA_FILE_KEY` in every Code Connect stub.
- FR-004: It installs when `node_modules` is absent, runs `design-delta dock`, Prettier and `npm run verify`, and only then removes itself, `init-check.yml`, the README's "Starting your own" section and, without `--fleet`, `evaluator-gate.yml` and `claude-mention.yml`. It commits nothing.
- FR-005: `init-check.yml` runs the script on every PR's checkout with sample values and fails when `scripts/init.mjs` survives or any `--ads-` reference is left.
- FR-006: `.github/CODEOWNERS` is the one-line owner entry; the comment that named a private repo goes.

## Success criteria

- [x] `node scripts/init.mjs --name <name> --prefix <prefix> --owner <owner>` rewrites the template's name, prefix and owner everywhere they appear, the token prefix constant included, and `npm run verify` is green afterward.
- [x] `--figma-file <key>` writes the key into `design-delta.json` and the Code Connect stubs.
- [x] The script removes itself and the `evaluator-gate.yml` and `claude-mention.yml` stubs unless `--fleet` is passed.
- [x] CI runs the script on a fresh copy of the template and verifies the result.
- [x] **Runnable:** `node scripts/init.mjs --help | head -1` prints the usage line (there is no `scripts/init.mjs` today).

## Out of scope

- Placeholders (`{{name}}`, `{{prefix}}`) in the template itself: a `--{{prefix}}-` custom property is not CSS, so a template with placeholders could not pass its own gate. The script rewrites concrete values instead.
- Renaming the GitHub repo, creating rulesets or secrets: admin steps, as for every repo.
