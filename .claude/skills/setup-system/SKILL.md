---
name: setup-system
description: Finish turning a fresh copy of the design system template into your own system, once, right after init — interview the owner, then rewrite the docs that still describe the template, set the brand tokens, choose which examples and ADRs to keep, run the gate and delete this skill. Use when asked to set up, finish setting up or make this system your own, or when the init's closing line says to run /setup-system.
---

# setup-system

Init renamed this copy, but its prose and brand still describe the template it
came from. This skill writes them for the system the owner is actually
building. It runs once: the last step deletes it.

## 0. Check where you are

1. Read `package.json`. If it still has a `bin` entry, this is the template
   itself or a copy init has not finished in (init removes the `bin` last,
   only after its gate passes). Say so in one line, tell the owner to
   run the init step from the README's "Starting your own" first, and stop
   without changing anything.
2. Run `git status --short`, and `git rev-parse --verify HEAD`, which fails
   in a copy with no commit yet (the create command starts a new history and
   commits nothing). If either shows uncommitted work, it is init's: ask the
   owner to commit it first, so this skill's diff can be read on its own. If
   they decline, go on; with no commit, `git status` lists every file, so
   keep your own list of what you change and give it in the final summary.

## 1. Read before asking

Read, in full: `CLAUDE.md`, `README.md`, `docs/architecture.md`,
`docs/releasing.md`, `docs/adr/README.md` and each record it lists,
`tokens/json/primitives/typography.json`, `tokens/json/primitives/color.json`,
`tokens/json/semantics/color.json`, `.storybook/preview-head.html` and every
component stylesheet. Note every sentence that describes the template rather
than this system.

## 2. Interview the owner

Ask one question at a time and wait for the answer. Every question accepts
"keep what's there", which leaves that part as it is.

1. What is this system for, and who builds with it? Two or three sentences.
2. Its one-line description. Init wrote the README's first line and
   `package.json`'s `description` from `--description`, or as "The <name>
   design system."; show the current one and offer to keep it.
3. How do other projects get it: never published, npm, GitHub Packages, or
   copied in?
4. Which font families: body, and mono if any? Google Fonts or self-hosted?
5. The brand's accent color, as a hex value, or a whole ramp if they have one.
6. Keep the `button` example? Keep the `card` example? (`badge` always stays:
   `npm run scaffold` copies it.)
7. For each record in `docs/adr/`: keep it, or drop it? Say in a line what
   each one decides, so the owner can choose.

## 3. Rewrite the docs

Say only what the owner told you, in plain words: no claims of your own.

- The description, if it changed: the README's first line under the title and
  `package.json`'s `description`.
- `CLAUDE.md`: the opening line under the title says what this system is.
- `README.md`: a paragraph after the description saying what the system is
  for and who builds with it; the Components table for the examples kept.
- `docs/architecture.md`: "What it is" (both paragraphs), and the "Nothing
  depends on this repo as code" line, rewritten to say how other projects get
  it; the README line under "Where to look next".
- `docs/releasing.md`: the opening paragraph's package line. Write only what
  is true today: the release flow publishes to no registry, so if the owner
  wants the package published, say it is not yet, and tell them what is
  missing (a scope, `publishConfig`, a publish step).
- Then search every text file in the working tree, committed or not
  (`git grep --untracked`, which still skips what `.gitignore` lists), Markdown, comments, test
  titles, JSON `_doc` keys and workflow YAML alike, for `template`, `Chris`,
  `--figma-file` and issue references such as `(#44)` or `"#23 `. Rewrite each
  sentence that describes the template's origin or its owner rather than this
  system, and each that tells the reader to run init, which this copy no
  longer has (a Figma key is now set by replacing the placeholder key in each
  `*.figma.tsx` and adding it to `design.files` in `design-delta.json`). Drop each issue reference:
  those issues are the template's. Read past the word, too: "A copy's owner"
  is the template talking. Leave alone: other senses of the word (a template
  literal, the scaffold's templates), the `chrisgriffin/*` packages and repos
  this copy depends on, generated files, and any `<!-- fleet:... -->` block.

## 4. Drop the ADRs the owner does not keep

For each one: delete its file from `docs/adr/` (a plain delete, not `git rm`,
which stages it), remove its row from
`docs/adr/README.md`, then search for its number with `git grep --untracked` (`ADR-003`, say) and
rewrite each sentence that links it, so none points at a missing file. Leave
the text of a kept record as written: it records a decision as it was made.

## 5. Set the brand

Fonts:

- Replace the family values in `tokens/json/primitives/typography.json`,
  keeping each array's generic fallbacks.
- Replace the font link in `.storybook/preview-head.html` so it loads the new
  families. A weight range (`wght@400..700`) works only for a variable font;
  for one that is not, list the weights (`wght@400;500;600;700`). To tell
  which, fetch the link's URL: a 400 means the range is refused. For
  self-hosted fonts, remove the link and tell the owner where the files go.

Accent:

A semantic color sets its light value twice, in `$value` (which the CSS's
`:root` is built from) and in `$extensions.mode.light` (which the Storybook
Tokens page reads); change the two together, always.

1. Rename the accent ramp (the template's is `color.blue`) after the new hue,
   in `tokens/json/primitives/color.json`, and update every alias to it in
   `tokens/json/semantics/color.json`. Keep its step names.
2. From a single hex, put it at the step `color.accent.default`'s `$value`
   aliases, then build the lighter and darker steps
   around it. A ramp the owner gives replaces the steps as given.
3. Find the pairs to check in the component stylesheets: each rule that sets
   a `color` token over a `background` token, and each accent token used as
   text on the canvas. Text must reach 4.5:1 against what it sits on, in both
   themes. Check every pair, not only the accent's: the success and danger
   badges too. `node --test tokens/scripts/contrast.test.mjs` finds and checks
   them all, naming each pair that falls short, its theme and its ratio.
4. Where a pair falls short, change which step its semantic token aliases in
   that theme, adjust a step's value, or add a step to a short ramp. Never
   lower the bar or switch a check off. In the dark theme, expect a conflict:
   no accent step carries white `fg.on-accent` text at 4.5:1 and also reads
   as `accent.default` text on the near-black canvas. The usual way out is to
   alias dark `fg.on-accent` to a dark neutral step, as the template does. Tell the owner which pairs
   conflicted and what you chose, and let them change it.
5. Run `npm run build:tokens`. Never edit the built CSS by hand.

## 6. Remove the examples the owner does not keep

For each one: delete `components/<name>/`, then search for the name with
`git grep --untracked` (it skips `node_modules` and `storybook-static`, which
`.gitignore` lists) and update every doc, story,
test and table that names it, `docs/testing.md` included. Where a doc uses it
as the example of a rule that still holds (`card-header` is the composed-part
example), keep the rule and give another example, or a generic one; but leave a kept
ADR's text as written (step 4).

## 7. Run the gate

1. Run `npx prettier --write .`: a deleted table row leaves its table's
   columns misaligned.
2. Run `npm run verify` and fix what fails until it passes. Fix the cause:
   never loosen a lint rule, a test or a `design-delta.json` severity.
3. Run `npm run build-storybook`. The gate checks the text pairs component
   stylesheets set; anything else on a page is only checked in a browser, so
   tell the owner to open `npm run storybook`, look at each story's
   accessibility panel in both themes, and read the Tokens page.

## 8. Finish

1. Delete this skill's folder, `.claude/skills/setup-system/`, and the
   clause naming it in `docs/architecture.md`'s agent-layer passage.
2. Show the owner `git status --short` (or, with no commit yet, your own
   list from step 0) and one line for each change this skill made.
3. Commit nothing: the owner reads the diff and commits it.
