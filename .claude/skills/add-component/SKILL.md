---
name: add-component
description: Add a component to this design system the way its gate expects — scaffold it, write its contract first, build the code and stylesheet to that contract with semantic tokens only, and finish with drift and the gate green. Use when asked to add, create or build a new component, or a composed part of an existing one.
---

# add-component

The contract is the source of truth: the code conforms to it, never the other
way around (`CLAUDE.md`, "Non-negotiable invariants"). So the contract is
written first, and every later step is checked against it.

## 1. Read before writing

1. `CLAUDE.md`: the invariants and the component directory shape.
2. `components/badge/`, the one to copy: all seven files.
3. Any other component in `components/` nearest to the one asked for: one
   with enum props, a slot or a design-only axis, or a parent with a composed
   part and that part's own contract.

## 2. Scaffold

A new component: `npm run scaffold -- <kebab-name>`. It writes the seven files
into `components/<name>/` and a draft contract from the props census, and
refuses a name that exists.

A composed part (a header, a footer, an item) is not scaffolded: it adds its
own `.tsx`, `.module.css` and `.contract.json` to the parent's directory,
named `<parent>-<part>` (a `header` of `<parent>` is `<parent>-header.tsx`),
and the parent's `index.ts` exports it.

## 3. Write the contract

Finish `<name>.contract.json` before the code:

- `props`: every prop with its type; an enum lists its `values` and `default`.
  An axis that exists only in the design (a hover state drawn as a variant)
  is marked `"code": "none"` and never becomes a prop.
- `anatomy`: each element, its `element` and the `codeClass` its stylesheet
  uses.
- `styles`: every visual property bound to a semantic token by its dot id
  (`color.fg.default`, `inset.sm`), the base and one entry per variant. Every
  id must exist in `tokens/json/semantics/`. A value the system does not have
  yet is a new token: use the `add-token` skill first, never a literal.

## 4. Build to the contract

- `<name>.tsx`: the props the contract declares, no more; the root element and
  class its anatomy names. Extend the matching `HTMLAttributes` and pass
  `className` and the rest through, as Badge does.
- `<name>.module.css`: every color, space, font, radius and motion value is a
  `var(--<prefix>-…)` semantic token, where the prefix is `PREFIX` in
  `tokens/scripts/source.mjs` and the name is the token's id with dots as
  hyphens. One class per enum value, as `.accent` is Badge's. Write only
  top-level `.class` rules and their nested `&:state` blocks:
  `tokens/scripts/contrast.test.mjs` reads text pairs from that shape and
  throws on any other selector.
- `<name>.stories.tsx`: a story per variant worth seeing.
- `<name>.test.tsx`: keep the scaffold's `variantCases` test, which gives axe
  one case per combination of the contract's code-side enums with no list
  kept by hand. Add a keyboard test with `userEvent` when the component is
  interactive: tab to it, press the keys it answers, assert what each does.
- `<name>.figma.tsx`: map each prop to its Figma property. The node URL stays
  a placeholder until the system has a Figma file.
- `index.ts`: export the component and its props type.

## 5. Run the gate

1. `npm run drift:verify`: the contract against the code and stylesheet. Fix
   the code to the contract; change the contract only when the design itself
   changed.
2. `npm run verify`, until it passes. Fix the cause: never widen Stylelint's
   ignore list, loosen a test or switch off an axe rule. A contrast failure is
   fixed in a token (the `change-theme` skill), never by lowering the bar.
3. Add the component's row to the Components table in `README.md`.
4. Tell the owner to open `npm run storybook` and read the component in both
   themes: the gate checks text pairs, not everything a page shows.

Managed by `npm run update:skills`, which overwrites this file. Delete this line to keep your own edits: the update then leaves the file alone.
