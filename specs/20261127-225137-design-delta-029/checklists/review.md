# Review checklist: the template runs on design-delta 0.29.0

Purpose: requirements quality for a PR reviewer. `[x]` means the reviewer found the requirement criterion satisfied, not that code is done.

- [x] CHK001 Is the lock file's npm 10 compatibility stated and checked? [Completeness, Spec §FR-001]
- [x] CHK002 Is the new finding answered in the code, not the contract or the config? [Consistency, Spec §FR-003]
- [x] CHK003 Does the runnable line fail without the change and pass with it? [Measurability, Spec §Success criteria]
- [x] CHK004 Is every surface listed? [Traceability, Plan §Surfaces touched]
