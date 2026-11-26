# Review checklist: the design system serves itself to an agent over one MCP server

Purpose: requirements quality for a PR reviewer. `[x]` means the reviewer found the requirement criterion satisfied, not that code is done.

## Requirement completeness

- [ ] CHK001 Is every tool's input and answer named, own and forwarded? [Completeness, Spec §FR-002–FR-005]
- [ ] CHK002 Is design-delta failing to start defined, for both kinds of tool? [Edge Case, Spec §FR-005]
- [ ] CHK003 Is an unknown component id, and a `CLAUDE.md` without the sections, defined? [Edge Case, Spec §FR-002, §FR-004]
- [ ] CHK004 Is a created system's copy of the server covered (kept, renamed, tested)? [Coverage, Spec §FR-006]

## Requirement clarity

- [ ] CHK005 Is "read on each call" stated for every answer read from disk, so nothing goes stale? [Clarity, Spec §FR-003, §FR-004]
- [ ] CHK006 Is read-only stated, for disk and stdout? [Clarity, Spec §FR-001]

## Consistency

- [ ] CHK007 Does no own tool repeat a design-delta tool (contracts, props, token census)? [Consistency, Spec §Overview]

## Acceptance criteria quality

- [ ] CHK008 Does the runnable line fail on `develop` and pass after the change? [Measurability, Spec §Success criteria]
- [ ] CHK009 Is every surface the change touches listed in the plan? [Traceability, Plan §Surfaces touched]
