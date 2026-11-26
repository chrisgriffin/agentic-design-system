# Tasks: the design system serves itself to an agent over one MCP server

## Phase 1: the server

- [x] T001 `scripts/mcp.mjs`: the stdio JSON-RPC loop, `initialize`, `ping`, `tools/list`, `tools/call`
- [x] T002 `scripts/mcp.mjs`: `get_component_usage`, `get_theme_tokens`, `get_rules`
- [x] T003 `scripts/mcp.mjs`: the `design-delta mcp` child, its tools listed and its calls forwarded; its failure an error on its tools only
- [x] T004 `package.json`: the `mcp` script and `scripts/*.test.mjs` in `test`; `.mcp.json`

## Phase 2: tests

- [x] T005 `scripts/mcp.test.mjs`: the tool list, each own tool's answer, an unknown id, a forwarded design-delta call
- [x] T006 `cli/init-manifest.test.mjs`: a created system's `.mcp.json` names the system, and its `test` script runs `scripts/*.test.mjs`
- [x] T007 `npm run verify` green

## Phase 3: surfaces

- [x] T008 `README.md`: the Agent layer section
- [x] T009 `CLAUDE.md`: the Agent layer MCP line
- [x] T010 `docs/architecture.md`: `scripts/mcp.mjs` and `.mcp.json`
- [x] T011 `docs/testing.md`: `scripts/mcp.test.mjs`, and the init-manifest entry
