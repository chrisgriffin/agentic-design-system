# Spec: The README's Development steps install with npm ci

**Issue**: [#53](https://github.com/chrisgriffin/agentic-design-system/issues/53)

## Overview

`README.md` § Development tells a contributor to run `npm install`. On npm 11 that re-resolves `package-lock.json` and can drop an entry CI's npm 10 needs, so the next push fails `npm ci` in CI. The init script already installs with `npm ci` (#44); the contributor steps should too.

## User scenarios

- A contributor following the README's Development steps installs exactly what the lock file records, and CI's `npm ci` accepts their next push.

## Functional requirements

- FR-001: `README.md` § Development installs with `npm ci`, and no step there runs a bare `npm install`.
- FR-002: `docs/architecture.md` § Running it, which lists the same steps, installs with `npm ci` too, so no doc still teaches the old step.

## Success criteria

- [ ] The README's Development steps install the dependencies with `npm ci`, and no step there tells a contributor to run a bare `npm install`.
- [ ] **Runnable:** `grep -cE "^npm ci( |$)" README.md` prints 1 or more (it prints 0 on `develop`).
- [ ] `npm run verify` exits 0.

## Out of scope

- `npm install design-delta@^<version>`, the deliberate engine move: it names a package, so it is not a bare install.
- The init script, already on `npm ci` (#44).
