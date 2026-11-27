---
name: add-token
description: Add a design token to this system the way its build expects — a primitive for the raw value, a semantic token aliasing it, both themes for a color, then the build and the gate. Use when asked to add a color, space, size, radius, font or motion value, or when a component needs a value no semantic token has.
---

# add-token

Only semantic tokens ship. A primitive holds a raw value and is inlined at
build; code never references one. So a new value starts as a primitive, and a
semantic token aliases it (`CLAUDE.md`, "Non-negotiable invariants").

## 1. Look first

1. Read the group's two files: `tokens/json/primitives/<group>.json` and
   `tokens/json/semantics/<group>.json`, where the group is one of `color`,
   `space`, `shape`, `typography` and `motion`.
2. A semantic token that already says what is needed is the answer: use it,
   add nothing. A primitive with the value already there needs only the
   semantic token (step 3).

## 2. Add the primitive

In `tokens/json/primitives/<group>.json`, in the shape its neighbors use: a
`$type` and a `$value`. A color is written in sRGB components, as every color
there is (`terrazzo.config.mjs` refuses another color space). A step added to
a ramp keeps the ramp's step names.

## 3. Add the semantic token

In `tokens/json/semantics/<group>.json`, named for its purpose, not its value
(`inset.lg`, not `space.24`), in kebab-case segments. Its `$value` aliases the
primitive: `"{space.6}"`.

A semantic color needs both themes: `$extensions.mode.light` and
`$extensions.mode.dark`, each an alias, with `$value` the same alias as
`light` (the CSS is built from `$value`, the Storybook Tokens page reads the
modes). The build refuses a semantic color missing either mode.

An id cannot be both a primitive and a semantic token: `tokens/scripts/source.mjs`
throws, naming it.

## 4. Build

1. `npm run build:tokens` writes `tokens/css/tokens.css`. Never edit that
   file: it is overwritten on every build.
2. A font family added or changed in `tokens/json/primitives/typography.json`
   also changes the font link in `.storybook/preview-head.html`, which nothing
   checks.

## 5. Use it and run the gate

1. In a stylesheet: `var(--<prefix>-<id>)`, the id with dots as hyphens, where
   the prefix is `PREFIX` in `tokens/scripts/source.mjs`. In a contract's
   `styles`: the dot id.
2. `node --test tokens/scripts/*.test.mjs` for the tokens alone, then
   `npm run verify` until it passes. A new text color used by a component is
   held to 4.5:1 in both themes; if it falls short, the `change-theme` skill
   says how to fix it.

Managed by `npm run update:skills`, which overwrites this file. Delete this line to keep your own edits: the update then leaves the file alone.
