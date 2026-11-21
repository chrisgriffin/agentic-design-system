# Plan: No spec in the template names the maintainer's private notes or a path inside them

## Technical context

- A text-only edit to existing spec files: each stock list item for the private notes is removed from its list, keeping the rest of the sentence; the three specific lines are reworded to "nothing outside this repo", naming nothing checked.
- 27 files matched on `develop` at the base (24 when filed, plus the folders written since).

## Surfaces touched

- `specs/**/plan.md`, `specs/**/tasks.md` — the 27 matching files, one line each (two in the gate-contract plan).
- `specs/58-no-private-notes-in-specs/` — this spec.
- No code, test, doc outside `specs/`, published surface, workflow, ruleset, Routine, cron or Mac-installed file; none of `CLAUDE.md` § Architecture's couplings.
- cost — none. migration — none: nothing reads these files.
