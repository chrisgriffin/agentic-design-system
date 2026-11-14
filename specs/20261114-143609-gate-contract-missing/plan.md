# Plan: A component with no contract fails the gate instead of only warning

## Technical context

- **Stack**: Node ESM, React 19 + TypeScript, CSS Modules, Vite + Vitest,
  Terrazzo for tokens, `design-delta` as the gate.
- **Gate**: `npm run verify` =
  `build:tokens && prettier:check && lint && lint:styles && drift:verify && test`.
  CI runs it as `build / ci`; `storybook / ci` builds the Storybook.
- **Engine config**: `design-delta.json` at the repo root. It carries
  `$schema`, `design`, `paths` and `conventions` and **no `rules` key**, so
  every rule runs at the engine's default severity.
- **The engine's severity mechanism** is the `rules` object, keyed by rule id,
  each value a bare severity (`"off" | "error" | "warn" | "review"`) or a
  `[severity, options]` pair. The schema calls it "the one severity mechanism
  (ADR-001 D5)", and `^_`-prefixed keys are documentary comments rather than
  rule ids.
- **The rule**: `coverage/uncontracted-component`, surface `coverage`, side
  `code`, default severity `warn`. It already fires correctly; only its
  severity in this repo is wrong.

## Design decisions

### D1 — Raise the severity in config; do not re-implement the check

The engine already detects an uncontracted component and names it precisely.
A hand-rolled coverage test walking `components/` would be a second
implementation of a rule the engine owns, and the two would drift — the exact
failure mode `CLAUDE.md` invariant 2 is about. So the change is one `rules`
entry:

```json
"rules": {
  "_doc": "Severities that differ from the engine's defaults. coverage/uncontracted-component is error here because CLAUDE.md invariant 2 makes the contract the source of truth: a component with no contract is never audited again, which is the drift this template exists to prevent.",
  "coverage/uncontracted-component": "error"
}
```

Verified on `develop@fa99a95` with a contract-less `components/probe/`:
`drift:verify` exits **1** with
`FAIL 1 finding(s) at "error" severity or above`, and the 48 `review`
findings stay at `review`.

### D2 — Pin it with a test that reads the engine's own output

`design-delta.json` is a file anybody can edit, and lowering the entry back to
`warn` would silently restore the hole. So `test-utils/contract-coverage.test.ts`
asserts the behaviour rather than the config value:

- Write a fixture component directory under a temp path inside `components/`
  (an `afterEach` removes it), run `npx design-delta audit --json` in-process
  or by `execFileSync`, and assert the finding for that path comes back with
  `severity: "error"`.
- Name the test exactly **`a component with no contract fails the gate`**, which
  is the string the spec's runnable line counts.
- If running the engine inside Vitest proves too slow or needs a network, fall
  back to reading `design-delta.json`'s `rules` entry **and** asserting the
  engine's registry still carries `coverage/uncontracted-component`, so the
  test fails if the rule is renamed upstream rather than passing vacuously.

### D3 — Scope stays one rule

No `exemptions` entry, no other rule's severity, and nothing about the 27
`token-unreferenced` / 21 `token-unemitted` findings. Those are
[#35](https://github.com/chrisgriffin/agentic-design-system/issues/35)'s
question — a judgment about what a template hands a copier — and a severity
change here would pre-empt it.

### D4 — The directory shape stays out

`CLAUDE.md` says a component directory holds seven files. Only the contract is
invariant 2; a missing `.stories.tsx`, `.figma.tsx` or `index.ts` is a
different question with a different answer (a composed part such as
`card-header` deliberately has no `index.ts` of its own). Requiring them here
would break `card-header` and widen a small ticket into a shape audit.

## File structure

| File                                   | Change                                                         |
| -------------------------------------- | -------------------------------------------------------------- |
| `design-delta.json`                    | add the `rules` object with the one entry and its `_doc`       |
| `test-utils/contract-coverage.test.ts` | **new** — the pinning test from D2                             |
| `README.md`                            | the gate paragraph says a component with no contract fails it  |
| `CLAUDE.md`                            | invariant 2 says the gate enforces it, not just the convention |

## Surfaces touched

- `README.md` — the "fails CI when code and contracts disagree" sentence
  understates the gate once this lands; it says a component with no contract
  fails it too.
- `CLAUDE.md` — invariant 2 names the gate that holds it, and § CI's gate line
  stays accurate.
- `docs/architecture.md` — no directory is added, removed or renamed
  (`test-utils/` already exists and already holds a coverage test), so CI's
  `Check docs/` step needs nothing; checked, not assumed.
- `CHANGELOG.md` — nothing by hand: the release flow writes it from
  conventional-commit history.
- `docs/adr/` — none. This is applying an invariant `CLAUDE.md` already states,
  not deciding anything new.
- a required check name — none changes. The gate stays `build / ci` running
  `npm run verify`, so the branch ruleset is untouched.
- a published surface — none. `design-delta.json` is this repo's own config,
  not an export, and `scripts/init.mjs` rewrites it by name and prefix only, so
  a new `rules` key needs no init change. Confirm that when editing.
- cost — none. No workflow trigger, cron, per-push job or Routine fire changes;
  this adds one assertion to a suite that already runs in the existing gate.
- migration — none. Nothing outside this repo reads this file, and a copier
  running `scripts/init.mjs` gets the stricter gate, which is the point.
- a vault note — none. `grep -rl "agentic-design-system:design-delta.json" AI/`
  has no reader; this repo's config is not named in any living doc's `covers:`.
  Verify in the same session and record the result in the PR body.

## Verification

1. `npm run verify` green on the branch with no component added, and
   `drift:verify` still reporting 0 `error` and 48 `review`.
2. The runnable line: `npx vitest run --reporter=verbose 2>&1 | grep -c "a component with no contract fails the gate"` prints `1`.
3. By hand, once: add a contract-less `components/probe/` with only a `.tsx`, a
   `.module.css` and a `.test.tsx`, confirm `npm run verify` exits non-zero
   naming `coverage/uncontracted-component`, then remove it.
