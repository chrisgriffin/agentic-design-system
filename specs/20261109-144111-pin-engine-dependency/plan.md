# Plan: Take the design-delta engine from the npm registry

## Technical context

- Node ESM template; `npm run verify` runs `design-delta verify` as `drift:verify`.
- Today: `devDependencies["design-delta"] = "github:chrisgriffin/design-delta"`;
  lockfile `resolved = git+ssh://git@github.com/chrisgriffin/design-delta.git#f1332b41…`.
- `design-delta` **is on the public npm registry**: `latest` is `0.27.0`,
  published `2026-11-10T03:14:33Z`, with the matching `v0.27.0` tag and GitHub
  Release. (The registry read `404` on 2026-11-09; the first publish landed
  between the two readings, which is what makes this revision possible.)
- There is no `.npmrc` in this repo and there must not need to be: every
  dependency is public npm, which is what keeps a fork's CI working. This
  change moves the last non-registry dependency onto that footing.

## Design decisions

1. **Depend on the published package, not on git.** A registry range is the
   only form that satisfies both success criteria at once: npm writes
   `git+ssh://` into the lockfile for any GitHub git dependency whatever
   `package.json` declares (measured 2026-11-09 against
   `git+https://…#eabc09d`), so every git form fails criterion 2.
2. **A caret range, `^0.27.0`, not an exact pin.** On a `0.x` package npm reads
   this as patch-only within the minor. `npm ci` against the committed lockfile
   is exact, which is what a copy-taker and CI both run; the range is what lets
   a copy receive engine patches. The trade-off is stated in `spec.md`.
3. **Regenerate the lockfile rather than hand-editing it.** A hand-edited
   `resolved` works until someone runs `npm install`.
4. **The findings must not move.** The engine is changing source, not version —
   `0.27.0` is the release cut from the same line the branch build came from —
   so any change in `drift:verify`'s output is the finding to report, not to
   silence.
5. **No git fallback is left behind.** A stray `git+` entry for the engine
   anywhere in the lockfile would reintroduce the SSH path on the next install,
   so its absence is a success criterion of its own.

## Surfaces touched

- a published surface — `package.json`'s dependency declaration is part of what this template publishes, so `README.md` § how the gate runs and `docs/architecture.md` both say the engine comes from the registry and how to move the range.
- `docs/releasing.md` — it describes how a release is cut; if it names the engine's version or how it is fetched, that line moves with this change.
- `docs/adr/` — a record: this template takes its engine from the public npm registry with a caret range, superseding the earlier intent to pin an immutable git reference, and saying why the git form could not hold.
- `scripts/init.mjs` — it turns a copy into a named system. If it rewrites or validates the engine dependency, the registry form has to be what it writes, and its test extends to cover that.
- a rule stated in more than one doc — `CLAUDE.md` § CI states the gate and § Agent layer states where the engine's skill comes from. The rule stays in `CLAUDE.md`; the README stays a pointer, not a second copy.
- cost — none. No workflow trigger, cron or scheduled function changes.
