# Tasks: Take the design-delta engine from the npm registry

## Phase 1 — setup

- [ ] T001 Record today's gate to compare against: `npm ci && npm run drift:verify > /tmp/drift-before.txt 2>&1; echo "exit=$?" >> /tmp/drift-before.txt`
- [ ] T002 Confirm the published version to depend on: `curl -sfS https://registry.npmjs.org/design-delta | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>console.log(JSON.parse(s)["dist-tags"].latest))'`. Note it in the PR body. If it is no longer `0.27.0`, use what `latest` says and say so.

## Phase 2 — the swap

- [ ] T003 In `package.json`, replace `"design-delta": "github:chrisgriffin/design-delta"` with the registry range `"design-delta": "^<version from T002>"`.
- [ ] T004 Regenerate the lockfile — `rm -rf node_modules package-lock.json && npm install` — and confirm `packages["node_modules/design-delta"].resolved` starts with `https://registry.npmjs.org/`. Do not hand-edit `resolved`.
- [ ] T005 Confirm no git fallback survived: `grep -n 'git+ssh\|git+https\|github:' package-lock.json package.json` returns no line naming `design-delta`.
- [ ] T006 `npm run verify`, then diff `drift:verify` against `/tmp/drift-before.txt`: the same findings at the same severities. A difference means the published engine differs from the branch build the gate was reading — report it in the PR body; never change a severity and never add an `exemptions` entry to absorb it.

## Phase 3 — polish

- [ ] T007 Check `scripts/init.mjs`: if it writes or validates the engine dependency when turning a copy into a named system, update it to the registry form and extend its test.
- [ ] T008 Confirm the install needs no credentials: `rm -rf node_modules && npm ci --ignore-scripts` succeeds with no git access in play, since nothing in the tree is fetched from git any more.

## Phase 4 — surfaces

- [ ] T009 A published surface: `README.md` and `docs/architecture.md` say the engine arrives from the public npm registry and how a copy's owner moves the range deliberately.
- [ ] T010 `docs/releasing.md` — move any line that names the engine's version or how it is fetched.
- [ ] T011 `docs/adr/` — add the record: the engine comes from the public npm registry with a caret range. It supersedes the earlier intent to pin an immutable git reference, and says why no git form could satisfy the lockfile criterion. Link the record from this PR.
- [ ] T012 A rule stated in more than one doc: `CLAUDE.md` § CI and § Agent layer keep the rule; the README stays a pointer, not a second copy.
- [ ] T013 Cost: none. Confirm in the PR body that no workflow trigger, cron or scheduled function changed.
