---
name: change-theme
description: Change this system's colors in its light or dark theme without breaking either — move a semantic color's aliases or a ramp's values, keep every component text pair at 4.5:1 in both themes, and rebuild. Use when asked to change a color, the accent, the brand palette, dark mode, or to fix a contrast failure.
---

# change-theme

Each semantic color has a light and a dark value. Components use only semantic
colors, so a theme changes in the token sources, never in a stylesheet.

## 1. Find what to change

1. `tokens/json/semantics/color.json`: each semantic color aliases a primitive
   step per theme.
2. `tokens/json/primitives/color.json`: the ramps those aliases point into.
3. Decide which kind of change it is: pointing a semantic color at another
   step (one token changes), or changing a ramp's values (every token aliasing
   it changes, in both themes).

## 2. Change it

- A semantic color sets its light value twice, in `$value` (which the CSS's
  `:root` is built from) and in `$extensions.mode.light` (which the Storybook
  Tokens page reads). Change the two together, always. The dark value is
  `$extensions.mode.dark` alone.
- Keep a ramp's step names when changing its values; add a step to a short
  ramp rather than reusing one for two jobs.
- A new primitive or semantic color is the `add-token` skill.
- A theme beyond light and dark is not this skill: it touches `modeSelectors`
  and the required modes in `terrazzo.config.mjs`, the themes the manifest
  builds in `tokens/scripts/build-manifest.mjs`, the theme test in
  `tokens/scripts/tokens.test.mjs` and the Storybook theme switch in
  `.storybook/preview.ts`. Tell the owner, and plan it with them first.

## 3. Hold contrast in both themes

1. `npm run build:tokens`.
2. `node --test tokens/scripts/contrast.test.mjs`. It reads every text pair
   the component stylesheets set and checks each at 4.5:1 in both themes,
   naming each pair that falls short, its theme and its ratio.
3. Fix a pair in the tokens: point the semantic color at another step in that
   theme, adjust a step's value, or add a step. Never lower the bar or switch
   the check off. Check every pair, not only the ones the change aimed at: a
   ramp moved for the accent moves everything aliasing it.
4. In the dark theme, expect a conflict: one step rarely carries white text
   on an accent fill at 4.5:1 and also reads as accent text on the
   near-black canvas. Look at how `fg.on-accent` is aliased today before
   choosing, and tell the owner which pairs conflicted and what you chose.

## 4. Run the gate

1. `npm run verify`, until it passes. Never edit `tokens/css/tokens.css` by
   hand: the build overwrites it.
2. Tell the owner to open `npm run storybook`, switch both themes and read the
   Tokens page and each story: the gate checks the text pairs stylesheets set,
   not borders, focus rings or anything a story adds.

Managed by `npm run update:skills`, which overwrites this file. Delete this line to keep your own edits: the update then leaves the file alone.
