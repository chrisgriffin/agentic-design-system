---
status: accepted
date: 2026-11-07
---

# ADR-001: Only the semantic token tier ships as CSS; primitives are inlined at build

## Context

The token source has two tiers: primitives (a neutral ramp, one accent ramp, a space scale, two families) and semantics (the names a component uses, each an alias of a primitive, colors with a value per theme). Terrazzo's CSS plugin emits every token as a custom property and writes each alias as a `var()` chain, so a built stylesheet would carry both tiers and a component could reach past the semantic names to `--ads-primitive-blue-500`. The engine's audit and Stylelint's token rule both read the built CSS for the set of names a component may use.

## Decision

`npm run build:tokens` emits only the semantic tier. A post-pass, `inlinePrimitives` in `tokens/scripts/inline-primitives.mjs` (run by `tokens/scripts/build-css.mjs`), replaces every `var(--ads-primitive-*)` with its final value, following a primitive that aliases another, and drops the primitive declarations; it fails the build on a reference cycle, a primitive declared twice, or a primitive left in its output. `tokens/scripts/tokens.test.mjs` fails when a primitive or a `var()` is left. A new value starts as a primitive aliased by a semantic token, never as a semantic literal.

## Consequences

Components, Stylelint and the engine see one vocabulary, the semantic names, and a primitive can change without a component noticing. The Storybook Tokens page shows the primitive palette from the build manifest instead, since the CSS no longer carries it. A theme that needs a primitive directly would have to add a semantic alias for it, which is the point.
