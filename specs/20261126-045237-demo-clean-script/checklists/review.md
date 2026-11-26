# Review checklist: npm run demo:clean removes the demo folder

Purpose: requirements quality for a PR reviewer. `[x]` means the reviewer found the requirement criterion satisfied, not that code is done.

## Requirement completeness

- [ ] CHK001 Is the script's exact command named, so it matches `npm run demo -- --clean`? [Completeness, Spec §FR-001]
- [ ] CHK002 Is a created system's `package.json` covered, so it keeps no script for removed files? [Coverage, Spec §FR-002]

## Acceptance criteria quality

- [ ] CHK003 Does the runnable line fail on `develop` and pass after the change? [Measurability, Spec §Success criteria]
- [ ] CHK004 Is every surface the change touches listed in the plan? [Traceability, Plan §Surfaces touched]
