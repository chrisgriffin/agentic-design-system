# Tasks

## Phase 1: Red

- [x] T001 Run the runnable line on `develop`: `grep -c "is next" README.md` prints `1`.

## Phase 2: Build

- [x] T002 `README.md`: the `<!-- init -->` passage describes `scripts/init.mjs` as available.
- [x] T003 `scripts/init.mjs`: drop the `" (scripts/init.mjs does)"` swap entry.
- [x] T009 `evaluator-gate.yml`, `claude-mention.yml`: reword the header comments the swap once scrubbed so a `--fleet` copy keeps a true comment.

## Phase 3: Green

- [x] T004 The runnable line prints `0`; `npm run verify` green.

## Phase 4: Surfaces

- [x] T005 `README.md` — the intro's init passage rewritten inside its markers.
- [x] T006 `scripts/init.mjs` — the swap entry removed.
- [x] T007 `docs/testing.md`, `docs/architecture.md` — checked, nothing names the swap.
- [x] T008 No `CLAUDE.md` § Architecture coupling, Routine, ruleset or vault note touched; the two workflow changes are comments only.
