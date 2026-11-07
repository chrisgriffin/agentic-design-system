# Spec: Agent layer: the docked design-delta skill and hook, the guard hooks, a scaffold script and the rulebook

**Issue**: [#4](https://github.com/chrisgriffin/agentic-design-system/issues/4)

## Overview

The layer that lets a coding agent work in the template and self-correct: the skill stub and verify hook `design-delta dock` writes, the two guard hooks a UI repo carries, a scaffold script that writes a component directory in the shape of `components/badge` plus the contract the engine drafts, and a `CLAUDE.md` rulebook under the CI byte budget.

## User scenarios

- An agent edits a component's props; the post-edit hook runs `design-delta verify` and feeds the drift back before the agent moves on.
- An agent writes `color: #333` in a module; the post-edit hook's Stylelint pass refuses it with the token rule's message.
- An agent runs `npm run scaffold -- sample-tile` and gets seven files plus a draft contract that `npm run verify` accepts as written.
- An agent reads `CLAUDE.md` and learns the four invariants, the directory shape, the verify chain, and the couplings no check catches.

## Functional requirements

- FR-001: `.claude/skills/design-delta/SKILL.md`, `.claude/skills/design-delta-verify/SKILL.md` and `.claude/hooks/design-delta-verify.mjs` are the files `design-delta dock` writes, unedited, so a re-run after an engine upgrade refreshes them.
- FR-002: `.claude/hooks/bash-guard.sh` (no force push, no push to `main`, no destructive git on protected branches, no `rm -rf` on a root) and `.claude/hooks/post-edit-check.sh` (Prettier on every edited file, Stylelint on CSS) are wired in `.claude/settings.json` with the dock hook, which runs after every edit.
- FR-003: `scripts/scaffold-component.mjs <kebab-name>` refuses a bad name or an existing directory, writes the seven files, runs `design-delta scaffold <Pascal>` and moves the draft contract beside the component, then formats the directory; `npm run scaffold` runs it.
- FR-004: `CLAUDE.md` states token-first styling, the contract as source of truth, semantic-only shipping, the generated files, the component directory shape, Code Connect once a Figma file is set, the verify chain and the couplings table, under 8,500 bytes with no line over 400 characters and no fleet rule restated.
- FR-005: `README.md` gains an Agent layer section.

## Success criteria

- [x] `.claude/skills/design-delta/SKILL.md` is the stub `design-delta dock` writes, linking to the package's own skill; `.claude/hooks/design-delta-verify.mjs` runs as a PostToolUse hook on contract and component files.
- [x] `.claude/hooks/post-edit-check.sh` and `.claude/hooks/bash-guard.sh` are wired in `.claude/settings.json`.
- [x] `scripts/scaffold-component.mjs` writes the full component file set plus a draft contract from `design-delta scaffold`, and `npm run scaffold -- <name>` produces a directory `npm run verify` accepts.
- [x] `CLAUDE.md` states token-first styling, the component directory shape, Code Connect once a Figma file is set, and the verify chain, within the CI byte budget.
- [x] **Runnable:** `test -f .claude/skills/design-delta/SKILL.md && test -x .claude/hooks/bash-guard.sh && echo docked` prints `docked` (neither file exists today).

## Out of scope

- An MCP server entry in `.claude/settings.json` or `.mcp.json`: `design-delta mcp` exists and `CLAUDE.md` names it; wiring it is a later pass.
- A path filter on the dock hook: Claude Code hooks match on tool, not file, so the generated hook runs after every edit and exits quietly when nothing drifted.
