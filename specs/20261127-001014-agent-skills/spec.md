# Spec: a created system keeps three agent skills for its everyday work, and one command keeps them current

## Overview

A created system's only skill of its own is `setup-system`, which runs once and deletes itself. After that, an agent working in the system has the rules (`CLAUDE.md`) but no procedure for the three changes it makes most: adding a component, adding a token, and changing a theme. Each of those crosses couplings no single check names in one place (contract before code, primitive before semantic, both themes at 4.5:1).

This change ships three skills in `.claude/skills/`, kept by init in every created system: `agentic-ds-add-component`, `agentic-ds-add-token` and `agentic-ds-change-theme`. Since a created system starts its own history and never pulls from the template again, it also ships `npm run update:skills` (`scripts/update-skills.mjs`): it fetches the template's current skills and writes each one the system has not claimed as its own.

## User scenarios

1. An owner asks their agent for a new component. The agent reads `agentic-ds-add-component`, scaffolds it, writes the contract first, builds the code to it, and finishes with the gate green.
2. An owner asks for a new spacing value. The agent reads `agentic-ds-add-token`: a primitive, a semantic token aliasing it, the build, the gate.
3. An owner asks for a darker accent in dark mode. The agent reads `agentic-ds-change-theme`: both of a color's light values move together, every text pair holds 4.5:1 in both themes, the fix is to a token, never to the bar.
4. Months later the template's skills improve. The owner runs `npm run update:skills`: each managed skill is updated, a new one is added, and a skill they edited and claimed is left as it is and named.

## Functional requirements

- **FR-001** `.claude/skills/agentic-ds-add-component/SKILL.md`, `.claude/skills/agentic-ds-add-token/SKILL.md` and `.claude/skills/agentic-ds-change-theme/SKILL.md` ship in the template with a `name` matching their folder and a one-line `description`.
- **FR-002** Each skill names only paths a created system has, and nothing init rewrites or removes (the template's name, its prefix as `--<prefix>-`, the placeholder Figma key, an init marker, the init script, the create command), so init leaves them whole and an update writes the same text a created system was given.
- **FR-003** Each skill carries one managed line: the update overwrites a file that carries it, and leaves alone a file whose owner deleted it.
- **FR-004** `npm run update:skills` clones the template's default branch (from `package.json`'s `skillsFrom`, which init writes, else the template's own `repository.url`; `--from <url|path>` overrides), and for each `.claude/skills/*/SKILL.md` there that carries the managed line: writes it when the system has none, overwrites it when the system's copy carries the line and differs, and leaves it when the system's copy does not carry the line. It prints one line per skill (added, updated, current, kept) and exits 0.
- **FR-005** A clone that fails, or an argument it does not know, is one failure line and exit 1, with nothing written. The temporary clone is always removed.
- **FR-007** The skills are named `agentic-ds-<skill>`, which init renames to `<system>-<skill>` in folder and text, so they never collide with another skill; an update maps the source's name onto the system's.
- **FR-006** Init keeps the three skills, the script, its test and the `update:skills` script in a created system, and writes `skillsFrom` into its `package.json`.

## Success criteria

- [x] An agent in a created system finds `agentic-ds-add-component`, `agentic-ds-add-token` and `agentic-ds-change-theme` in `.claude/skills/`, each naming only paths the system has and nothing init rewrites: `cli/agent-skills.test.mjs`.
- [x] `npm run update:skills` against a template adds a missing managed skill, updates a stale one, leaves a claimed one and names it, and writes nothing when the clone fails: `scripts/update-skills.test.mjs`.
- [x] A created system's `package.json` has the `update:skills` script and a `skillsFrom` naming the template: `cli/init-manifest.test.mjs`.
- [x] **Runnable:** `node --test cli/agent-skills.test.mjs scripts/update-skills.test.mjs` passes (on `develop` it fails: neither file exists), and `npm test` stays green.
