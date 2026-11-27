# Review checklist: a created system keeps three agent skills for its everyday work, and one command keeps them current

Purpose: requirements quality for a PR reviewer. `[x]` means the reviewer found the requirement criterion satisfied, not that code is done.

## Requirement completeness

- [ ] CHK001 Is every outcome of an update (added, updated, current, kept) defined, with what it prints? [Completeness, Spec §FR-004]
- [ ] CHK002 Is a failed clone and an unknown argument defined, including what is left on disk? [Edge Case, Spec §FR-005]
- [ ] CHK003 Is the source of the update defined for a created system, for the template itself and for a test? [Completeness, Spec §FR-004, §FR-006]
- [ ] CHK004 Is a skill the template carries without the managed line (`setup-system`, design-delta's stubs) excluded? [Edge Case, Spec §FR-004]

## Requirement clarity

- [ ] CHK005 Is how an owner claims a skill stated in the skill itself? [Clarity, Spec §FR-003]
- [ ] CHK006 Is "nothing init rewrites" a list a test can check? [Measurability, Spec §FR-002]

## Consistency

- [ ] CHK007 Do the skills point at the files that hold each rule rather than restating them? [Consistency, Plan §Design]

## Acceptance criteria quality

- [ ] CHK008 Does the runnable line fail on `develop` and pass after the change? [Measurability, Spec §Success criteria]
- [ ] CHK009 Is every surface the change touches listed in the plan? [Traceability, Plan §Surfaces touched]
