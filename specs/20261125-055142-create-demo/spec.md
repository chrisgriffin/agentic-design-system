# Spec: npm run demo shows the create command in action

## Overview

Watching the create command run today takes a hand-built command line: a fresh folder, `--from` pointed at the local checkout, and a look at what it wrote afterwards. `npm run demo` does all of that, so a template developer types one command and watches the real create command run, prompts included.

## User scenarios

- A template developer runs `npm run demo`, presses Enter at the prefix and username prompts to take the defaults, watches the clone, init, install, gate and Storybook build, and ends on the folder it set up and `git status` there.
- They run it again and get a fresh run: the demo folder from the last run is replaced, not added to.
- They run `npm run demo -- --no-init` to see only the copy in under a second, or pass any other create flag (`--prefix`, `--owner`, `--fleet`) through.
- With uncommitted changes in the checkout, the demo says first that it runs only what is committed, so nobody mistakes an old result for their edit's.
- Someone creates a system from the template and finds no `demo` script in its `package.json`.

## Functional requirements

- FR-001: `npm run demo` runs `cli/demo.mjs`, which removes and recreates `demo-ds` in the system temp folder (`os.tmpdir()`), then runs this checkout's `cli/create.mjs` with `--from` this checkout and `--dir` that folder, with the terminal passed through, so the prompts are live and answered by the person watching.
- FR-002: every argument given to the demo goes to the create command after its own, so a flag the demo sets can be overridden.
- FR-003: when `git status --porcelain` in the checkout is not empty, the demo prints one line to stderr before the run saying the demo runs the last commit, not uncommitted changes.
- FR-004: after the run the demo prints the folder and `git status --short` there, and exits with the create command's exit code.
- FR-005: `scripts/init.mjs` drops the `demo` script from a created system's `package.json` (it already removes `cli/`, so the demo file goes with it).

## Success criteria

- [x] `npm run demo` sets up a fresh demo folder from the local checkout, with live prompts, and ends on that folder's path and `git status`.
- [x] Arguments after `--` reach the create command, and the demo exits with its exit code.
- [x] A checkout with uncommitted changes gets a warning before the run.
- [x] A system created from the template has no `demo` script.
- [x] **Runnable:** `node --test cli/demo.test.mjs cli/init-manifest.test.mjs` passes 14 of 14 (on `develop` it fails: `cli/demo.test.mjs` does not exist).

## Out of scope

- Answering the prompts for the viewer: the defaults take Enter, and `--prefix` and `--owner` pass through for a hands-off run.
- Demoing uncommitted changes: the create command clones, so it sees commits only; the warning says so.
