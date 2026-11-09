# Plan: The README says scripts/init.mjs exists, and init.mjs carries no swap that matches nothing

## Technical context

- `README.md` line 12: rewrite the `<!-- init -->` passage to say the script turns a copy into a named system and link the "Starting your own" section. The markers stay, so `init.mjs` still removes it from a copy and `init-check.yml`'s Markdown assertion still holds.
- `scripts/init.mjs`: delete the one swap entry. A repo-wide search finds its text only in `init.mjs`, which the walk skips.

## Surfaces touched

- `README.md` — the intro's init passage, rewritten inside its markers.
- `scripts/init.mjs` — one swap entry removed; no flag, output or published surface changes.
- `docs/testing.md`, `docs/architecture.md` — read; neither names the removed swap, so unchanged.
- none of `CLAUDE.md` § Architecture's couplings (no prefix, font, mode, component, job name or badge change); no Routine, cron, workflow, ruleset or vault note.
