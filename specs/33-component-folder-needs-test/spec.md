# Spec: A component folder with no test file fails npm test

**Issue**: [#33](https://github.com/chrisgriffin/agentic-design-system/issues/33)

## Overview

The gate fails a component test that never calls `expectNoViolations`, but it only looks at test files that exist. A folder under `components/` that holds a component and no test file is never checked, so a component written by hand without a test passes `npm test`, and the README's claim that every component is checked for accessibility quietly stops covering it. This makes `npm test` fail, naming the folder, when a component folder has no `.test.tsx` file.

## User scenarios

- A contributor adds `components/<name>/<name>.tsx` by hand and writes no test; `npm test` fails and names `components/<name>`.
- A contributor deletes a component's test file; `npm test` fails and names that folder.
- A contributor runs `npm run scaffold -- <name>`; the folder it writes holds a test file, so `npm test` stays green.
- `components/card/` holds `card.tsx` and `card-header.tsx` with one `card.test.tsx`; the check is per folder, so it stays green.

## Functional requirements

- FR-001: A test run by `npm test` finds every folder under `components/` that holds a component source file: a `.tsx` that is not a `.test.tsx`, `.stories.tsx` or `.figma.tsx`.
- FR-002: Each such folder has one case, titled with the folder's path, that fails when the folder holds no `.test.tsx` file.
- FR-003: The test fails when it finds no component folders at all, so a broken glob cannot pass silently.
- FR-004: `docs/testing.md` says the gate fails a component folder with no test file.

## Success criteria

- [x] A folder under `components/` with a component source file and no `.test.tsx` file makes `npm test` fail, and the failure names that folder.
- [x] The existing `badge`, `button` and `card` folders still pass, and so does a folder `npm run scaffold -- <name>` writes. The scaffolded folder is deleted before committing.
- [x] `docs/testing.md` says the gate fails a component folder with no test file.
- [x] **Runnable:** `mkdir -p components/zz-probe && printf 'export const ZzProbe = () => null\n' > components/zz-probe/zz-probe.tsx && npm test; s=$?; git clean -fdq components/zz-probe; [ $s -ne 0 ]` exits 0. On `develop` today it exits 1, because `npm test` passes with the untested probe folder in place.

## Out of scope

- Checking that every source file in a folder (a composed part such as `card-header.tsx`) has its own test: the check is per component folder.
- Checking the rest of the component directory shape (stories, contract, Code Connect): `design-delta verify` and the scaffold own that.
