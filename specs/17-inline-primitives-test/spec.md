# Spec: The token pipeline's primitive inlining has a unit test, and the token scripts export only what something imports

**Issue**: [#17](https://github.com/chrisgriffin/agentic-design-system/issues/17)

## Overview

`inlinePrimitives` is the one piece of string surgery in the token pipeline: it replaces every `var(--ads-primitive-*)` with that primitive's value, drops the primitive declarations, and throws on a primitive nothing declares. It lives in `tokens/scripts/build-css.mjs`, which runs the whole build when it is loaded, so nothing imports it and no test calls it. It moves to a module that has no side effects on import, a unit test calls it directly, and the two exports in `tokens/scripts/source.mjs` that nothing imports stop being exported.

## User scenarios

- A person changes the inlining regexes and a unit test names what broke, instead of a wrong `tokens.css` that nobody reads.
- A person reads `source.mjs` and every export it carries has a reader somewhere.

## Functional requirements

- FR-001: `inlinePrimitives` lives in `tokens/scripts/inline-primitives.mjs`, which imports nothing that runs a build; `build-css.mjs` imports it from there and exports nothing.
- FR-002: `tokens/scripts/inline-primitives.test.mjs` calls `inlinePrimitives` on a small CSS string and checks a reference becomes its value, the declarations are gone, and an undeclared primitive throws.
- FR-003: `tokenIds` and `primitives` in `source.mjs` are module-local.
- FR-004: The built `tokens/css/tokens.css` is unchanged byte for byte.

## Success criteria

- [x] A unit test calls `inlinePrimitives` directly and checks that a primitive reference becomes its value, that primitive declarations are gone from the output, and that an undeclared primitive throws.
- [x] Every export in `tokens/scripts/build-css.mjs` and `tokens/scripts/source.mjs` is imported by another file, test files included.
- [x] `tokens/css/tokens.css` built from `develop`'s token source is byte-identical after the change.
- [x] **Runnable:** `git grep -l "inlinePrimitives" -- "*.test.*" | wc -l` prints 1 or more (0 on `develop`).

## Out of scope

- Any change to what the inlining does, or to the other token scripts.
