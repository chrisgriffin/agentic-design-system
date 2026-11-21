# Spec: Every variant a component's contract declares gets an accessibility check

**Issue**: [#57](https://github.com/chrisgriffin/agentic-design-system/issues/57)

## Overview

Each component's accessibility test loops over sizes, tones or paddings typed into the test by hand, and the same values are declared in the component's contract. A value added to a contract with no test edit ships with no accessibility check while `npm test` stays green. This makes each component's accessibility test read its variants from its contract, and makes `npm test` fail when a contract with code-side variants has a test that does not.

## User scenarios

- A contributor adds `"ghost"` to Button's `variant` values in `button.contract.json`; the next `npm test` runs an axe case for every size with `variant ghost`, with no test edit.
- A contributor adds a design-only enum (`"code": "none"`) to a contract; no case is generated for it.
- A contributor writes a component test by hand that hard-codes its variant list; `npm test` fails, naming the test file and the contract it does not read.
- A contributor runs `npm run scaffold -- <name>`; the test it writes already reads the new contract, so an enum added to that contract later is covered.

## Functional requirements

- FR-001: A helper in `test-utils/` turns a contract into accessibility cases: every combination of the values of every enum prop whose `code` is not `"none"`, each with a title naming its prop values. A contract with no code-side enum gives one case, the defaults.
- FR-002: `badge`, `button` and `card` tests run `expectNoViolations` over that helper's cases, reading their own `<name>.contract.json`; no variant list is typed into a test.
- FR-003: A test in `test-utils/a11y-coverage.test.ts` fails, naming the test file and the contract, when a contract with a code-side enum sits in a folder whose test does not import that contract and call the helper.
- FR-004: `scripts/scaffold-component.mjs` writes a first test that uses the helper on the new contract.
- FR-005: `docs/testing.md` and `docs/architecture.md` describe the helper and the check.

## Success criteria

- [x] Every value of every code-side enum prop in a component's contract gets an accessibility check in that component's tests. A value added to a contract with no test edit is either checked automatically or makes `npm test` fail and name the value.
- [x] A design-only enum (`"code": "none"`) is not required to have a case.
- [x] **Runnable:** `sed -i 's/"outline"\]/"outline", "ghost"]/' components/button/button.contract.json && npx vitest run components/button --reporter=verbose 2>&1 | grep -c ghost; git checkout -- components/button/button.contract.json` prints a number greater than 0. On `develop` it prints `0`, because no test reads the new value.
- [x] `npm test` passes with the contracts as they are.

## Out of scope

- Slot and boolean props: only enum props have a finite value list to cover; Button's `iconBefore` case stays as it is.
- Composed parts' own contracts with no enum (`card-header`): covered by the parent's test, as today.
