# Spec: No spec in the template names the maintainer's private notes or a path inside them

**Issue**: [#58](https://github.com/chrisgriffin/agentic-design-system/issues/58)

## Overview

This is a public template, but older spec files mention the maintainer's private notes, which a reader cannot open: a stock entry in their surfaces lists, and in three places a path inside those notes, a search command against them, or a note's title. Every spec should describe only this repo's own surfaces.

## User scenarios

- Someone reading or copying the template reads `specs/` and finds nothing that points outside the repo.
- Someone reading an old spec still sees its full surfaces list and every ticked task's record, minus the private-notes item.

## Functional requirements

- FR-001: The three lines naming a path, a search command or a note's title (`specs/20261114-143609-gate-contract-missing/plan.md`, its `tasks.md`, `specs/6-init-script/plan.md`) drop them, and say only that nothing outside the repo needed changing.
- FR-002: Every stock private-notes item in a `## Surfaces touched` list and its matching `tasks.md` line is dropped; the rest of each line stays.
- FR-003: Specs added since the issue was filed (`56-refusal-names-value`, `57-variant-a11y-from-contract`) get the same edit.
- FR-004: Requirements, decisions and ticked tasks otherwise stay as written; only `specs/` changes.

## Success criteria

- [ ] No file under `specs/` names the maintainer's private notes, a path inside them or a search run against them.
- [ ] Every edited spec still reads as a complete record: each surfaces list keeps its other items, and no ticked task loses what it recorded.
- [ ] **Runnable:** `grep -rli 'vaul[t]' specs/ | wc -l` prints `0` (24 on `develop` today).

## Out of scope

- Copies made by `init` or `create`, which start with no spec history.
- Any file outside `specs/`.
