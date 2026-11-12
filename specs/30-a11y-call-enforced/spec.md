# Spec: A component test that never runs the accessibility assertion fails npm test

**Issue**: [#30](https://github.com/chrisgriffin/agentic-design-system/issues/30)

## Overview

`CLAUDE.md` says every component test calls `expectNoViolations`, but nothing checks it: a hand-written test that skips the call passes the gate, and the README's accessibility claim quietly stops covering that component. This adds a test that reads every component test file and fails, naming the file, when one never calls `expectNoViolations`, so the rule is enforced rather than only written down.

## User scenarios

- A contributor hand-writes `components/<name>/<name>.test.tsx` without an `expectNoViolations` call; `npm test` fails and names that file.
- A contributor runs `npm run scaffold -- <name>`; the test file it writes already calls `expectNoViolations`, so `npm test` stays green.

## Functional requirements

- FR-001: A test run by `npm test` finds every `*.test.tsx` under `components/` and has one case per file.
- FR-002: A file's case fails when its source, comments stripped, has no `expectNoViolations(` call; the case's title is the file's path.
- FR-003: The test fails when it finds no component test files at all, so a broken glob cannot pass silently.
- FR-004: `docs/testing.md` says the gate enforces the rule, and where.

## Success criteria

- [x] A test file under `components/<name>/` that never calls `expectNoViolations` makes `npm test` fail, and the failure names that file.
- [x] The existing `badge`, `button` and `card` tests still pass, and so does the test file `npm run scaffold -- <name>` writes. The scaffolded directory is deleted before committing.
- [x] `docs/testing.md` says the gate enforces the rule.
- [x] **Runnable:** `mkdir -p components/zz-probe && printf 'import { test } from "vitest"\ntest("probe", () => {})\n' > components/zz-probe/zz-probe.test.tsx && npm test; s=$?; git clean -fdq components/zz-probe; [ $s -ne 0 ]` exits 0. On `develop` today it exits 1, because `npm test` passes with the probe in place.

## Out of scope

- Checking that a test calls `expectNoViolations` once per contract variant: the check is that the call exists, not how many.
- Running axe from anywhere other than the component tests.
