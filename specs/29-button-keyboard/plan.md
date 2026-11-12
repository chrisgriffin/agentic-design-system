# Plan: Button's tests show it works from the keyboard alone

## Technical context

- `@testing-library/user-event` is already a dev dependency and the file already imports it; `userEvent.tab()` moves focus in jsdom's document tab order, and `userEvent.keyboard("{Enter}")` / `userEvent.keyboard(" ")` dispatch the key to the focused element, including the native button's click activation.
- A disabled `<button>` is not focusable, so `userEvent.tab()` skips it; the disabled test renders a plain focusable `<button>` before it and asserts the first Tab lands on that one and the next never lands on the disabled one.
- `Button` renders a native `<button type="button">` and spreads `disabled`, so no component change is needed: the tests pin behaviour the browser gives for free and fail if a change takes it away.
- No new dependency, file or helper.

## Surfaces touched

- `components/button/button.test.tsx` — three keyboard tests.
- `docs/testing.md` — § What is tested gains a keyboard bullet, apart from the axe bullet.
- `specs/20261111-144012-a11y-in-the-gate/spec.md`, its `checklists/gate.md` — the out-of-scope line and CHK034 point at this spec.
- `CLAUDE.md` § CI's accessibility line — read; it describes axe only and names no keyboard check, so it stays accurate and is left as is.
- `components/button/button.contract.json`, `button.figma.tsx` — no prop or element changes, so untouched.
- cost — none: a few milliseconds of tests inside the existing `npm test`; no trigger, cron or agent fire added.
- none else — no directory added, no published surface, workflow, ruleset, Routine, vault note or Mac-installed file.
