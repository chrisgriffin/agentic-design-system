# Plan: A create or init run with an invalid value names the value it refused and why

## Technical context

- `scripts/init.mjs`: the single `ok` expression becomes a `RULES` table (pattern, what it accepts, required). Each refused value is one line, `--flag "value" is not valid: <rule>`, `--flag is missing` or `--flag needs a value`, printed before the usage. Values are quoted with `JSON.stringify`, so an empty value and a line break show. `unknown argument` quotes the same way. The patterns are unchanged.
- `cli/create.mjs`: `accepts()` becomes `initRefusal()`, which reads `--check`'s stderr and returns its reason lines without the usage; the generic `a value is missing or not valid: …` line is kept only for an init that gives no reason. Both the first check and the clone's check print it.
- `cli/create.test.mjs`: tests for each; two existing tests (#49 `--author` with no value, #52 unknown argument) now expect the named reason and the quoted argument.

## Surfaces touched

- `scripts/init.mjs`, `cli/create.mjs` — refusal text (a published command's output; no flag, exit code or accepted value changes).
- `cli/create.test.mjs` — new and updated tests.
- `docs/architecture.md` — both paragraphs describing the checks.
- README: unchanged, it does not describe refusal text.
- none of `CLAUDE.md` § Architecture's couplings; no workflow, Routine, cron, ruleset or vault note; no CHANGELOG entry by hand (release tooling writes it).
