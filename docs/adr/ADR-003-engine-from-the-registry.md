---
status: accepted
date: 2026-11-10
---

# ADR-003: The design-delta engine comes from the public npm registry, on a caret range

## Context

The gate is only as reproducible as the engine it runs, and a copy of this template has to gate the same way for whoever took it. The engine was declared as `github:chrisgriffin/design-delta`, a branch head with no version, and the lockfile resolved it over `git+ssh://` to a commit that already differed from that head: `npm install` and `npm ci` installed different engines, and a copy's owner could not tell whether a finding was theirs or the engine's ([#15](https://github.com/chrisgriffin/agentic-design-system/issues/15)).

Two fixes were on the table. One pinned the git reference to an immutable commit. It cannot keep git out of the lockfile: npm writes `git+ssh://` there for any GitHub git dependency, whatever `package.json` declares (measured against `git+https://…#eabc09d` on 2026-11-09), and the only git form npm keeps as HTTPS is a codeload tarball URL. The other depended on a published package, which was not possible until `design-delta` `0.27.0` reached the public npm registry on 2026-11-10.

## Decision

`package.json` declares `"design-delta": "^0.27.0"`, and `package-lock.json` resolves it from `https://registry.npmjs.org/`. No entry for the engine is fetched from git. The range is a caret on a `0.x` version, so npm reads it as patch releases within the minor and nothing wider. Moving to a new minor is a deliberate one-line change to the range, made with `npm install design-delta@^<new>` and a green `npm run verify` behind it.

## Consequences

Installing the engine needs no SSH key, no token and no git access. That claim is the engine's alone: `@chrisgriffin/config` still comes from git (`github:chrisgriffin/config#v1`), and moving it was out of scope here. `npm ci` against the committed lockfile installs exactly the engine the template was gated against; an `npm install` from scratch may take a later patch of the same minor, which is accepted so a copy receives engine fixes. The engine's `0.x` line promises no compatibility (its own `docs/releasing.md` § Versioning), so that later patch can change findings too: the lockfile, not the range, is what holds a copy's gate still. An exact pin is a one-character change if that ever proves wrong. Any new engine release, a patch included, can reclassify findings, as `0.27.0` did when it moved unemitted primitives from `tokens/token-unreferenced` to `tokens/token-unemitted`, so a range move is read against the previous `drift:verify` report, never absorbed with a severity change or an `exemptions` entry.
