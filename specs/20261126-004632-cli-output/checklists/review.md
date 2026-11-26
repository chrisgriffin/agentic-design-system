# Review checklist: the create command's output reads as steps and a summary

Purpose: requirements quality for a PR reviewer. `[x]` means the reviewer found the requirement criterion satisfied, not that code is done.

## Requirement completeness

- [x] CHK001 Is every script whose output changes named (create, init, demo)? [Completeness, Spec §FR-002–FR-005]
- [x] CHK002 Is the output of other tools explicitly left as those tools print it? [Completeness, Spec §Out of scope]
- [x] CHK003 Is the failure form defined for a refused value, a failed clone and a failed gate command? [Coverage, Spec §User scenarios]

## Requirement clarity

- [x] CHK004 Is "in color" bounded by a testable condition (a terminal, `NO_COLOR` unset)? [Clarity, Spec §FR-001]
- [x] CHK005 Is the pending-to-done behavior of a step line defined both on a terminal and piped? [Clarity, Spec §FR-002]

## Requirement consistency

- [x] CHK006 Do the next steps stay single-sourced between create and a standalone init run, with the `CREATE_AGENTIC_DS` hand-off defined? [Consistency, Spec §FR-004]
- [x] CHK007 Does keeping init's last line naming `/setup-system` agree with the CI check that reads it? [Consistency, Plan §Surfaces touched]

## Edge cases and dependencies

- [x] CHK008 Is init's refusal-line format held fixed for create's parser, across template versions? [Edge Case, Spec §FR-006]
- [x] CHK009 Is the new file's place in the published package stated? [Dependency, Spec §FR-007]
- [x] CHK010 Is the Node 22 floor reconciled with `styleText`'s own stream check (22.13)? [Assumption, Plan §Technical context]

## Acceptance criteria

- [x] CHK011 Is there a runnable line that is red before the change? [Measurability, Spec §Success criteria]
