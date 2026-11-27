# Plan: the design system serves itself to an agent over one MCP server

## Technical context

Node 22, ES modules, no new dependency. design-delta 0.27 ships `design-delta mcp`, a hand-rolled stdio JSON-RPC server (protocol `2024-11-05`) whose module is not in its package `exports`, so it is reached as a child process, through its `bin`. `tokens/scripts/build-manifest.mjs` already computes each semantic token's value per theme for the Storybook Tokens page.

## Design

- `scripts/mcp.mjs`: reads stdin lines, answers each request with one stdout line. Own tools are handled in-process; any other tool name is forwarded to a `design-delta mcp` child started on first need (its `bin` resolved from `import.meta.resolve("design-delta")`), after an `initialize` handshake. `tools/list` is the own tools then the child's, less any child tool named like an own tool. The handshake and each forwarded call time out (`MCP_DELTA_TIMEOUT_MS`, 30 s) with an error, so a hung child never stops the own tools; the child's failure is read on `close`, after its stdout drains. A line that is not a JSON-RPC object is `-32600`.
- `get_theme_tokens` runs `build-manifest.mjs` in a fresh `node` each call, so an edited token source is read, not a cached import.
- `get_component_usage` reads `components/<id>/index.ts` and `<id>.stories.tsx`; the id must be a kebab-case folder that exists.
- `get_rules` cuts the two `##` sections out of `CLAUDE.md`.
- Results follow design-delta's form: one text content item holding JSON, `isError` on an error.
- `package.json`: `"mcp": "node scripts/mcp.mjs"`, and `scripts/*.test.mjs` in `test`, which init keeps.
- `.mcp.json`: `{ "mcpServers": { "agentic-ds": { "command": "node", "args": ["scripts/mcp.mjs"] } } }`; init's name rewrite renames the key.
- `scripts/mcp.test.mjs`: spawns the server and speaks the protocol to it.

## Surfaces touched

- `README.md` — the Agent layer section names the server, `.mcp.json` and its tools.
- `CLAUDE.md` — the Agent layer line on design-delta's MCP names the system's server instead, which serves design-delta's tools too.
- `docs/architecture.md` — a passage on `scripts/mcp.mjs` and `.mcp.json`.
- `docs/testing.md` — a `scripts/mcp.test.mjs` entry; the init-manifest entry if its assertions change.
- `.claude/skills/setup-system/SKILL.md` — none: it reads `CLAUDE.md` and the docs, which carry the change.
- Published surface: none — the packed create command's files are unchanged; the server ships through the cloned template.
- CI, required checks: none — the test runs inside `npm test` in `build / ci` and in `init / ci`'s created copy.
