# Spec: the design system serves itself to an agent over one MCP server

## Overview

design-delta already serves a project's contracts, tokens and drift over MCP, but it answers only what the gate checks: it cannot say how to use a component, what a token looks like in each theme, or what rules the system holds. This adds the design system's own MCP server, `npm run mcp`, which answers those three and passes every design-delta tool through, so an agent connects to one server, not two. A committed `.mcp.json` connects it, in this repository and in every system the create command makes.

## User scenarios

- An agent in a created system connects through `.mcp.json` and lists one server's tools: the design system's own and design-delta's.
- It asks how to use `badge`: it gets the folder to import from, the names it exports and its stories, each a working example.
- It asks for the accent colors: it gets each semantic token's value in the light theme and the dark one, read from the token sources as they are now.
- It asks for the rules: it gets the system's invariants and a component directory's shape, read from `CLAUDE.md`.
- It asks for `badge`'s contract or the current findings: the server answers with design-delta's own result.

## Functional requirements

- FR-001: `scripts/mcp.mjs` is an MCP server over stdio (newline-delimited JSON-RPC 2.0: `initialize`, `ping`, `tools/list`, `tools/call`), run by `npm run mcp`, with no new dependency. It writes nothing but protocol lines to stdout and never writes to disk.
- FR-002: `get_component_usage` (`id`) returns the component's folder under `components/`, the names its `index.ts` exports (values and types apart) and its stories file; an unknown id is an error that lists the known ones.
- FR-003: `get_theme_tokens` (optional `prefix`) returns every semantic token's name, category, type and value in the light and dark themes, from the token sources on each call, the same values the Storybook Tokens page shows.
- FR-004: `get_rules` returns `CLAUDE.md`'s "Non-negotiable invariants" and "Component directory shape" sections, read on each call; with neither there, it is an error saying so.
- FR-005: every design-delta MCP tool is listed beside these and answered by running `design-delta mcp` behind the server; when design-delta cannot start, the server's own tools still answer and a design-delta tool's call is an error naming why.
- FR-006: `.mcp.json` names the server; init renames it with the rest of the system, and keeps the server, the script and the test in a created system.

## Success criteria

- [x] An MCP client connected to `npm run mcp` lists `get_component_usage`, `get_theme_tokens`, `get_rules` and design-delta's tools, and gets an answer from each kind.
- [x] `get_theme_tokens` gives a color token different values in light and dark.
- [x] A created system's `.mcp.json` names the server by the system's name, and its gate runs the server's test.
- [x] **Runnable:** `node --test scripts/mcp.test.mjs` passes (on `develop` it fails: `scripts/mcp.test.mjs` does not exist), and `npm test` stays green.

## Out of scope

- A tool that writes: an agent has `npm run scaffold`, and the gate's hooks.
- Hosting, auth or a network transport: local stdio only, as design-delta's is.
- Changing design-delta's tools or their answers.
