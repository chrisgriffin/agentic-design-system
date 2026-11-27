# Spec: The gate asserts accessibility, not just a Storybook panel

## Overview

Accessibility is claimed and never checked. `README.md` says "Docs and accessibility checks come from `@storybook/addon-docs` and `@storybook/addon-a11y`", `docs/architecture.md` says `.storybook/` "runs Storybook on Vite with docs, accessibility checks and a theme toggle", and `.storybook/main.ts` does load `@storybook/addon-a11y`. But that addon is a panel: it reports in a browser, to a person who is looking at it. Nothing fails.

`npm run verify` is `build:tokens → prettier:check → lint → lint:styles → drift:verify → test`, and `npm test` runs five component assertions across `badge`, `button` and `card` — every one of them a class-name or slot assertion. No assertion in the repo is about a role, a name, contrast or any other accessibility property. A component can regress to a `div` with a click handler and the gate stays green.

That matters more here than in an ordinary app. This is a public template, and `scripts/scaffold-component.mjs` writes the test file every new component starts from: whatever that template asserts is what a copy-taker's components will assert for as long as they use it. Today it asserts a class name. So the gap reproduces itself with every component anyone scaffolds.

`axe-core` is already resolved in the tree at `4.14.0`, pulled in by `@storybook/addon-a11y`, so the checking engine is present — it is simply never run outside the browser.

## User scenarios

- A contributor changes a component so that it no longer exposes an accessible name; `npm run verify` fails, locally and in `build / ci`, and the failure names the component and the rule.
- Someone runs `npm run scaffold -- my-thing`, and the test file they get already contains an accessibility assertion, so their first component is covered without them thinking about it.
- Someone reads the README's accessibility sentence, runs the gate, and finds that the claim is something the gate enforces rather than something a panel displays.

## Functional requirements

- FR-001: Each of the three component directories — `badge`, `button`, `card` — has an automated accessibility assertion that runs under `npm test`, covering its default rendering and each distinct variant its contract declares as a `code` prop. `card-header` has a contract but no directory of its own and is only ever rendered inside a `Card`, so its coverage is the `card` test's.
- FR-002: The assertion runs `axe-core` against the rendered DOM in jsdom and fails on any violation it reports, printing the rule id and the element for each. One rule is excepted: `color-contrast`, which jsdom cannot evaluate because it has no layout or computed colour. It is switched off explicitly, so the output records that it did not run rather than implying it passed.
- FR-003: `axe-core` is a direct `devDependency` with an explicit range, not relied on as a transitive one, so an upstream change to `@storybook/addon-a11y` cannot remove it.
- FR-004: `scripts/scaffold-component.mjs`'s test template includes the accessibility assertion, so a scaffolded component is covered from its first commit.
- FR-005: The assertion helper lives in one place that every component test imports, so adding a component means one import and one call, not a copied block.
- FR-006: No violation found on an existing component is suppressed to make the suite pass. If one of `badge`, `button` or `card` has a real violation, it is fixed in the component or its stylesheet; a rule is disabled only with a comment saying why that rule cannot apply here, and never to hide a finding.
- FR-007: `README.md`, `docs/architecture.md`, `docs/testing.md` and `CLAUDE.md` say what the gate asserts about accessibility and what the Storybook addon still does, so the two are no longer conflated.

## Success criteria

- [ ] **Runnable:** `node -e 'const fs=require("fs");const miss=["badge","button","card"].filter(n=>!fs.readFileSync(`components/${n}/${n}.test.tsx`,"utf8").includes("expectNoViolations"));if(miss.length){console.error("no accessibility assertion in: "+miss.join(", "));process.exit(1)}' && npx vitest run components` exits 0. Red on `develop` today, where it exits 1 printing `no accessibility assertion in: badge, button, card`. The plain `npx vitest run components` is deliberately not the runnable line: it already exits 0 with five class-name tests, so it would prove nothing.
- [ ] Breaking a component's accessible name fails `npm run verify`, and the failure names the component and the axe rule. Record the failure output in the pull request.
- [ ] `npm run scaffold -- scratch-thing` writes a test file containing the accessibility assertion; the scaffolded directory is deleted again before committing.
- [ ] `axe-core` appears in `package.json`'s `devDependencies`.
- [ ] Any violation found on an existing component is fixed in that component, not suppressed. The pull request lists every violation found and what was done about each.
- [ ] `README.md`, `docs/architecture.md`, `docs/testing.md` and `CLAUDE.md` distinguish what the gate asserts from what the Storybook addon shows.

## Out of scope

- Colour-contrast checking, which axe cannot evaluate in jsdom (it has no layout or computed colour). Say so where the docs name what is covered, rather than implying a check that does not run.
- Keyboard-interaction tests beyond what axe asserts statically. Worth having, and a separate ticket. Done in [`specs/29-button-keyboard`](../29-button-keyboard/spec.md) (#29).
- The Storybook a11y addon's own configuration. It stays exactly as it is; this adds a gate beside it and does not replace it.
- `tsc` not running in the gate, which is its own ticket.
