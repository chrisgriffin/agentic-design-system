import assert from "node:assert/strict"
import { spawn, spawnSync } from "node:child_process"
import {
  cpSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs"
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
  assert.deepEqual(usage.exports, {
    values: ["Badge"],
    types: ["BadgeProps"],
    starFrom: [],
  })
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

test("an unknown tool is an error naming every tool, its own and design-delta's", async () => {
  const answer = await call("get_theme_token")
  assert.equal(answer.isError, true)
  for (const name of [
    "get_component_usage",
    "get_theme_tokens",
    "get_rules",
    "get_contract",
  ])
    assert.match(answer.error, new RegExp(`\\b${name}\\b`), answer.error)
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

// A copy of the server, and what it answers to `messages` sent down stdin and
// then closed. `delta` is a stand-in design-delta bin's source, if any.
const runCopy = (messages, { delta, files = {}, env = {} } = {}) => {
  const dir = mkdtempSync(path.join(tmpdir(), "mcp-"))
  try {
    for (const rel of [
      "scripts/mcp.mjs",
      "package.json",
      "CLAUDE.md",
      "components/badge",
    ])
      cpSync(path.join(ROOT, rel), path.join(dir, rel), { recursive: true })
    if (delta) {
      const pkg = path.join(dir, "node_modules/design-delta")
      mkdirSync(path.join(pkg, "src/cli"), { recursive: true })
      writeFileSync(
        path.join(pkg, "package.json"),
        JSON.stringify({
          name: "design-delta",
          type: "module",
          exports: { ".": "./src/index.mjs" },
          bin: { "design-delta": "src/cli/main.mjs" },
        }),
      )
      writeFileSync(path.join(pkg, "src/index.mjs"), "")
      writeFileSync(path.join(pkg, "src/cli/main.mjs"), delta)
    }
    for (const [rel, source] of Object.entries(files)) {
      mkdirSync(path.dirname(path.join(dir, rel)), { recursive: true })
      writeFileSync(path.join(dir, rel), source)
    }
    const run = spawnSync(process.execPath, ["scripts/mcp.mjs"], {
      cwd: dir,
      input: `${messages.map(m => (typeof m === "string" ? m : JSON.stringify({ jsonrpc: "2.0", ...m }))).join("\n")}\n`,
      encoding: "utf8",
      timeout: 20_000,
      maxBuffer: 64 * 1024 * 1024,
      env: { ...process.env, MCP_DELTA_TIMEOUT_MS: "500", ...env },
    })
    assert.equal(run.status, 0, `${run.error ?? ""} ${run.stderr}`)
    return run.stdout
      .trim()
      .split("\n")
      .map(line => JSON.parse(line))
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
}
const resultText = answer => JSON.parse(answer.result.content[0].text)

// A stand-in design-delta server: answers the handshake with `tools`, and a
// tools/call with `onCall`'s source, run with `send` and `message` in scope.
const fakeDelta = ({ tools = [], onInit = "send(reply)", onCall }) => `
import { createInterface } from "node:readline"
const send = m => process.stdout.write(JSON.stringify(m) + "\\n")
createInterface({ input: process.stdin }).on("line", line => {
  const message = JSON.parse(line)
  if (message.id === undefined) return
  if (message.method === "initialize") {
    const reply = { jsonrpc: "2.0", id: message.id, result: { protocolVersion: "2024-11-05", capabilities: { tools: {} }, serverInfo: { name: "fake", version: "0" } } }
    ${onInit}
  } else if (message.method === "tools/list")
    send({ jsonrpc: "2.0", id: message.id, result: { tools: ${JSON.stringify(tools)} } })
  else if (message.method === "tools/call") { ${onCall} }
})
`
const tool = name => ({
  name,
  description: name,
  inputSchema: { type: "object" },
})

test("a line that is not a JSON-RPC object is an Invalid Request, and the next one is answered", () => {
  const bad = [
    "null",
    "42",
    '"ping"',
    "true",
    "[]",
    '[{"jsonrpc":"2.0","id":1,"method":"ping"}]',
    "{}",
    '{"jsonrpc":"2.0","id":7}',
  ]
  const answers = runCopy([...bad, { id: 99, method: "ping" }])
  assert.equal(answers.length, bad.length + 1, JSON.stringify(answers))
  for (const [i, answer] of answers.slice(0, -1).entries()) {
    assert.equal(
      answer.error?.code,
      -32600,
      `${bad[i]} → ${JSON.stringify(answer)}`,
    )
    assert.equal(answer.id, bad[i].includes('"id":7') ? 7 : null)
  }
  assert.deepEqual(answers.at(-1), { jsonrpc: "2.0", id: 99, result: {} })
})

test("a design-delta that hangs on the handshake does not stop the own tools", () => {
  const [, list, rules, ping, contract] = runCopy(
    [
      { id: 1, method: "initialize", params: {} },
      { id: 2, method: "tools/list" },
      { id: 3, method: "tools/call", params: { name: "get_rules" } },
      { id: 4, method: "ping" },
      {
        id: 5,
        method: "tools/call",
        params: { name: "get_contract", arguments: { id: "badge" } },
      },
    ],
    { delta: fakeDelta({ onInit: "", onCall: "" }) },
  )
  assert.deepEqual(
    list.result.tools.map(entry => entry.name),
    ["get_component_usage", "get_theme_tokens", "get_rules"],
  )
  assert.equal(rules.result.isError, false)
  assert.deepEqual(ping.result, {})
  assert.equal(contract.result.isError, true)
  assert.match(resultText(contract).error, /did not answer initialize/)
})

test("a design-delta call that hangs is an error, and the own tools still answer after it", () => {
  const [, list, slow, rules, ping] = runCopy(
    [
      { id: 1, method: "initialize", params: {} },
      { id: 2, method: "tools/list" },
      { id: 3, method: "tools/call", params: { name: "slow_tool" } },
      { id: 4, method: "tools/call", params: { name: "get_rules" } },
      { id: 5, method: "ping" },
    ],
    { delta: fakeDelta({ tools: [tool("slow_tool")], onCall: "" }) },
  )
  assert.ok(list.result.tools.some(entry => entry.name === "slow_tool"))
  assert.equal(slow.result.isError, true)
  assert.match(resultText(slow).error, /did not answer tools\/call/)
  assert.equal(rules.result.isError, false)
  assert.deepEqual(ping.result, {})
})

// The stand-in exits at once and leaves its stdout to a process that writes
// the reply later: the child's `exit` comes before its stdout is drained.
test("a design-delta that exits before its stdout drains still has its reply read", () => {
  const big = "x".repeat(64 * 1024)
  const [, , answer] = runCopy(
    [
      { id: 1, method: "initialize", params: {} },
      { id: 2, method: "tools/list" },
      { id: 3, method: "tools/call", params: { name: "big_tool" } },
    ],
    {
      delta: `import { spawn } from "node:child_process"\n${fakeDelta({
        tools: [tool("big_tool")],
        onCall: `
          const line = JSON.stringify({ jsonrpc: "2.0", id: message.id, result: { content: [{ type: "text", text: "x".repeat(${big.length}) }] } }) + "\\n"
          spawn(process.execPath, ["-e", "setTimeout(() => process.stdout.write(process.env.LINE), 300)"], { stdio: ["ignore", "inherit", "ignore"], env: { ...process.env, LINE: line } })
          process.exit(0)`,
      })}`,
    },
  )
  assert.equal(
    answer.result.isError,
    undefined,
    answer.result.content?.[0]?.text?.slice(0, 200),
  )
  assert.equal(answer.result.content[0].text, big)
})

test("a design-delta tool named like an own tool is dropped, so tools/list names each tool once", () => {
  const [, list, rules] = runCopy(
    [
      { id: 1, method: "initialize", params: {} },
      { id: 2, method: "tools/list" },
      { id: 3, method: "tools/call", params: { name: "get_rules" } },
    ],
    {
      delta: fakeDelta({
        tools: [tool("get_rules"), tool("other_tool")],
        onCall: `send({ jsonrpc: "2.0", id: message.id, result: { content: [{ type: "text", text: "{}" }] } })`,
      }),
    },
  )
  const names = list.result.tools.map(entry => entry.name)
  assert.deepEqual(names, [
    "get_component_usage",
    "get_theme_tokens",
    "get_rules",
    "other_tool",
  ])
  assert.equal(resultText(rules).source, "CLAUDE.md")
})

test("without design-delta an unknown tool names the own tools and why design-delta's are missing", () => {
  const [answer] = runCopy([
    { id: 1, method: "tools/call", params: { name: "no_such_tool" } },
  ])
  const { error } = resultText(answer)
  assert.match(error, /unknown tool "no_such_tool"/)
  assert.match(error, /get_component_usage, get_theme_tokens, get_rules/)
  assert.match(error, /design-delta could not start/)
})

test("get_component_usage reads every export form an index.ts can use", () => {
  const index = [
    'export { Tag, type TagProps } from "./tag"',
    'export { default as Chip, Pill as Lozenge } from "./chip"',
    'export type { ChipProps, PillProps as LozengeProps } from "./chip"',
    'export * from "./parts"',
    'export * as icons from "./icons"',
    'export type * from "./types"',
    "export const SIZES = []",
    "export function useTag() {}",
    "export async function loadTag() {}",
    "export class TagStore {}",
    "export enum Tone { Neutral }",
    "export type TagTone = string",
    "export interface TagTheme {}",
    "export default Tag",
  ].join("\n")
  const [answer] = runCopy(
    [
      {
        id: 1,
        method: "tools/call",
        params: { name: "get_component_usage", arguments: { id: "tag" } },
      },
    ],
    { files: { "components/tag/index.ts": index } },
  )
  assert.deepEqual(resultText(answer).exports, {
    values: [
      "Tag",
      "Chip",
      "Lozenge",
      "SIZES",
      "useTag",
      "loadTag",
      "TagStore",
      "Tone",
      "default",
      "icons",
    ],
    types: ["TagProps", "ChipProps", "LozengeProps", "TagTone", "TagTheme"],
    starFrom: ["./parts", "./types"],
  })
})

test("every reply is written whole before the server ends, the last and largest included", () => {
  const usage = {
    method: "tools/call",
    params: { name: "get_component_usage", arguments: { id: "badge" } },
  }
  const messages = Array.from({ length: 40 }, (_, i) => ({
    id: i + 1,
    ...usage,
  }))
  const answers = runCopy(messages)
  assert.equal(answers.length, messages.length)
  assert.equal(answers.at(-1).id, messages.length)
  assert.match(resultText(answers.at(-1)).stories.source, /export const/)
  // process.exit after a write can truncate a pipe on macOS; the server lets
  // stdout drain instead.
  assert.doesNotMatch(
    readFileSync(path.join(ROOT, "scripts/mcp.mjs"), "utf8"),
    /process\.exit\(/,
  )
})
