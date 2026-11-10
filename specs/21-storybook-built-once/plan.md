# Plan: A pull request builds the Storybook once in the template's own checks, not twice

## Technical context

- Route (a) of the issue: `package.json`'s `verify` drops its last step, `&& npm run build-storybook`. `storybook-check.yml` already runs `npm run build:tokens && npm run build-storybook`, so it becomes the only Storybook build on the template's own checkout.
- `init-check.yml` runs `scripts/init.mjs`, whose own `npm run verify` was what built the renamed copy's Storybook. The script gains `run("npm run build-storybook")` right after `run("npm run verify")`: `execSync` throws on a non-zero exit, so a failed build stops the script before its removals and `test ! -f scripts/init.mjs` in the check fails too. Putting the step in the script rather than the workflow keeps the plan's rule that a failed gate leaves the script in place for a second run, and a person running the script on their copy gets the same guarantee the check does.
- The init check's existing greps already exclude `storybook-static`, so the build output there changes nothing.
- A copy keeps `build-check.yml` and `storybook-check.yml`, so its pull requests also build the Storybook once.

## Surfaces touched

- `package.json` — `verify` loses `build-storybook`.
- `scripts/init.mjs` — builds the Storybook after `verify`; the usage text and the closing message say so.
- `.github/workflows/storybook-check.yml` — comment only: it is the Storybook gate. No job renamed, so no required check name changes and the branch rulesets are untouched.
- `.github/workflows/init-check.yml` — comment only: the script runs the verify chain and the Storybook build. `build-check.yml` is unchanged: its comment names no chain step.
- `docs/testing.md` — the verify chain is six steps; `storybook-check.yml` (`storybook / ci`) is named as the Storybook gate.
- `CLAUDE.md` — the `verify` command line and the CI paragraph say Storybook builds only in its own check.
- `README.md` — "Starting your own" says the script builds the Storybook after `verify`; the Development block drops `build-storybook` from the `verify` chain.
- `docs/architecture.md` — the gate sentence lists six steps plus the Storybook check.
- `specs/3-storybook/spec.md`, `specs/6-init-script/spec.md` — the passages that put `build-storybook` in `verify` say what replaced it (this spec).
- cost — saves one Storybook build per pull request push (about a minute of a billed runner each); no trigger, cron or agent fire added.
- none else — no directory added, no published surface (the package is private), no reusable workflow body, Routine, vault note or Mac-installed file.
