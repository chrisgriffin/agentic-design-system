# Plan: Pin the design-delta engine

## Technical context

- Node ESM template; `npm run verify` runs `design-delta verify` as `drift:verify`.
- Today: `devDependencies["design-delta"] = "github:chrisgriffin/design-delta"`;
  lockfile `resolved = git+ssh://git@github.com/chrisgriffin/design-delta.git#f1332b41…`.
- `chrisgriffin/design-delta` is **public**, default branch `develop`, at
  `0.27.0` in `package.json` with `publishConfig.registry` = npmjs, and
  **not on npmjs** (`https://registry.npmjs.org/design-delta` → 404 on 2026-11-09).
- There is no `.npmrc` in this repo and there must not need to be: every other
  dependency is public npm, which is what keeps a fork's CI working.

## Design decisions

1. **Pin to a tag if the engine has one, otherwise to the commit.** A tag reads
   better in a template a person is meant to copy; a bare commit is the fallback
   and is no worse than today. Check `GET /repos/chrisgriffin/design-delta/tags`
   before choosing.
2. **Declare it `git+https://`, not `github:`.** The `github:` shorthand is what
   npm expanded into `git+ssh://` in the lockfile; writing the HTTPS form
   explicitly is what keeps it out, and it needs no key for a public repo.
3. **Regenerate the lockfile entry rather than hand-editing it.** A hand-edited
   `resolved` is the kind of thing that works until someone runs `npm install`.
4. **Do not pre-empt the registry swap.** It is one task, T008, and it stays
   unticked until `design-delta#2` ships. Trying to write the npmjs dep now
   would make the gate unrunnable.
5. **The findings must not move.** The engine is being pinned, not changed, so
   any change in `drift:verify`'s output means the pin picked a different engine
   than the one `develop` was gated against — which is the bug, not a surprise.

## Surfaces touched

- a published surface — `package.json`'s dependency declaration is part of what this template publishes, so `README.md` § how the gate runs and `docs/architecture.md` both say how the engine arrives and how to move it.
- `docs/releasing.md` — it describes how a release is cut; if it names the engine's version anywhere, that line moves with the pin.
- `docs/adr/` — a record: this template pins its engine by immutable reference and will move to the npmjs registry when one exists. The fleet-wide decision is the vault's [Agentic Design System template](https://github.com/chrisgriffin/czg-vault/blob/main/Areas/CGIO/Design%20Systems/Agentic%20Design%20System%20template.md) note, linked and not copied.
- `scripts/init.mjs` — it turns a copy into a named system. If it rewrites or validates the engine dependency, the new form has to be what it writes.
- a rule stated in more than one doc — `CLAUDE.md` § CI states the gate and § Agent layer states where the engine's skill comes from. The rule stays in `CLAUDE.md`; the README stays a pointer.
- cost — none. No workflow trigger, cron, agent fire or scheduled function changes.
- not a fleet surface — nothing here is installed on Chris's Mac, no Routine or plugin is touched, no required check name changes, and no `_reusable-*.yml` body moves. `- none` is the wrong claim for the rows above, so each is listed rather than the section left empty.
