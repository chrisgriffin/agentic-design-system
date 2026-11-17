# Spec: A copy made by init gets its own author, description and an empty spec history

**Issue**: [#49](https://github.com/chrisgriffin/agentic-design-system/issues/49)

## Overview

A system made by `scripts/init.mjs` (or the create command) still carries three things that belong to the template: the copyright holder in `LICENSE`, the template's description in the README and `package.json`, and the template's `specs/` build history.

## User scenarios

- Someone creating a system gets a `LICENSE` in their own name without editing it, by default from git's `user.name`.
- Their README intro and `package.json` describe their system, by default as "The <name> design system."
- Their repo starts with no specs from the template's history.

## Functional requirements

- FR-001: `scripts/init.mjs` takes `--author <name>`; `LICENSE` reads `Copyright (c) <current year> <author>`. Default: git's `user.name`, else `--owner`.
- FR-002: `scripts/init.mjs` takes `--description <text>`; the README intro sentence and `package.json` `description` read it. Default: `The <name> design system.`
- FR-003: An author or description holding a line break is refused.
- FR-004: The README's "This repo is built in layers…" note sits inside `<!-- init -->` markers, so a copy drops it.
- FR-005: `scripts/init.mjs` removes `specs/`.
- FR-006: `cli/create.mjs` passes `--author` and `--description` through; both usages and the README's "Starting your own" document them.

## Success criteria

- [ ] `scripts/init.mjs` takes `--author <name>`; the copy's `LICENSE` reads `Copyright (c) <current year> <author>`. Without the flag it uses git's `user.name`, else `--owner`.
- [ ] `scripts/init.mjs` takes `--description <text>`; the copy's README intro sentence and `package.json` `description` both read it. Without the flag both read `The <name> design system.`
- [ ] The README's "This repo is built in layers…" note is gone from a copy.
- [ ] A copy has no `specs/` folder.
- [ ] `cli/create.mjs` passes `--author` and `--description` through to the init script, and both usages and the README's "Starting your own" document them.
- [ ] `init-check.yml` fails when a copy's `LICENSE` or `package.json` still names the template's author or description, or when `specs/` survives.
- [ ] **Runnable:** in a copy initialized with `--author "Sample Author" --description "Sample tokens."`, `grep -c "Sample Author" LICENSE` prints `1`, `node -p 'require("./package.json").description'` prints `Sample tokens.`, and `test ! -e specs` exits 0.

## Out of scope

- Brand tokens (fonts, palette): they are the design work, edited in `tokens/json`.
- Prompting for author or description in a terminal: both have defaults.
