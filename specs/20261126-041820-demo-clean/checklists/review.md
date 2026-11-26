# Review checklist: npm run demo -- --clean removes the demo folder

Purpose: requirements quality for a PR reviewer. `[x]` means the reviewer found the requirement criterion satisfied, not that code is done.

## Requirement completeness

- [x] CHK001 Is the folder `--clean` removes named exactly, and a folder `--dir` names excluded? [Completeness, Spec §FR-001, §Out of scope]
- [x] CHK002 Is the outcome defined when there is nothing to remove? [Edge Case, Spec §FR-002]
- [x] CHK003 Is `--clean` combined with any other argument defined, with its exit code? [Coverage, Spec §FR-003]

## Requirement clarity

- [x] CHK004 Is it stated that `--clean` runs neither the create command nor the uncommitted-changes warning? [Clarity, Spec §FR-001, §FR-004]
- [x] CHK005 Is the output of each `--clean` outcome specified (a step line, or a failure line on stderr)? [Clarity, Spec §FR-001–FR-003]

## Acceptance criteria quality

- [x] CHK006 Does the runnable line fail on `develop` and pass after the change? [Measurability, Spec §Success criteria]
- [x] CHK007 Is every surface the change touches (README, docs) listed in the plan? [Traceability, Plan §Surfaces touched]
