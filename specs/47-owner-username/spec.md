# Spec: Call --owner "your GitHub username" in the create command, the init script and the README

**Issue**: [#47](https://github.com/chrisgriffin/agentic-design-system/issues/47)

## Overview

The create command, the init script and the README describe `--owner` as "the GitHub login the repo will live under". Say what it is: your GitHub username.

## User scenarios

- Someone running `npx github:chrisgriffin/agentic-design-system my-system` is asked for their GitHub username and knows what to type.
- A reader of `--help` or the README sees `--owner` described as their GitHub username.

## Functional requirements

- FR-001: `README.md` says "and your GitHub username" and shows `--owner my-username`.
- FR-002: `cli/create.mjs` shows `--owner <github-username>` in its usage, `--owner       your GitHub username` in its help and asks "Your GitHub username".
- FR-003: `scripts/init.mjs` shows `--owner <github-username>` in its usage and `--owner       your GitHub username (today: chrisgriffin)` in its help.

## Success criteria

- [ ] `README.md:24` reads "and your GitHub username"; `README.md:33` reads `--owner my-username`.
- [ ] `cli/create.mjs` usage reads `--owner <github-username>`, its help line `--owner       your GitHub username`, and its prompt "Your GitHub username".
- [ ] `scripts/init.mjs` usage reads `--owner <github-username>` and its help line `--owner       your GitHub username (today: chrisgriffin)`.
- [ ] A test fails if `--help` stops describing `--owner` as "your GitHub username".
- [ ] **Runnable:** `grep -rc "GitHub login" README.md cli/create.mjs scripts/init.mjs` prints `0` for each file.

## Out of scope

- What `--owner` does, its validation and its default.
