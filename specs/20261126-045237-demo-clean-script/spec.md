# Spec: npm run demo:clean removes the demo folder

## Overview

`npm run demo -- --clean` removes the `demo-ds` folder the demo leaves in the temp folder, but the `--` is easy to forget, and without it npm reads `--clean` as its own setting and runs a full demo instead. A `demo:clean` script runs the same thing with nothing to remember.

## User scenarios

- A template developer done with the demo runs `npm run demo:clean`: the `demo-ds` folder is removed, as `npm run demo -- --clean` does.
- Someone sets up a system with the create command: its `package.json` has neither the `demo` nor the `demo:clean` script, since both run files init removes.

## Functional requirements

- FR-001: `package.json` has a `demo:clean` script that runs `node cli/demo.mjs --clean`.
- FR-002: init removes `demo:clean` from a created system's `package.json`, as it removes `demo`.
- FR-003: the README names `npm run demo:clean` as the way to remove the demo folder.

## Success criteria

- [x] `npm run demo:clean` removes `demo-ds` from the temp folder and exits 0.
- [x] A created system's `package.json` has no `demo:clean` script.
- [x] **Runnable:** `node --test cli/demo.test.mjs cli/init-manifest.test.mjs` passes, including a `demo:clean` test in each (on `develop`, `npm run demo:clean` exits 1: the script does not exist), and `npm test` stays green.

## Out of scope

- Changing what `--clean` does.
