# Spec: The README says scripts/init.mjs exists, and init.mjs carries no swap that matches nothing

**Issue**: [#16](https://github.com/chrisgriffin/agentic-design-system/issues/16)

## Overview

Two leftovers from before `scripts/init.mjs` shipped. The README's intro says the script "is next", though it exists and the README documents it a few lines later. And `init.mjs` carries the swap `[" (scripts/init.mjs does)", ""]`, whose search text appears in no file the script walks, so it does no work.

## User scenarios

- A reader of the template's README learns from the intro that the init script exists and where its usage is documented.
- A reader of `init.mjs` sees only swaps that change something in a copy.

## Functional requirements

- FR-001: The README passage inside `<!-- init -->` markers describes `scripts/init.mjs` as available and points at "Starting your own"; the markers stay, so a renamed copy still drops it.
- FR-002: `scripts/init.mjs` drops the `" (scripts/init.mjs does)"` swap entry.

## Success criteria

- [ ] The README's intro describes `scripts/init.mjs` as available, or no longer mentions it there.
- [ ] `scripts/init.mjs` has no swap entry whose search text appears in no file it walks.
- [ ] **Runnable:** `grep -c "is next" README.md` prints `0` (1 on `develop`).

## Out of scope

- Any other change to the init script's behaviour.
