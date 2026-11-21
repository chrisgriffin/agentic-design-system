# Spec: A create or init run with an invalid value names the value it refused and why

**Issue**: [#56](https://github.com/chrisgriffin/agentic-design-system/issues/56)

## Overview

When the create command or the init script refuses a value, the refusal never says which value or why: init prints only its usage, and create prints every value it was given. The person has to guess what to fix.

## User scenarios

- Someone passes `--prefix Bad`: the refusal says `--prefix "Bad" is not valid` and what a prefix may be.
- Someone runs create with a bad value: it shows the same reason init gives, before the clone and after it.
- An empty argument (an unset `"$EXTRA"`) is refused visibly, as `""`.

## Functional requirements

- FR-001: `scripts/init.mjs` checks each value on its own and prints, one line per refused value, the flag, the value quoted, and what it accepts; a missing required value is named as missing; then the usage.
- FR-002: The patterns keep their one home in `scripts/init.mjs`.
- FR-003: `cli/create.mjs` shows init's reason in place of its generic line, on the first check and on the cloned copy's check; a template whose init gives no reason still gets the generic line.
- FR-004: An unknown argument is shown quoted, so an empty one is visible.

## Success criteria

- [ ] A refused value is named in the refusal: running init with one invalid value prints that flag and the value it was given, and a short statement of what is accepted. **Runnable:** `node scripts/init.mjs --check --name sample-system --prefix Bad --owner sample-owner 2>&1 | grep -c "Bad"` prints 1 or more (it prints 0 on `develop` today, where only the usage text is shown).
- [ ] The create command shows the same reason init gives when it refuses a value, both on the first check and on the cloned copy's check, and a test in `cli/create.test.mjs` covers it.
- [ ] A refused empty argument is visible in the message (shown quoted), and a test covers it.
- [ ] Valid values are still accepted exactly as before: `npm test` passes.

## Out of scope

- Changing which values are accepted.
- Create's own refusals (`unknown option`, `needs a value`), which already name the flag.
