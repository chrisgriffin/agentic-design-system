# Tasks: Pin the design-delta engine

## Phase 1 — setup

- [ ] T001 Record today's gate to compare against: `npm ci && npm run drift:verify > /tmp/drift-before.txt 2>&1; echo "exit=$?" >> /tmp/drift-before.txt`
- [ ] T002 Pick the reference: `curl -sfS https://api.github.com/repos/chrisgriffin/design-delta/tags` — take the newest tag if there is one, else `develop`'s current commit sha. Note which, and why, in the PR body.

## Phase 2 — the pin

- [ ] T003 In `package.json`, replace `"design-delta": "github:chrisgriffin/design-delta"` with the explicit HTTPS form at the reference from T002: `git+https://github.com/chrisgriffin/design-delta.git#<tag-or-sha>`.
- [ ] T004 Regenerate the lockfile entry — `rm -rf node_modules package-lock.json && npm install` — and confirm `packages["node_modules/design-delta"].resolved` starts with `git+https://` and carries the T002 reference. Do not hand-edit `resolved`.
- [ ] T005 `npm run verify` and diff `drift:verify` against `/tmp/drift-before.txt`: the same findings at the same severities. A difference means the pin picked a different engine — fix the reference, never a severity and never an `exemptions` entry.

## Phase 3 — polish

- [ ] T006 Check `scripts/init.mjs`: if it writes or validates the engine dependency when turning a copy into a named system, update it to the new form and extend its test.

## Phase 4 — surfaces

- [ ] T007 A published surface: `README.md` and `docs/architecture.md` say how the engine arrives and how a copy's owner moves the pin deliberately.
- [ ] T008 The registry swap, written down now and **left unticked until `chrisgriffin/design-delta#2` publishes to npmjs**: at that point the dependency becomes `"design-delta": "^<version>"` from the registry and the git reference goes away. Do not attempt it before the package exists.
- [ ] T009 `docs/releasing.md` — move any line that names the engine's version or how it is fetched.
- [ ] T010 `docs/adr/` — add the record for pinning by immutable reference, linking the vault's Agentic Design System template note rather than copying it, and link the record from this PR.
- [ ] T011 A rule stated in more than one doc: `CLAUDE.md` § CI and § Agent layer keep the rule; the README stays a pointer, not a second copy.
- [ ] T012 Cost: none. Confirm in the PR body that no trigger, cron, agent fire or scheduled function changed.
