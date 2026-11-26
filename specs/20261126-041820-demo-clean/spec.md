# Spec: npm run demo -- --clean removes the demo folder

## Overview

`npm run demo` leaves a `demo-ds` folder in the system temp folder, a few hundred megabytes with its `node_modules`. Each run replaces it, and the system clears its temp folder in time, but there is no way to remove it when you are done short of finding the path and deleting it by hand. `npm run demo -- --clean` removes it and runs nothing else.

## User scenarios

- A template developer done with the demo runs `npm run demo -- --clean`: the `demo-ds` folder is removed and the demo says which folder it removed.
- They run it again, or before any demo run: nothing is there, and the demo says so and exits 0.
- They pass `--clean` with other arguments, such as `--dir mine`: the demo refuses, names why, exits 1 and removes nothing, since a folder the person named is theirs.

## Functional requirements

- FR-001: `--clean` as the demo's only argument removes `demo-ds` in the system temp folder, prints a step line naming it, and exits 0 without running the create command or warning about uncommitted changes.
- FR-002: with no `demo-ds` folder there, `--clean` prints a step line saying nothing was there and exits 0.
- FR-003: `--clean` with any other argument is one failure line on stderr, exit 1, and no folder removed.
- FR-004: `--clean` never reaches the create command.

## Success criteria

- [ ] `npm run demo -- --clean` after a demo run removes `demo-ds` from the temp folder and exits 0; run again, it says nothing was there and exits 0.
- [ ] `--clean` with another argument exits 1 and removes nothing.
- [ ] **Runnable:** `node --test cli/demo.test.mjs` passes, including its `--clean` tests (on `develop`, `node cli/demo.mjs --clean` exits 1: the create command refuses `--clean` as an unknown option), and `npm test` stays green.

## Out of scope

- Removing a folder `--dir` named: the demo never deletes a folder the person named.
- Cleaning anything else the demo or the create command touches (the npm cache, the template clone, which the create command already removes).
