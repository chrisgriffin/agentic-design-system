# Spec: a fresh copy's drift audit lists only actionable findings

**Issue**: [#35](https://github.com/chrisgriffin/agentic-ds/issues/35)

## Overview

`npm run drift:audit` on `develop@57615fc`, with `tokens/css` built, prints `0 error(s), 0 warn(s), 50 review(s)`: 27 `tokens/token-unreferenced` (semantic tokens no example component uses) and 23 `tokens/token-unemitted` (primitives nothing aliases). With no `tokens/css`, the same 50 all read `tokens/token-unreferenced`. A copy `scripts/init.mjs` renamed reports the same 50 in either state. The decision on the issue thread is to keep the full palette and record it as deliberate, using the engine's own tier option for the primitives.

## User scenarios

- Someone creates a system from the template, runs `npm run drift:audit`, and reads `0 review(s)`, so the first finding they see is one their own change caused.
- The same person builds a fourth component on `color.bg.surface`; the audit reports that token's entry as `coverage/stale-exemption`, and they delete the line.
- They add a semantic token and use it nowhere; the audit reports it.

## Functional requirements

- FR-001: `design-delta.json` sets `tokens/token-unreferenced`'s `ignoreSources` to the primitive directory, which scopes `tokens/token-unemitted` too, so an unaliased primitive is not reported whether or not `tokens/css` is built.
- FR-002: each semantic token no component uses is an `exemptions` entry under `tokens/token-unreferenced`, by its literal id, with `decision: "accepted"` and a `reason`; no glob, so a copier's new semantic token is never covered.
- FR-003: the README's Tokens section states the choice once; the config's `_doc` keys point at it.
- FR-004: `cli/init-manifest.test.mjs` fails when the template's audit, or an init'd copy's before and after its token build, reports any finding.

## Success criteria

- [x] A fresh checkout reports no drift finding that is not actionable: either the tokens are gone, or each remaining group is covered by a `design-delta.json` `exemptions` entry carrying a `decision` and a `reason`.
- [x] The choice is written down where a copier reads it, not only in the config.
- [x] **Runnable:** `npm run drift:audit` prints `0 review(s)` (red on `develop` today: `48 review(s)`).

## Out of scope

- Trimming the token tree (the option the decision rejected).
- `/setup-system`'s example removal, which can leave tokens only a removed example used; the audit reports those, as it should.
- The engine: an `exemptions` entry does not follow a finding from `tokens/token-unreferenced` to `tokens/token-unemitted` when `tokens/css` appears, which is why the primitives use the rule option instead. Filed as [chrisgriffin/design-delta#43](https://github.com/chrisgriffin/design-delta/issues/43).
