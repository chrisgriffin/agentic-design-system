# Plan: Agent layer: the docked design-delta skill and hook, the guard hooks, a scaffold script and the rulebook

## Technical context

- `design-delta dock` is run once and its three files committed as written; the dock hook shells out to `npx design-delta verify --json` and exits 2 on `ok: false`.
- The two guard hooks are the public precedent's, with `post-edit-check.sh` gaining a `*.css` case: Prettier, then Stylelint with the token rule's message.
- `.claude/settings.json` is the precedent's permissions plus `npx stylelint` and `npx design-delta`, and three hooks: `bash-guard.sh` on Bash, `post-edit-check.sh` and the dock hook on Edit, Write and MultiEdit.
- The scaffold script holds six inline templates (the shape of `components/badge` with one `children` prop and one token-styled class), then runs the engine's `scaffold` with `--json` and moves `output` into the directory. The engine writes the draft at `<contractsDir>/<id>.contract.json`, which is why the move exists.
- `CLAUDE.md` follows the public precedent's shape: commands, invariants, directory shape, a couplings table, the agent layer, CI. It links the README for prose and names no fleet rule.

## Surfaces touched

- `.claude/`: new (settings, three hooks, two skill stubs). `CLAUDE.md`, `scripts/scaffold-component.mjs`: new.
- `package.json`: the `scaffold` script.
- `README.md`: the Agent layer section.
- No workflow, ruleset, vault note, Routine or cron.
