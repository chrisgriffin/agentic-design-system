# Decision records

This folder records the decisions this repo's own PRs implement, so each one
travels with the code it shaped.

Each record is `ADR-NNN-<slug>.md`, numbered in order within this repo. It
opens with YAML frontmatter carrying `status` (`proposed`, `accepted`,
`superseded` or `deprecated`), `date`, and `superseded-by: ADR-NNN` when it
has a successor; then `# ADR-NNN: <title>`; then `## Context`,
`## Decision` and `## Consequences`, in that order.

## Records

| ADR                                            | Date       | Status   | Decision                                                                    |
| ---------------------------------------------- | ---------- | -------- | --------------------------------------------------------------------------- |
| [ADR-001](./ADR-001-semantic-tokens-ship.md)   | 2026-11-07 | accepted | Only the semantic token tier ships as CSS; primitives are inlined at build. |
| [ADR-002](./ADR-002-contract-is-the-source.md) | 2026-11-07 | accepted | A component is one directory, and its contract is the source of truth.      |
