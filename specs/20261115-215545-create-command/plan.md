# Plan: One command creates a named design system from the template

## Technical context

- One Node script, `cli/create.mjs`, with no dependencies, named by `bin` in `package.json`. `npx github:<owner>/<repo>` installs the repo as a package and runs that bin.
- It does not copy the package it was installed as: npm's packing drops `.gitignore`, so a copy made that way would commit `node_modules`. It runs `git clone --depth 1` on the template's `repository.url` instead, which gives exactly the tracked files, removes `.git` and runs `git init`.
- The copy's `scripts/init.mjs` then does the rewrite, the install, the dock, the gate and its own removal, called with `node` and the same flags. It also removes `cli/`, the `bin` entry and the CLI test glob from the copy, so a system made by hand with the init script and one made by the create command are the same tree. The docs passages that name the create command sit inside the `<!-- init -->` markers the script already drops.
- Validation has one home: `scripts/init.mjs --check` validates its values and exits without doing anything, and the create command asks it before writing.
- Questions use `node:readline/promises`, asked only when `process.stdin.isTTY`.
- Credential-free install was the open risk, since `package-lock.json` resolves `@chrisgriffin/config` as `git+ssh://`. Measured on this branch: a created system installs and passes its gate with no token and `GIT_SSH_COMMAND=false`, so the lock file is unchanged.
- Tests: `cli/create.test.mjs` under `node --test` covers arguments, the two refusals, the missing-flag exit and the clone, with the hand-off skipped by an internal `--no-init` flag and the template taken from the checkout by an internal `--from`. The end-to-end run (install, gate) is the CI step, with no token and `GIT_SSH_COMMAND=false`.

## Surfaces touched

- `cli/create.mjs`, `cli/create.test.mjs`: new. `package.json`: `bin`, and `cli/*.test.mjs` added to the `test` script.
- `scripts/init.mjs`: the `--check` flag; removes `cli/`, the `bin` entry and the CLI test glob from a copy.
- `.github/workflows/init-check.yml`: one more command in the existing job's `run`. cost: none new, the job already runs once per PR push; the added step is one more install and gate, about two minutes.
- `README.md`: "Starting your own". `docs/architecture.md`: the `cli/` directory. `docs/testing.md`: the new test file and the CI step. `CLAUDE.md`: unchanged, since its command list is for work inside a system and the create command runs outside one.
- `CHANGELOG.md`: written by the release PR from the commit, not by hand.
- `package-lock.json`: unchanged.
- The branch ruleset: unchanged; `init / ci` is already the check name.
- The vault's System Map entry for this repo: one line saying the template has a create command, recorded in the PR body.
- No Routine, cron or Mac-installed file.
