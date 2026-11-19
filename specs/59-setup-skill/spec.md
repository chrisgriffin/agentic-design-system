# Spec: A setup skill writes a new system's own docs and brand after init

**Issue**: [#59](https://github.com/chrisgriffin/agentic-design-system/issues/59)

## Overview

The init script swaps names, but the prose and the brand a copy inherits still describe the template: `CLAUDE.md`'s opening line, the README's purpose and component sections, `docs/architecture.md`'s "What it is", `docs/releasing.md`'s package line, the template's ADRs, its fonts and its accent palette. Writing those takes judgment, so a Claude Code skill shipped with the template asks the owner and writes them, once, after init.

## User scenarios

- Someone who just ran the create command opens Claude Code in the new folder and runs `/setup-system`; it asks what the system is for, its brand and which examples and ADRs to keep, then rewrites the docs and tokens, runs the gate and leaves the diff uncommitted.
- Someone who runs `/setup-system` in the template itself, or in a copy init has not run in, is told to run init first, and nothing changes.

## Functional requirements

- FR-001: `.claude/skills/setup-system/SKILL.md` ships in the template and survives init.
- FR-002: The init script's closing line and the create command's both name `/setup-system`.
- FR-003: The skill stops, changing nothing, where `package.json` still has a `bin` entry (init removes it).
- FR-004: The skill interviews the owner and rewrites `CLAUDE.md`'s opening line, the README's purpose and component sections, `docs/architecture.md`'s "What it is" and its "It is a template" line, and `docs/releasing.md`'s package line; it asks whether to keep each ADR, and a dropped one leaves `docs/adr/` with its index row and every link to it.
- FR-005: The skill sets the font families and accent ramp the owner gives in `tokens/json/primitives/`, with the matching font links in `.storybook/preview-head.html`.
- FR-006: The skill asks whether to keep `button` and `card`; a removed one leaves `components/` and every doc that names it. `badge` stays: the scaffold copies it.
- FR-007: The skill ends with `npm run verify` green, commits nothing and deletes its own folder.
- FR-008: A test fails when the skill names a repo path a copy does not have.

## Success criteria

- [ ] A copy made by the create command or the init script holds `.claude/skills/setup-system/SKILL.md`, init's closing line names `/setup-system`, and `init-check.yml` fails when either is missing.
- [ ] The skill, run in a copy, asks the owner what the system is for and rewrites the copy's description of itself: `CLAUDE.md`'s opening line, the README's purpose and component sections, `docs/architecture.md`'s "What it is" and `docs/releasing.md`'s package line; and asks whether to keep each template ADR.
- [ ] It sets the brand the owner gives (font families and accent palette in `tokens/json/primitives/`, with the matching font links in `.storybook/preview-head.html`), and asks whether to keep the `button` and `card` examples; removing one updates every doc that names it.
- [ ] It stops where `scripts/init.mjs` still exists (the template itself, or a copy not yet initialized), ends with `npm run verify` green, commits nothing and deletes itself.
- [ ] **Runnable:** `node --test cli/setup-skill.test.mjs` (a test this work adds, failing when the skill names a path a copy does not have) exits 0 with `# fail 0`.

## Notes

- The stop test reads `package.json`'s `bin`, not the presence of `scripts/init.mjs`: `init-check.yml` fails a copy whose Markdown names the init script, and the skill is Markdown in the copy. Init removes both together, so the two tests agree.

## Out of scope

- Where a copy's own specs live: [#45](https://github.com/chrisgriffin/agentic-design-system/issues/45).
- Running init from the skill: the create command already runs it, and the script stays the one home for the mechanical rewrite.
