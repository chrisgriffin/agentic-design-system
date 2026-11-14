# Spec: A component with no contract fails the gate instead of only warning

## Overview

This template's second non-negotiable invariant is that **the contract is the
source of truth**: `name.contract.json` declares a component's props, anatomy
and token bindings, and the code conforms to it. The gate that holds that
invariant is `npm run drift:verify`, which fails on findings at `error`
severity or above.

A component with **no contract at all** is detected by the engine and does not
reach that threshold. `design-delta` reports it as
`coverage/uncontracted-component` at its default severity, `warn`, so
`drift:verify` prints it and still passes. The result is the one drift this
template exists to prevent: an agent adds `components/<name>/<name>.tsx`, the
gate stays green, and the component is never audited again — no prop check, no
anatomy check, no token-binding check, for the life of the repo.

The repo's `design-delta.json` carries no `rules` key, so every rule runs at
the engine's default severity. `rules` is the engine's one severity mechanism,
keyed by rule id.

## Measured on `develop@fa99a95`, with dependencies installed

A component folder holding only `probe.tsx`, `probe.module.css` and a
`probe.test.tsx` that calls `expectNoViolations` — no `.contract.json`, no
`.stories.tsx`, no `.figma.tsx`, no `index.ts`:

- `npm run verify` → **exit 0**. Prettier, ESLint, Stylelint, `drift:verify`
  and all 44 tests pass.
- `npm run drift:verify` → **`verify passed`**, reporting
  `1 warn, 48 review — reported, not gating`.
- `design-delta audit --json` carries the finding in full:
  `{"ruleId": "coverage/uncontracted-component", "severity": "warn", "surface":
  "coverage", "side": "code", "entity": "components/probe/probe.tsx",
  "message": "component at \"components/probe/probe.tsx\" has no contract
  referencing it"}`
- With `"rules": {"coverage/uncontracted-component": "error"}` added to
  `design-delta.json` and the same folder present: `drift:verify` →
  **exit 1**, `FAIL 1 finding(s) at "error" severity or above`, and the 48
  `review` findings are unchanged at `review`.

The existing coverage tests do not close this. `test-utils/a11y-coverage.test.ts`
holds two rules — every component folder has a `.test.tsx`, and every component
test calls `expectNoViolations` — and neither looks at contracts.

## User scenarios

1. **An agent adds a component and forgets the contract.** It writes
   `components/toast/toast.tsx`, `toast.module.css`, `toast.test.tsx` and
   `index.ts`, opens a pull request, and every check is green. The component
   ships outside the contract system, and nothing ever tells anyone.
2. **Someone copies the template and reads the gate as the guarantee.** The
   README says `design-delta` "fails CI when code and contracts disagree". A
   component with no contract cannot disagree with one, so the guarantee quietly
   does not cover the worst case.
3. **A maintainer deletes a contract while refactoring.** The component stays,
   the contract goes, and the gate reports a warning nobody reads.

## Functional requirements

- **FR1.** A component source file under `components/` that no contract
  references makes `npm run drift:verify` exit non-zero.
- **FR2.** `npm run verify` therefore fails on such a tree, since
  `drift:verify` is one of its steps.
- **FR3.** The three example components (`badge`, `button`, `card` with
  `card-header`) keep passing: `npm run verify` is green on `develop` with no
  component added.
- **FR4.** No other rule's severity changes, and no `exemptions` entry is
  added. The 27 `token-unreferenced` and 21 `token-unemitted` findings keep
  `review` — what to do about those is a separate open question
  ([#35](https://github.com/chrisgriffin/agentic-design-system/issues/35)) and
  this change must not pre-empt it.
- **FR5.** A test in the repo's own suite fails if the rule stops gating, so
  the severity cannot be lowered back without a red check. The work adds
  `test-utils/contract-coverage.test.ts` for this.
- **FR6.** `README.md` and `CLAUDE.md` say what the gate now refuses, where
  each already describes the gate, so a copier reads the real guarantee.

## Non-goals

- Changing what a contract must contain, or any existing contract.
- Requiring a `.stories.tsx`, `.figma.tsx` or `index.ts` — those are the
  directory shape `CLAUDE.md` describes, and each is its own question. Only the
  contract is invariant 2.
- Deciding anything about the 48 `review` token findings (#35).
- Any change to the engine itself. `coverage/uncontracted-component` already
  exists and already fires; only its severity in this repo is wrong.

## Success criteria

- [ ] **Runnable:** `npx vitest run --reporter=verbose 2>&1 | grep -c "a component with no contract fails the gate"` prints `1`; on `develop` today it prints `0`, because no test asserts it yet.
- [ ] `npm run verify` exits non-zero on a tree carrying a component folder whose only files are a `.tsx`, a `.module.css` and a `.test.tsx`, and the failing step is `drift:verify` naming `coverage/uncontracted-component`.
- [ ] `npm run verify` exits 0 on `develop` with no component added, and `drift:verify` still reports the same **48** `review` findings and **0** `error`.
- [ ] `design-delta.json` adds no `exemptions` entry and lowers no rule's severity.
- [ ] `README.md` and `CLAUDE.md` each state that a component with no contract fails the gate.
