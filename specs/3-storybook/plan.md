# Plan: Storybook with Tokens and Design Drift pages, published to GitHub Pages

## Technical context

- Storybook 10 on `@storybook/react-vite`; the Vite config it inherits is the repo's `vite.config.ts` (React plugin, Vitest settings). `viteFinal` adds two `define` constants: the manifest (imported from `tokens/scripts/build-manifest.mjs`, computed in memory) and the audit JSON (`execFileSync` of the installed `design-delta`), so the pages hold no second copy of either.
- The theme toggle is `withThemeByDataAttribute` from `@storybook/addon-themes`, setting `data-theme` to `light` or `dark` on the root, which is what the token CSS keys off.
- The two pages live in `.storybook/pages/` as plain stories (`Tokens/Tokens`, `Design Drift/Audit`), styled by one CSS Module of tokens; `.storybook/globals.d.ts` types the two constants and `*.module.css`.
- Fonts come from Google Fonts links in `preview-head.html`, no dependency.
- `storybook-check.yml` is a thin stub of the reusable Node CI, job `storybook`, no CLAUDE.md or docs inputs. `deploy-pages.yml` is the standard Pages workflow (checkout, Node, `npm ci`, build, `upload-pages-artifact`, `deploy-pages`); the repo's Pages source is already GitHub Actions.
- Telemetry is off in `main.ts`.

## Surfaces touched

- `package.json`: `storybook` and `build-storybook` scripts, `verify` ends with the build, three addon dev dependencies.
- `.storybook/`: new. `.gitignore`: `storybook-static/`. `tsconfig.json` and `eslint.config.mjs`: `.storybook` included, the two constants as globals.
- `.github/workflows/storybook-check.yml` and `deploy-pages.yml`: new stubs. No ruleset change in this PR.
- `README.md`: the Storybook section.
- No vault note, Routine or cron.
