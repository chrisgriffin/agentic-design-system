# Spec: Pin the design-delta engine so a clone of the template installs the same one

## Overview

This is a public template: its promise is that a copy of it builds and gates
the same way for whoever took the copy. Today the engine the gate runs is
declared as `"design-delta": "github:chrisgriffin/design-delta"` — an
**unpinned git reference to a branch head** — and `package-lock.json` resolves
it over **`git+ssh://`**. Two consequences follow, and both are reproducibility
bugs in the one thing a template is for.

First, the spec names no version, so a fresh `npm install` in a copy takes
whatever `chrisgriffin/design-delta`'s default branch happens to be at that
moment. The gate can change in a copy with no change to the copy.

Second, the lockfile already disagrees with the engine: it pins
`f1332b41aea26d92ee3de5a08fd6e35f70da5589`, while that branch's HEAD read
`eabc09d1c2b6e409d644cc5de6e4471c670624bb` on 2026-11-09. A template whose
`npm install` and `npm ci` install different engines cannot tell a user whether
a drift finding is theirs or the engine's.

Third, `git+ssh://git@github.com/...` in a lockfile makes `npm ci` reach GitHub
over SSH, which needs a key configured for GitHub even though the repository is
public. The `git+https://` form needs none. This could not be reproduced from
the operator's own container, whose git is proxied — the success criteria below
therefore test the **declared form**, which is readable anywhere, rather than a
failure mode that needs a clean machine.

The durable fix is the registry: once `design-delta` publishes to npmjs, depend
on it from there with a caret range, exactly as chrisgriffin.io#1791 does. That
is gated on its first release, so this spec does the part that is not: pin the
git reference to an immutable one and declare it over HTTPS, and leave a single
named task for the registry swap.

## User scenarios

1. **Someone takes the template and runs `npm ci`.** npm fetches the engine
   over HTTPS, needing no SSH key and no token, and gets the exact engine the
   template was gated against.
2. **Someone takes the template and runs `npm install` from scratch**, with no
   lockfile entry to go on. They still get that same engine, because the spec
   names it.
3. **The engine releases a new version.** Updating the template is a deliberate
   one-line change with a green gate behind it, not something that happens to a
   user's copy on a Tuesday.

## Non-goals

- Publishing `design-delta` to npmjs. That is `chrisgriffin/design-delta#2`.
- Any change to what the gate checks, to `design-delta.json`, or to any
  contract, token or component.
- Vendoring the engine into this repo.

## Success criteria

- [ ] **Runnable:** `node -e 'const s=require("./package.json").devDependencies["design-delta"]; if(/^github:[^#]*$/.test(s)){console.error("unpinned branch-head git spec:",s);process.exit(1)} console.log(s)'` exits 0. Red on `develop`, where it prints `unpinned branch-head git spec: github:chrisgriffin/design-delta` and exits 1.
- [ ] **Runnable:** `node -e 'const l=require("./package-lock.json"); const r=l.packages["node_modules/design-delta"].resolved; if(r.startsWith("git+ssh://")){console.error("lockfile resolves over ssh:",r);process.exit(1)} console.log(r)'` exits 0. Red on `develop`, where it prints the `git+ssh://` URL and exits 1.
- [ ] `npm ci && npm run verify` exits 0, and `drift:verify` reports the same findings at the same severities as `develop` does today.
- [ ] `README.md` and `docs/architecture.md` say how the engine is pinned and how to move it, so a copy's owner can update it deliberately.
- [ ] A task names the registry swap, so the move to npmjs is already written down when `chrisgriffin/design-delta#2` ships rather than being rediscovered.
