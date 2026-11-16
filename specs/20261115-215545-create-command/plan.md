# Plan: One command creates a named design system from the template

## Technical context

- One Node script, `cli/create.mjs`, with no dependencies, named by `bin` in `package.json`. `npx github:<owner>/<repo>` installs the repo as a package and runs that bin, so the template the command copies is the package it was installed as: its own folder, one level up from `cli/`.
- The copy is a directory walk with a skip list (`node_modules`, `.git`, `specs`, `storybook-static`, `.design-delta`, `tokens/css`, `cli`), then the `bin` entry is dropped from the copy's `package.json` and `git init` runs. The copy's `scripts/init.mjs` then does the rewrite, the install, the dock, the gate and its own removal, called with `node` and the same flags. `scripts/init.mjs` learns to drop the README passage and the CI step that name the create command, through the `<!-- init -->` markers it already honors.
- Questions use `node:readline/promises`, asked only when `process.stdin.isTTY`. Validation reuses the three patterns `scripts/init.mjs` checks, exported from one place so the two cannot drift.
- Credential-free install is the open risk: `package-lock.json` resolves `@chrisgriffin/config` as `git+ssh://`. The repo is public; whether `npm ci` fetches it without an SSH key is proved by the test below, and fixed in the lock file if it does not.
- Tests: `cli/create.test.mjs` under `node --test` covers arguments, the refusal of a non-empty folder, the missing-flag exit and the copy's contents, with the install skipped by an internal flag. The end-to-end run (install, gate) is the CI step, with `GIT_SSH_COMMAND=false` and no token in that step's environment.

## Surfaces touched

- `cli/create.mjs`, `cli/create.test.mjs`: new. `package.json`: `bin`, and `cli/*.test.mjs` added to the `test` script.
- `scripts/init.mjs`: exports its validation patterns; drops the create passages from a copy.
- `.github/workflows/init-check.yml`: one more command in the existing job's `run`. cost: none new, the job already runs once per PR push; the added step is one more install and gate, about two minutes.
- `README.md`: "Starting your own". `docs/architecture.md`: the `cli/` directory. `docs/testing.md`: the new test file and the CI step. `CLAUDE.md`: the command list, inside its line budget.
- `CHANGELOG.md`: written by the release PR from the commit, not by hand.
- `package-lock.json`: only if the credential-free install needs the `@chrisgriffin/config` entry resolved over https.
- The branch ruleset: unchanged; `init / ci` is already the check name.
- The vault's System Map entry for this repo: one line saying the template has a create command, recorded in the PR body.
- No Routine, cron or Mac-installed file.
