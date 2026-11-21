# Spec: One command creates a named design system from the template

**Issue**: [#41](https://github.com/chrisgriffin/agentic-design-system/issues/41)

## Overview

Starting a design system from this template takes four manual steps today: copy the repo, clone it, run `scripts/init.mjs` with three flags, then commit. This adds a `create` command, run with `npx` straight from GitHub, that does all of it: it asks for a name, a prefix and an owner, writes a new folder holding the template under those values, and leaves a system whose `npm run verify` passes. It is the first command of a CLI for building out an agent-operated design system; the commands that grow a system (`add component`, `add token`, `check`, `doctor`) are later specs.

## User scenarios

- A person in an empty folder runs `npx github:chrisgriffin/agentic-design-system my-system`, answers three questions, and gets `my-system/`: a git repository with the template under their name, prefix and owner, ready to commit.
- An agent runs the same command with every value as a flag and no terminal attached; it never waits for input.
- A person points the command at a folder that already holds files; it refuses and changes nothing.
- CI runs the command on every PR and fails the PR when the created system does not pass its own gate.

## Functional requirements

- FR-001: `package.json` declares a `bin`, so `npx github:chrisgriffin/agentic-design-system <name> [--prefix <prefix>] [--owner <login>] [--figma-file <key>] [--fleet] [--dir <path>]` runs it with no clone and no registry. `--help` prints usage and exits 0.
- FR-002: It clones the template into `<dir>/<name>` (the current folder by default) and starts a fresh git history there. The copy's init script removes the create command itself, so a created system and a copy made by hand end up the same.
- FR-003: It hands the name, prefix, owner and Figma key to the existing `scripts/init.mjs` in the new folder, which rewrites the values, installs, docks the engine, runs the gate and removes itself. The create command holds no second copy of that logic.
- FR-004: In a terminal, a missing name, prefix or owner is asked for, each with a default (the prefix from the name's initials, the owner from `git config user.name` when it is a valid login). With no terminal, a missing value exits 1 and names the flag.
- FR-005: A target folder that exists and is not empty exits 1 before anything is written.
- FR-006: The created system installs with no GitHub credentials: no token and no SSH key.
- FR-007: `init-check.yml` also runs the create command into a temp folder and fails when the created system does not pass `npm run verify`.
- FR-008: The README's "Starting your own" section leads with the create command and keeps `scripts/init.mjs` as the path for a copy made by hand.

## Success criteria

- [x] `npx github:chrisgriffin/agentic-design-system my-system --prefix my --owner my-login`, run in an empty folder, creates `my-system/` as a git repository holding the template under that name, prefix and owner, with no clone step, and the README leads with that command.
- [x] `npm run verify` exits 0 inside the created system, installed with no GitHub token and no SSH key, and a CI check proves it on every PR.
- [x] Run in a terminal with no flags, it asks for the name, prefix and owner; run with no terminal and a value missing, it exits 1 and names the missing flag.
- [x] Pointed at a folder that exists and is not empty, it exits 1 and writes nothing.
- [x] **Runnable:** `node cli/create.mjs --help | head -1` prints the usage line (on `develop` today there is no `cli/create.mjs`).

## Out of scope

- Publishing to the npm registry. `npx github:` needs no account, token or release step; a registry package is a later decision.
- The commands that grow a system: `add component`, `add token`, `check`, `doctor`, `--json` output and the agent skill. Each is its own spec.
- An `upgrade` command that pulls template changes into an existing system.
- Creating the GitHub repo, its rulesets or its secrets.
