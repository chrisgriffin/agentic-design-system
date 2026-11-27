# Tasks

## Phase 1: Red

- [x] T001 Run the runnable line on `develop`: it fails, since there is no `.storybook/`.

## Phase 2: Build

- [x] T002 Install the three addons with npm 10; `.storybook/main.ts`, `preview.ts`, `preview-head.html`, `globals.d.ts`.
- [x] T003 `.storybook/pages/tokens.stories.tsx` and `design-drift.stories.tsx` over `page.module.css`.
- [x] T004 Scripts, ignore, tsconfig and ESLint edits; README section.
- [x] T005 `storybook-check.yml` and `deploy-pages.yml`.

## Phase 3: Green

- [x] T006 `npm run verify` green; the four pages checked in a browser in both themes; the runnable line prints `built`.
