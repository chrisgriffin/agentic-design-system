---
name: setup-system
description: Finish turning a fresh copy of the design system template into your own system, once, right after init — interview the owner, then rewrite the docs that still describe the template, set the brand tokens, choose which examples and ADRs to keep, run the gate and delete this skill. Use when asked to set up, finish setting up or make this system your own, or when the init's closing line says to run /setup-system.
---

# setup-system

Init renamed this copy, but its prose and brand still describe the template it
came from. This skill writes them for the system the owner is actually
building. It runs once: the last step deletes it.

## 0. Stop if init has not run

Read `package.json`. If it still has a `bin` entry, this is the template itself
or a copy init has not run in. Say so in one line, tell the owner to run the
init step from the README's "Starting your own" first, and stop without
changing anything.

## 1. Read before asking

Read, in full: `CLAUDE.md`, `README.md`, `docs/architecture.md`,
`docs/releasing.md`, `docs/adr/README.md` and each record it lists,
`tokens/json/primitives/typography.json`, `tokens/json/primitives/color.json`,
`tokens/json/semantics/color.json` and `.storybook/preview-head.html`. Note
every sentence that describes the template rather than this system.

## 2. Interview the owner

Ask one question at a time and wait for the answer. Every question accepts
"keep the template's", which leaves that part as it is.

1. What is this system for, and who builds with it? Two or three sentences.
2. Is the package private, or published, and where (npm, GitHub Packages)?
3. Which font families: body, and mono if any? Google Fonts or self-hosted?
4. The brand's accent color, as a hex value, or a ramp if they have one.
5. Keep the `button` example? Keep the `card` example? (`badge` always stays:
   `npm run scaffold` copies it.)
6. For each record in `docs/adr/`: keep it, or drop it? Say what each one
   decides in a line, so the owner can choose.

## 3. Rewrite the docs

Use the owner's words; do not embellish them.

- `CLAUDE.md`: the opening line under the title says what this system is.
- `README.md`: the paragraph after the description, the Tokens list where the
  palette or fonts changed, and the Components table for the examples kept.
- `docs/architecture.md`: "What it is" (both paragraphs), the "Nothing depends
  on this repo as code" line, and the README line under "Where to look next".
- `docs/releasing.md`: the opening paragraph's package line.

## 4. Drop the ADRs the owner does not keep

For each one: delete its file from `docs/adr/`, remove its row from
`docs/adr/README.md`, then grep the repo for its number (`ADR-003`, say) and
rewrite each sentence that links it, so none points at a missing file.

## 5. Set the brand

- Fonts: replace the family values in `tokens/json/primitives/typography.json`
  (keep each array's generic fallbacks), and replace the font link in
  `.storybook/preview-head.html` to load the new families, or remove it for
  self-hosted fonts and say where the font files belong.
- Accent: replace the accent ramp's values (the template's is `color.blue`)
  in `tokens/json/primitives/color.json`, keeping its step names, so every
  semantic token that aliases a step keeps working. From a single hex, build
  the ramp around it, lightest to darkest. Text set on the accent, and accent
  text on the canvas, must reach a 4.5:1 contrast in both themes; check the
  pairs `tokens/json/semantics/color.json` defines.
- Run `npm run build:tokens`. Never edit the built CSS by hand.

## 6. Remove the examples the owner does not keep

For each one: delete `components/<name>/`, then grep the repo for the name
(outside `node_modules` and `storybook-static`) and update every doc, story,
test and table that names it, `docs/testing.md` included.

## 7. Run the gate

Run `npm run verify` and fix what fails until it passes. Fix the cause: never
loosen a lint rule, a test or a `design-delta.json` severity to get it green.

## 8. Finish

1. Delete this skill's folder, `.claude/skills/setup-system/`.
2. Show the owner `git status` and a one-line summary of each change.
3. Commit nothing: the owner reads the diff and commits it.
