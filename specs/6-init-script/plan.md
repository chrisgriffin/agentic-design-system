# Plan: An init script turns a fresh copy of the template into a named design system

## Technical context

- One Node script with no dependencies: a directory walk skipping `node_modules`, `.git`, `.design-delta`, `storybook-static`, `package-lock.json`, `specs` and `tokens/css`; an ordered swap list (the owner-and-name URL forms first, then the bare name, then the prefix forms); a JSON edit for `design.files`; a regex that drops the README section; then `npm install` (only without `node_modules`), `npx design-delta dock`, Prettier and `npm run verify` with inherited stdio, and the removals last, so a failed gate leaves the script in place for a second run.
- `init-check.yml` is a thin stub of the reusable Node CI, job `init`, whose `run` is the script with sample values plus two assertions; the script's own verify run is the gate.
- The README gains a "Starting your own" section that the script removes; `docs/testing.md` names the `init / ci` check and `docs/architecture.md` names the script.

## Surfaces touched

- `scripts/init.mjs`, `.github/workflows/init-check.yml`: new.
- `README.md`: the section; `docs/testing.md` and `docs/architecture.md`: the check and the script.
- `.github/CODEOWNERS`: the one-line form.
- the branch ruleset — not required: `init / ci` runs on every PR but the ruleset stays as Build 5 leaves it.
- the vault's System Map section for this repo — unchanged.
- No Routine, cron or Mac-installed file.
