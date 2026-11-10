# Spec: Pin the design-delta engine so a clone of the template installs the same one

## Overview

This is a public template: its promise is that a copy of it builds and gates
the same way for whoever took the copy. Today the engine the gate runs is
declared as `"design-delta": "github:chrisgriffin/design-delta"` — an
**unpinned git reference to a branch head** — and `package-lock.json` resolves
it over **`git+ssh://`**. Both are reproducibility bugs in the one thing a
template is for.

The spec names no version, so a fresh `npm install` in a copy takes whatever
`chrisgriffin/design-delta`'s default branch happens to be at that moment: the
gate can change in a copy with no change to the copy. The lockfile already
disagrees with the declaration — it pins
`f1332b41aea26d92ee3de5a08fd6e35f70da5589` while that branch's HEAD read
`eabc09d1c2b6e409d644cc5de6e4471c670624bb` on 2026-11-09 — so `npm install`
and `npm ci` install different engines, and a copy's owner cannot tell whether
a drift finding is theirs or the engine's.

**This spec takes the engine off git entirely and depends on the published
package.** `design-delta` is on the public npm registry as of
`2026-11-10T03:14:33Z`: `0.27.0` is `latest`, with the matching `v0.27.0` tag
and GitHub Release. So the dependency becomes a registry range, the lockfile
resolves to `https://registry.npmjs.org/…`, and installing the engine needs no
git access, no SSH key and no token at all.

### Why this, and not an immutable git pin

An earlier revision of this spec pinned the git reference instead, because the
registry was not an option yet. Two things changed:

- **The release landed.** The first publish of `design-delta` to npmjs
  completed on 2026-11-09, and `0.27.0` reached the registry on 2026-11-10.
  This spec's own earlier text named that release as the gate on the durable
  fix, and nothing else was holding it.
- **The git pin could not satisfy success criterion 2 as written.** npm writes
  `git+ssh://` into the lockfile for *any* GitHub git dependency, whatever
  `package.json` declares — measured here on 2026-11-09 against
  `git+https://…#eabc09d`. The only git form npm keeps as HTTPS is a codeload
  tarball URL. So pinning the git reference meant dropping criterion 2; the
  registry satisfies it outright.

The git pin is therefore not a smaller first step toward this — it is a
different end state that costs a success criterion. This spec goes straight to
the registry.

### The range, and the trade-off it carries

The dependency is a **caret range on the published version**, `^0.27.0`, not an
exact pin. On a `0.x` package npm reads that as `>=0.27.0 <0.28.0`, so a copy
picks up the engine's patch releases and nothing wider.

The trade-off is explicit: with a caret range and the committed lockfile,
`npm ci` installs exactly the engine this template was gated against, while a
`npm install` from scratch in a copy may take a later `0.27.x` patch. That is
deliberate — `npm ci` is what a copy-taker and CI both run, the engine's `0.x`
line promises no breaking change within a minor, and a copy that never receives
an engine patch is its own failure mode. An exact pin is a one-character change
if that judgment is ever revisited.

## User scenarios

1. **Someone takes the template and runs `npm ci`.** npm fetches the engine
   from the registry over HTTPS, needing no SSH key, no token and no git, and
   gets the exact engine the template was gated against.
2. **Someone takes the template and runs `npm install` from scratch**, with no
   lockfile entry to go on. They get the engine the spec names, within its
   patch line.
3. **The engine releases a new minor.** Updating the template is a deliberate
   one-line change to the range with a green gate behind it, not something that
   happens to a user's copy on a Tuesday.
4. **Someone clones the template onto a machine with no GitHub credentials at
   all.** The install succeeds, because nothing in the dependency tree is
   fetched from git.

## Non-goals

- Any change to what the gate checks, to `design-delta.json`, or to any
  contract, token or component.
- Vendoring the engine into this repo.
- Moving any *other* dependency between sources.
- Changing the engine's own version — the range names what is already published.

## Success criteria

- [ ] **Runnable:** `node -e 'const s=require("./package.json").devDependencies["design-delta"]; if(/^(github:|git\+|git:)/.test(s)){console.error("engine still comes from git:",s);process.exit(1)} console.log(s)'` exits 0. Red on `develop`, where it prints `engine still comes from git: github:chrisgriffin/design-delta` and exits 1.
- [ ] **Runnable:** `node -e 'const l=require("./package-lock.json"); const r=l.packages["node_modules/design-delta"].resolved; if(!r.startsWith("https://registry.npmjs.org/")){console.error("lockfile does not resolve from the registry:",r);process.exit(1)} console.log(r)'` exits 0. Red on `develop`, where it prints the `git+ssh://` URL and exits 1.
- [ ] `npm ci && npm run verify` exits 0, and `drift:verify` reports the same findings at the same severities as `develop` does today. A difference means the published engine differs from the branch build the gate was reading — report it, never silence it with a severity change or an `exemptions` entry.
- [ ] `README.md` and `docs/architecture.md` say the engine comes from the registry and how a copy's owner moves the range deliberately.
- [ ] No `git+ssh://` or `git+https://` entry for `design-delta` remains anywhere in `package-lock.json`.
