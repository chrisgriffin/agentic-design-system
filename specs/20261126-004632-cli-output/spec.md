# Spec: the create command's output reads as steps and a summary

## Overview

The create command, the init script it hands over to, and `npm run demo` each end on a paragraph: one run-on line of everything init rewrote and removed, another of what to do next with the folder's path three times over, then 25 lines of `git status`. This change gives their own output a shape: a title, a tick per step, a header above each tool whose output follows (npm, the gate, Storybook, shown as those tools print it), an aligned summary of what was set up, and numbered next steps. In a terminal it is in color; piped, as in the tests and CI, it is plain text.

## User scenarios

- Someone runs `npm create agentic-ds` in a terminal: a title, two prompts with their defaults, a tick as the template is cloned, the values checked and the copy made, then npm's, the gate's and Storybook's output each under a header naming the command, then a summary of the prefix, owner, author, files rewritten and files removed, then three numbered next steps.
- A template developer runs `npm run demo` and it ends on the demo folder and one line counting what `git status` shows there, not the whole list.
- A run whose output is piped to a file, or with `NO_COLOR` set, holds no escape codes.
- A refused value, a failed clone or a failed gate step is one line marked as a failure, not a stack trace.
- Someone re-runs `node scripts/init.mjs` in a copy whose first run failed, and still gets the next steps, which a run under the create command leaves to the create command.

## Functional requirements

- FR-001: `cli/ui.mjs` holds the output helpers the create command, the init script and the demo share: a title, a step line, a tool header, aligned rows, numbered steps, a warning and a failure. Color comes from `node:util`'s `styleText`, only when the stream is a terminal and `NO_COLOR` is not set.
- FR-002: the create command prints a title, its prompts as `◆ <question> › ` with the default dimmed, and a step line for the clone, the values check and the copy. In a terminal a step line shows as pending while it runs and turns into a tick when it finishes; piped, only the finished line is written. The LICENSE author line it prints before init's output becomes a step line that keeps its source and the `--author` hint.
- FR-003: the init script prints a header naming each command it runs (`npm ci`, the dock step, Prettier, `npm run verify`, `npm run build-storybook`) above that command's own output, which is untouched; a failed command is one failure line naming it and exits 1. Its closing is a `✓ <name> is ready` line and rows for the prefix, owner, author, Figma file (when given), files rewritten, files removed and the checks that passed.
- FR-004: the create command ends on a `Next` block of numbered steps: `cd` to the folder (when it is not the current one), read the diff and commit, run `/setup-system` in Claude Code there, with the skill's file for a session opened elsewhere; files it replaced are named above it. The init script prints the same block, without the `cd`, only when not run by the create command (which sets `CREATE_AGENTIC_DS=1` for it), so its last line still names `/setup-system`.
- FR-005: the demo ends on the folder and one line counting `git status --porcelain` there by kind (untracked, changed), or `clean`; its uncommitted-changes warning is a warning line.
- FR-006: init's refusal lines (`--prefix "9" is not valid: …`) keep their exact form, since the create command reads them line by line, including from a template clone older or newer than itself.
- FR-007: `cli/ui.mjs` is in `package.json`'s `files`, so `npm create agentic-ds` and `npx github:…` still run from the packed files alone.

## Success criteria

- [ ] A create run in a terminal shows a title, a tick per step, a header above each tool's output, an aligned summary and numbered next steps.
- [ ] Piped output, and output with `NO_COLOR` set, holds no escape codes.
- [ ] A failed gate command ends on one failure line naming it, not a stack trace, and the exit code is 1.
- [ ] The demo ends on its folder and one line counting `git status`, not the whole list.
- [ ] **Runnable:** `node --test cli/ui.test.mjs` passes (on `develop` it fails: `cli/ui.test.mjs` does not exist), and `npm test` stays green.

## Out of scope

- Rewording or restyling the output of npm, vitest, Stylelint, design-delta or Storybook: it is shown as those tools print it.
- A spinner, progress bars or a new dependency for any of it.
- The `--help` usage text, which stays plain.
