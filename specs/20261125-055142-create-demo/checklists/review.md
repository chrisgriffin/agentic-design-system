# Review checklist: npm run demo shows the create command in action

Purpose: requirements quality for a PR reviewer. Depth: Standard. Created at grooming.

`[x]` means the reviewer found the requirement well written, not that the work is done. `/speckit-implement` reads these marks and never changes them.

## Requirement completeness

- [x] CHK001 Is where the demo folder lives, and its name, specified? [Completeness, Spec §FR-001]
- [x] CHK002 Is what the demo prints at the end specified? [Completeness, Spec §FR-004]
- [x] CHK003 Is a created system's lack of the demo script a stated requirement, not only an assumption from `cli/` being removed? [Completeness, Spec §FR-005]

## Requirement clarity

- [x] CHK004 Is "fresh folder" defined as removed and recreated on every run? [Clarity, Spec §FR-001]
- [x] CHK005 Is the order of the demo's own arguments and the passed-through ones, and which wins, stated? [Clarity, Spec §FR-002]
- [x] CHK006 Is "uncommitted changes" defined by a concrete check? [Clarity, Spec §FR-003]

## Requirement consistency

- [x] CHK007 Do the success criteria and the functional requirements describe the same behavior, with none left out? [Consistency, Spec §Success criteria]

## Acceptance criteria quality

- [x] CHK008 Is there a runnable criterion with an expected count and a red state on `develop`? [Measurability, Spec §Success criteria]
- [x] CHK009 Is the live-prompt criterion one a reviewer can check, given tests run with no terminal? [Measurability, Spec §FR-001] — the terminal is passed through (`stdio: "inherit"`), so the create command's own prompt behavior, covered by `cli/create.test.mjs`, applies; the PR shows a run under a terminal.

## Scenario and edge case coverage

- [x] CHK010 Is the exit code specified when the create command refuses a value or fails? [Coverage, Exception Flow, Spec §FR-004]
- [x] CHK011 Are demoing uncommitted work and answering the prompts for the viewer explicitly out of scope? [Coverage, Spec §Out of scope]
