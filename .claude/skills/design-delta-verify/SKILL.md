---
name: design-delta-verify
description: Check for design-token and component drift with design-delta and fix any findings before finishing a change. Use whenever you edit a component or a design token in this project.
---

# design-delta verify

This project uses `design-delta` to keep component code and
its design contracts in sync. Before treating a change to a component or its
tokens as complete, run:

    npx design-delta verify --json

If the result has `"ok": false`, read the `findings` it reports — or run
`npx design-delta lint --json` for static token-convention issues — fix the
drift, and re-run `verify` until it reports `"ok": true`.
