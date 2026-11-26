import assert from "node:assert/strict"
import { spawn, spawnSync } from "node:child_process"
import { cpSync, mkdtempSync, readFileSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"
import { createInterface } from "node:readline"
import { after, before, test } from "node:test"
import { fileURLToPath } from "node:url"

// npm run mcp: the design system's MCP server, spoken to over stdio as an
// agent's client would (#94).
const ROOT = fileURLToPath(new URL("..", import.meta.url))

let server
let next = 0
const waiting = new Map()
const request = (method, params) =>
  new Promise(resolve => {
    const id = ++next
    waiting.set(id, resolve)
    server.stdin.write(
      `${JSON.stringify({ jsonrpc: "2.0", id, method, params })}\n`,
    )
  })
// A tool's answer: the JSON its one text item holds, and whether it is an error.
const call = async (name, args = {}) => {
  const { result } = await request("tools/call", { name, arguments: args })
  return { ...JSON.parse(result.content[0].text), isError: result.isError }
}

before(async () => {
  server = spawn(process.execPath, [path.join(ROOT, "scripts/mcp.mjs")], {
    cwd: ROOT,
    stdio: ["pipe", "pipe", "inherit"],
  })
  createInterface({ input: server.stdout }).on("line", line => {
    const message = JSON.parse(line)
    waiting.get(message.id)(message)
    waiting.delete(message.id)
  })
  const { result } = await request("initialize", {
    protocolVersion: "2024-11-05",
    capabilities: {},
    clientInfo: { name: "test", version: "0" },
  })
  const pkg = JSON.parse(readFileSync(path.join(ROOT, "package.json"), "utf8"))
  assert.equal(result.serverInfo.name, pkg.name)
})
after(() => server.stdin.end())

test("one server lists its own tools and design-delta's", async () => {
  const { result } = await request("tools/list")
  const names = result.tools.map(tool => tool.name)
  for (const name of ["get_component_usage", "get_theme_tokens", "get_rules"])
    assert.ok(names.includes(name), names.join(", "))
  for (const name of ["get_contract", "list_tokens", "get_findings"])
    assert.ok(names.includes(name), names.join(", "))
})

test("get_component_usage gives the folder, the exports and the stories", async () => {
  const usage = await call("get_component_usage", { id: "badge" })
  assert.equal(usage.isError, false)
  assert.equal(usage.importFrom, "components/badge")
  assert.deepEqual(usage.exports, { values: ["Badge"], types: ["BadgeProps"] })
  assert.equal(usage.stories.file, "components/badge/badge.stories.tsx")
  assert.match(usage.stories.source, /export const Accent/)
})

test("an unknown component is an error that lists the known ones", async () => {
  const usage = await call("get_component_usage", { id: "../tokens" })
  assert.equal(usage.isError, true)
  assert.ok(usage.knownIds.includes("badge"), usage.knownIds)
})

test("get_theme_tokens gives a color a value per theme, and the rest one value", async () => {
  const { tokens, isError } = await call("get_theme_tokens", {
    prefix: "--ads-color-accent-default",
  })
  assert.equal(isError, false)
  assert.equal(tokens.length, 1)
  assert.equal(tokens[0].category, "color")
  assert.notEqual(tokens[0].light, tokens[0].dark)
  const all = await call("get_theme_tokens")
  const radius = all.tokens.find(token => token.category === "radius")
  assert.equal(radius.light, radius.dark)
})

test("get_rules gives the invariants and the component folder's shape from CLAUDE.md", async () => {
  const { source, rules, isError } = await call("get_rules")
  assert.equal(isError, false)
  assert.equal(source, "CLAUDE.md")
  assert.match(rules, /^## Non-negotiable invariants/)
  assert.match(rules, /Token-first styling/)
  assert.match(rules, /## Component directory shape/)
  assert.doesNotMatch(rules, /## Architecture/)
})

test("a design-delta tool is answered by design-delta", async () => {
  const answer = await call("get_contract", { id: "badge" })
  assert.equal(answer.isError, false)
  assert.equal(answer.file, "components/badge/badge.contract.json")
  assert.ok(answer.version.package, "design-delta's version")
})

test("an unknown tool is an error, not a crash", async () => {
  const answer = await call("no_such_tool")
  assert.equal(answer.isError, true)
})

// A copy with no node_modules: design-delta cannot start there.
test("without design-delta its own tools still answer, and design-delta's say why not", () => {
  const dir = mkdtempSync(path.join(tmpdir(), "mcp-"))
  try {
    for (const rel of [
      "scripts/mcp.mjs",
      "package.json",
      "CLAUDE.md",
      "components/badge",
    ])
      cpSync(path.join(ROOT, rel), path.join(dir, rel), { recursive: true })
    const lines = [
      { id: 1, method: "initialize", params: {} },
      { id: 2, method: "tools/list" },
      { id: 3, method: "tools/call", params: { name: "get_rules" } },
      {
        id: 4,
        method: "tools/call",
        params: { name: "get_contract", arguments: { id: "badge" } },
      },
    ].map(message => JSON.stringify({ jsonrpc: "2.0", ...message }))
    const run = spawnSync(process.execPath, ["scripts/mcp.mjs"], {
      cwd: dir,
      input: `${lines.join("\n")}\n`,
      encoding: "utf8",
    })
    assert.equal(run.status, 0, run.stderr)
    const [, list, rules, contract] = run.stdout
      .trim()
      .split("\n")
      .map(line => JSON.parse(line))
    assert.deepEqual(
      list.result.tools.map(tool => tool.name),
      ["get_component_usage", "get_theme_tokens", "get_rules"],
    )
    assert.equal(rules.result.isError, false)
    assert.equal(contract.result.isError, true)
    assert.match(contract.result.content[0].text, /design-delta/)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})
