# Spec: A created system's docs say where its own specs live

**Issue**: [#45](https://github.com/chrisgriffin/agentic-design-system/issues/45)

## Overview

`create` and `init` already remove the template's `specs/` (#49, PR #50). What is left is the written record: the only line in `docs/architecture.md` that mentions `specs/` sits inside an `<!-- init -->` pair, which `scripts/init.mjs` strips from every copy, and the README's mention goes with the "Starting your own" section. So a new system's docs never say where its own specs will live.

## User scenarios

- The owner of a system made with `create` or `init` reads `docs/architecture.md` and learns that the system's own specs go in `specs/`, starting empty.

## Functional requirements

- FR-001: `docs/architecture.md` § Everything else in the repo carries a passage, outside every `<!-- init -->` … `<!-- /init -->` pair, saying where a system's own specs live.
- FR-002: The marked bullet describing the template's own `specs/` stays exactly as it is.

## Success criteria

- [ ] `docs/architecture.md` says where a system's own specs live, in a passage outside every `<!-- init -->` … `<!-- /init -->` pair, so it survives `create` and `init`.
- [ ] The marked bullet describing the template's own `specs/` is unchanged.
- [ ] **Runnable:** `node -e 'const r=require("fs").readFileSync;const strip=s=>s.replace(/<!-- init -->[\s\S]*?<!-- \/init -->/g,"");console.log((strip(r("docs/architecture.md","utf8")).match(/specs/gi)||[]).length)'` prints `1` or more (it prints `0` on `develop` today).
- [ ] `npm run verify` exits 0.

## Out of scope

- Removing the template's `specs/` from a copy, and the init check that fails when it survives: delivered by #49 / PR #50.
- The README: its only mention lives in the "Starting your own" section, which is about the template and goes with it.
