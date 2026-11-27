# Spec: The create command sets up the repo it is run in, not a new folder

**Issue**: [#75](https://github.com/chrisgriffin/agentic-design-system/issues/75)

## Overview

The create command makes a new folder named after its argument. A design system usually is the repo: someone makes an empty repo on GitHub, clones it, and wants to run one command there. Today that folder is refused (not empty), and a new folder would start a second history. The command now sets up the folder it is run in; `--dir` points it elsewhere.

## User scenarios

- In a fresh clone of an empty GitHub repo holding a README and LICENSE, `npx github:chrisgriffin/agentic-design-system --prefix ms --owner me` sets up the system there, named after the folder, on the repo's branch with its history; the closing line says README.md and LICENSE were replaced, and `git diff` shows them.
- In a repo with uncommitted work, it stops, writes nothing, and lists what to commit first.
- `--dir packages/tokens` sets up that folder instead, creating it when missing.

## Functional requirements

- FR-001: The target is the current folder, or `--dir <path>`. `--name` defaults to the target's folder name; the init script's rules decide whether it is valid.
- FR-002: A positional argument is refused, naming `--name` and `--dir`.
- FR-003: The target must be missing or empty, or inside a git work tree with no uncommitted, untracked, staged or ignored file under it; otherwise the command stops before any write and lists the blocking paths (or says the folder is not empty and not in a git repo).
- FR-004: Inside a git work tree, the history and branch are kept; a repo with no commit yet starts on `main`. Outside one, a new repository starts on `main`.
- FR-005: The template is cloned to a temporary folder first, so a failed clone writes nothing to the target; then copied in without its `.git`.
- FR-006: The closing line names each existing file the copy replaced, and says `cd` only when the target is not the current folder.

## Success criteria

- [ ] Run with no folder argument, the create command sets up the folder it is run in; `--dir <path>` points it elsewhere. `--name` names the system and defaults to the folder's name; a positional argument is refused, naming `--name` and `--dir`.
- [ ] In a git repo it keeps the history and the branch; a folder with no repo gets a new one on `main`, as before.
- [ ] It writes over existing files only when git can give each back: the folder is empty, or it is in a git repo with no uncommitted or untracked changes under it. Otherwise it stops, writes nothing, and lists the changes that block it. Its closing line names each file it replaced.
- [ ] The usage text, README "Starting your own", `docs/architecture.md`, `docs/testing.md` and `init-check.yml`'s create run describe and use the new form.
- [ ] **Runnable:** `node --test cli/*.test.mjs` exits 0 with `# fail 0`.

## Notes

- The clean-tree rule covers more than replaced files: the init script rewrites names in every file it walks, runs Prettier over the folder and removes `specs/` and `cli/` whole, so anything already there must be recoverable from git.
- Ignored files count as changes git could not give back, and are refused the same way. Git holds no copy of them, and the setup reaches them three ways: the copy writes over one at a template path, the init script removes `specs/` and `cli/` whole, and in a repo with history the init script's #44 step finds an ignored `node_modules` and writes the repo's own committed `package-lock.json` over the template's. The refusal names them and asks for them to be moved out.

## Out of scope

- Publishing to npm: the command stays `npx github:chrisgriffin/agentic-design-system`.
