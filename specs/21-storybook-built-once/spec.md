# Spec: A pull request builds the Storybook once in the template's own checks, not twice

**Issue**: [#21](https://github.com/chrisgriffin/agentic-design-system/issues/21)

## Overview

Every pull request builds the Storybook three times: at the end of `npm run verify` in the build check, again in the Storybook check, and once more in the init check's renamed copy. The first two run on the same commit and prove the same thing. `build-storybook` leaves the `verify` chain, so `storybook / ci` is the one Storybook gate for the template's own checkout, and `scripts/init.mjs` builds the renamed copy's Storybook itself after its verify run, so the init check keeps its guarantee. No check is added or removed, so the branch rulesets do not change.

## User scenarios

- A contributor pushes to a pull request and the Storybook builds once for this repo's own checkout, in `storybook / ci`.
- A person runs `scripts/init.mjs` on a fresh copy and the run fails, leaving the script in place, when the renamed copy's Storybook does not build.

## Functional requirements

- FR-001: `npm run verify` runs `build:tokens`, `prettier:check`, `lint`, `lint:styles`, `drift:verify` and `test`; it no longer runs `build-storybook`.
- FR-002: `storybook-check.yml` is unchanged and is the Storybook gate, reporting as `storybook / ci`.
- FR-003: `scripts/init.mjs` runs `npm run build-storybook` after `npm run verify` and before it removes anything, so a failed build exits non-zero with the script still present, and `init / ci` fails.
- FR-004: `docs/testing.md`, `CLAUDE.md`, `README.md` and `docs/architecture.md` say the gate is `verify` plus the Storybook check, and name `storybook / ci` as the Storybook gate.
- FR-005: `specs/3-storybook/spec.md` and `specs/6-init-script/spec.md`, where they say `verify` builds the Storybook, say what replaced it.

## Success criteria

- [x] A push to a pull request builds this repo's Storybook in one of the build check and the Storybook check, not both. **Runnable:** `node -e "const fs=require('fs');const w='.github/workflows/storybook-check.yml';const v=JSON.parse(fs.readFileSync('package.json','utf8')).scripts.verify.includes('build-storybook');const s=fs.existsSync(w)&&fs.readFileSync(w,'utf8').includes('build-storybook');console.log(v&&s?'built twice':'built once');process.exit(v&&s?1:0)"` prints `built once` and exits 0 (prints `built twice` and exits 1 on `develop` today).
- [x] The init check still fails when a copy renamed by `scripts/init.mjs` cannot build its Storybook.
- [x] `docs/testing.md` names the one check that is the Storybook gate, and the spec passage that declared the duplication says what replaced it.

## Out of scope

- Retiring `storybook-check.yml` (the issue's route b): `storybook / ci` is a required check, and the ruleset edit that must land first is an admin step.
- `deploy-pages.yml`, which builds the Storybook on a push to `main`, not on a pull request.
