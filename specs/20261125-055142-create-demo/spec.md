# Spec: npm run demo shows the create command in action

## Overview

Watching the create command run today takes a hand-built command line: a fresh folder, `--from` pointed at the local checkout, and a look at what it wrote afterwards. `npm run demo` does all of that, so a template developer types one command and watches the real create command run, prompts included.

## User scenarios

- A template developer runs `npm run demo`, presses Enter at the prefix and username prompts to take the defaults, watches the clone, init, install, gate and Storybook build, and ends on the folder it set up and `git status` there.
- They run it again and get a fresh run: the demo folder from the last run is replaced, not added to.
- They run `npm run demo -- --no-init` to see only the copy in under a second, or pass any other create flag (`--prefix`, `--owner`, `--fleet`) through.
- With uncommitted changes in the checkout, the demo says first that the template it copies is the last commit, so nobody mistakes an old result for their edit's.
- They pass `--dir` to set up a folder of their own, and the demo ends on that folder, not `demo-ds`.
- Someone creates a system from the template and finds no `demo` script in its `package.json`.

## Functional requirements

- FR-001: `npm run demo` runs `cli/demo.mjs`, which removes and recreates `demo-ds` in the system temp folder (`os.tmpdir()`), then runs this checkout's `cli/create.mjs` with `--from` this checkout and `--dir` that folder, with the terminal passed through, so the prompts are live and answered by the person watching.
- FR-002: every argument given to the demo goes to the create command after its own, so a flag the demo sets can be overridden.
- FR-003: when `git status --porcelain` in the checkout is not empty, the demo prints one line to stderr before the run saying the template it copies is the last commit, without the uncommitted changes. (Corrected in review: it first said the demo runs the last commit, but the demo runs this checkout's on-disk `cli/create.mjs`, which runs the on-disk `scripts/init.mjs --check`; only the cloned template, and the init inside it, come from the last commit.)
- FR-004: after the run the demo prints the folder the create command set up (the last `--dir` passed through, else `demo-ds`) and `git status --short` there, and exits with the create command's exit code. A folder named by `--dir` is never removed. (Clarified in review: with a passed-through `--dir`, FR-002 makes it the folder set up, so it is the one reported on.)
- FR-005: `scripts/init.mjs` drops the `demo` script from a created system's `package.json` (it already removes `cli/`, so the demo file goes with it).

## Success criteria

- [x] `npm run demo` sets up a fresh demo folder from the local checkout, with live prompts, and ends on that folder's path and `git status`.
- [x] Arguments after `--` reach the create command, and the demo exits with its exit code.
- [x] A checkout with uncommitted changes gets a warning before the run.
- [x] A system created from the template has no `demo` script.
- [x] **Runnable:** `node --test cli/demo.test.mjs cli/init-manifest.test.mjs` passes 17 of 17 (on `develop` it fails: `cli/demo.test.mjs` does not exist). (Recounted in review: the three `--dir` tests the review asked for took it from 14.)

## Out of scope

- Answering the prompts for the viewer: the defaults take Enter, and `--prefix` and `--owner` pass through for a hands-off run.
- Demoing uncommitted changes to the template: the create command clones it, so the copy holds commits only; the warning says so.
