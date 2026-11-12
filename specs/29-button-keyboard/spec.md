# Spec: Button's tests show it works from the keyboard alone

**Issue**: [#29](https://github.com/chrisgriffin/agentic-design-system/issues/29)

## Overview

The gate's accessibility check runs axe over each component's rendered markup, which catches a missing name or a wrong role but never presses a key. Button is the template's one interactive component, and nothing tests that a keyboard alone can reach and use it. This adds keyboard tests to Button's test file and says in `docs/testing.md` what keyboard behaviour the gate checks, apart from what axe checks. It is the follow-up the a11y spec's § Out of scope named.

## User scenarios

- A keyboard user tabs to a Button and presses Enter or Space; its action runs once.
- A keyboard user tabs past a disabled Button; it takes no focus, and Enter or Space does nothing.
- A contributor who breaks either (a `div` with a click handler, a `tabIndex={-1}`, a handler on mouse events only) sees `npm test` fail.

## Functional requirements

- FR-001: `components/button/button.test.tsx` tabs to an enabled Button with `userEvent.tab()` and asserts it has focus.
- FR-002: The same file presses Enter, and separately Space, on the focused Button and asserts `onClick` fired exactly once for each.
- FR-003: The same file renders a disabled Button after a focusable element, tabs, asserts the disabled Button does not take focus, then presses Enter and Space and asserts `onClick` never fired.
- FR-004: Each keyboard test's title contains the word "keyboard".
- FR-005: `docs/testing.md` § What is tested states the keyboard behaviour the gate checks for Button, separately from what axe checks.
- FR-006: `specs/20261111-144012-a11y-in-the-gate/spec.md` § Out of scope and its `checklists/gate.md` CHK034 point at this spec, so the follow-up reads as done.

## Success criteria

- [ ] Button's tests show it is reached with Tab, and that Enter and Space each fire its `onClick` exactly once.
- [ ] A disabled Button is skipped by Tab and fires nothing on Enter or Space.
- [ ] `docs/testing.md` says what keyboard behaviour the gate checks, separately from what axe checks.
- [ ] **Runnable:** `npx vitest run components/button --reporter=verbose 2>&1 | grep -ci keyboard` prints 1 or more and exits 0 (on `develop` today it prints `0` and exits 1).

## Out of scope

- Badge and Card, which are not interactive.
- The scaffold's test template: a scaffolded component is not interactive by default.
- Any change to `Button` itself: it renders a native `<button>`, which already does all of this.
