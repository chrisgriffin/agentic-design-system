# Spec: the template runs on design-delta 0.29.0

## Overview

design-delta 0.29.0 is out: its `dock` writes a stub for every packaged skill (authoring, building, tokens, docs, refresh, resolve, adopt, design-side build), routed from the `design-delta` stub, and its styles check now keeps only the background declaration that wins the cascade. The template still pins `^0.27.0`. This moves it to `^0.29.0`, installed with npm 10 so the lock file stays one CI's `npm ci` accepts (#44), commits the stubs `dock` writes, and answers the one new finding: badge's success and danger variants restated the base background, which their contract does not declare.

## Functional requirements

- **FR-001** `package.json` declares `"design-delta": "^0.29.0"` and `package-lock.json` resolves 0.29.0 from the registry, with no other entry changed.
- **FR-002** `.claude/skills/` holds every stub `npx design-delta dock` writes at 0.29.0, as it writes them.
- **FR-003** `design-delta audit` reports no finding on the template.
- **FR-004** The README and `docs/architecture.md` name `^0.29.0` and describe the dock's stubs; ADR-003 keeps its text as written.

## Success criteria

- [x] The template's audit, and an init'd copy's, report no finding on design-delta 0.29.0: `cli/init-manifest.test.mjs`.
- [x] `npm@10 ci --dry-run` accepts the lock file: `init / ci`.
- [x] **Runnable:** `node --test cli/init-manifest.test.mjs` passes (on `develop` with 0.29.0 installed it fails: the audit reports badge's two `styles/binding-unexpected` findings), and `npm test` stays green.
