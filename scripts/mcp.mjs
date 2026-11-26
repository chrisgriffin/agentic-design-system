#!/usr/bin/env node
// npm run mcp: the design system's MCP server, on stdio (#94). It answers how
// to use the system (a component's usage, each token's value per theme, the
// rules) and passes every design-delta tool through, so an agent connects to
// one server. Newline-delimited JSON-RPC 2.0, as `design-delta mcp` speaks it;
// nothing but protocol lines goes to stdout, and nothing is written to disk.
// Every answer is read from disk when it is asked for, so none goes stale.
import { execFileSync, spawn } from "node:child_process"
import { existsSync, readdirSync, readFileSync } from "node:fs"
import path from "node:path"
import { createInterface } from "node:readline"
import { fileURLToPath } from "node:url"

const PROTOCOL_VERSION = "2024-11-05"
const root = fileURLToPath(new URL("..", import.meta.url))
const read = rel => readFileSync(path.join(root, rel), "utf8")
const { name, version } = JSON.parse(read("package.json"))

const TOOLS = [
  {
    name: "get_component_usage",
    description:
      "How to use a component: the folder to import it from, the names its index.ts exports and its stories file, each story a working example. Its props, anatomy and token bindings are get_contract's.",
    inputSchema: {
      type: "object",
      properties: { id: { type: "string", description: "e.g. badge" } },
      required: ["id"],
    },
  },
  {
    name: "get_theme_tokens",
    description:
      "Every semantic token's value in the light and dark themes, read from the token sources. A stylesheet uses the token's name, never its value.",
    inputSchema: {
      type: "object",
      properties: {
        prefix: { type: "string", description: "e.g. --ads-color-accent" },
      },
    },
  },
  {
    name: "get_rules",
    description:
      "The rules for working in this design system: its invariants and the shape of a component's folder, from CLAUDE.md.",
    inputSchema: { type: "object", properties: {} },
  },
]

const components = () =>
  readdirSync(path.join(root, "components"), { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .map(entry => entry.name)
    .sort()

// The names a line like `export { A, B } from` or `export type { C } from` gives.
const exported = (source, type) =>
  [...source.matchAll(/^export (type )?\{([^}]*)\}/gm)]
    .filter(([, isType]) => Boolean(isType) === type)
    .flatMap(([, , names]) => names.split(",").map(n => n.trim()))
    .filter(Boolean)

const sections = (text, headings) =>
  headings
    .map(
      heading =>
        text.match(
          new RegExp(`^## ${heading}\\n[\\s\\S]*?(?=^## |(?![\\s\\S]))`, "m"),
        )?.[0],
    )
    .filter(Boolean)
    .map(section => section.trim())

const own = {
  get_component_usage({ id }) {
    const known = components()
    if (typeof id !== "string" || !known.includes(id))
      return { error: `no component "${id}"`, knownIds: known }
    const dir = `components/${id}`
    const index = read(`${dir}/index.ts`)
    const stories = `${dir}/${id}.stories.tsx`
    return {
      id,
      importFrom: dir,
      exports: { values: exported(index, false), types: exported(index, true) },
      stories: existsSync(path.join(root, stories))
        ? { file: stories, source: read(stories) }
        : null,
    }
  },
  // A fresh node each call: an import here would be cached, and an edited
  // token source would not be read.
  get_theme_tokens({ prefix } = {}) {
    const manifest = JSON.parse(
      execFileSync(
        process.execPath,
        [
          "--input-type=module",
          "-e",
          'import m from "./tokens/scripts/build-manifest.mjs"; process.stdout.write(JSON.stringify(m))',
        ],
        { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] },
      ),
    )
    // The manifest keeps colors, the tokens that change with the theme, in
    // its themes, and every other semantic token, one value, in semantic.
    const colors = Object.keys(manifest.themes.light).map(name => ({
      name,
      category: "color",
      type: "color",
      light: manifest.themes.light[name],
      dark: manifest.themes.dark[name],
    }))
    const rest = manifest.semantic.map(({ name, category, type, value }) => ({
      name,
      category,
      type,
      light: value,
      dark: value,
    }))
    const tokens = [...colors, ...rest].filter(
      token => !prefix || token.name.startsWith(prefix),
    )
    return { tokens, count: tokens.length }
  },
  get_rules() {
    const found = sections(read("CLAUDE.md"), [
      "Non-negotiable invariants",
      "Component directory shape",
    ])
    return found.length
      ? { source: "CLAUDE.md", rules: found.join("\n\n") }
      : {
          error:
            'CLAUDE.md has no "Non-negotiable invariants" or "Component directory shape" section',
        }
  },
}

// design-delta's own server, run behind this one: its module is not in its
// package's exports, so it is reached through its bin, as an agent would.
let delta
const startDelta = () =>
  (delta ??= new Promise(resolve => {
    const waiting = new Map()
    let next = 0
    let failed
    const ask = (method, params) =>
      new Promise(answer => {
        if (failed) return answer({ error: { code: -32603, message: failed } })
        const id = ++next
        waiting.set(id, answer)
        child.stdin.write(
          `${JSON.stringify({ jsonrpc: "2.0", id, method, params })}\n`,
        )
      })
    const fail = message => {
      failed ??= message
      for (const answer of waiting.values())
        answer({ error: { code: -32603, message: failed } })
      waiting.clear()
    }
    let child
    try {
      const pkgRoot = fileURLToPath(
        new URL("..", import.meta.resolve("design-delta")),
      )
      const { bin } = JSON.parse(
        readFileSync(path.join(pkgRoot, "package.json"), "utf8"),
      )
      const main = typeof bin === "string" ? bin : bin["design-delta"]
      child = spawn(process.execPath, [path.join(pkgRoot, main), "mcp"], {
        cwd: root,
        stdio: ["pipe", "pipe", "pipe"],
      })
    } catch (error) {
      failed = `design-delta could not start: ${error.message}`
      return resolve({ ask, tools: [] })
    }
    let stderr = ""
    child.stderr.on("data", chunk => (stderr += chunk))
    child.on("error", error =>
      fail(`design-delta could not start: ${error.message}`),
    )
    child.on("exit", code =>
      fail(
        `design-delta mcp exited (${code})${stderr ? `: ${stderr.trim()}` : ""}`,
      ),
    )
    child.stdin.on("error", () => {})
    createInterface({ input: child.stdout }).on("line", line => {
      let message
      try {
        message = JSON.parse(line)
      } catch {
        return
      }
      waiting.get(message.id)?.(message)
      waiting.delete(message.id)
    })
    process.on("exit", () => child.kill())
    ask("initialize", {
      protocolVersion: PROTOCOL_VERSION,
      capabilities: {},
      clientInfo: { name, version },
    }).then(async init => {
      if (init.error) return resolve({ ask, tools: [] })
      child.stdin.write(
        `${JSON.stringify({ jsonrpc: "2.0", method: "notifications/initialized" })}\n`,
      )
      const list = await ask("tools/list", {})
      resolve({ ask, tools: list.result?.tools ?? [] })
    })
  }))

const reply = (id, result) => ({ jsonrpc: "2.0", id, result })
const failure = (id, code, message) => ({
  jsonrpc: "2.0",
  id,
  error: { code, message },
})
const text = result => ({
  content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
  isError: Boolean(result.error),
})

const handle = async ({ id, method, params } = {}) => {
  const notification = id === undefined || id === null
  if (typeof method !== "string" || method.startsWith("notifications/"))
    return notification ? null : failure(id, -32602, "no method")
  switch (method) {
    case "initialize":
      startDelta()
      return reply(id, {
        protocolVersion: PROTOCOL_VERSION,
        capabilities: { tools: {} },
        serverInfo: { name, version },
      })
    case "ping":
      return reply(id, {})
    case "tools/list":
      return reply(id, { tools: [...TOOLS, ...(await startDelta()).tools] })
    case "tools/call": {
      const tool = params?.name
      if (Object.hasOwn(own, tool)) {
        try {
          return reply(id, text(own[tool](params.arguments ?? {})))
        } catch (error) {
          return reply(id, text({ error: error.message }))
        }
      }
      const { ask } = await startDelta()
      const answer = await ask("tools/call", params)
      return answer.error
        ? reply(id, text({ error: answer.error.message }))
        : reply(id, answer.result)
    }
    default:
      return notification
        ? null
        : failure(id, -32601, `unknown method "${method}"`)
  }
}

// Answers go out in the order requests came in.
let queue = Promise.resolve()
createInterface({ input: process.stdin })
  .on("line", line => {
    if (!line.trim()) return
    queue = queue.then(async () => {
      let message
      try {
        message = JSON.parse(line)
      } catch {
        return process.stdout.write(
          `${JSON.stringify(failure(null, -32700, "not JSON"))}\n`,
        )
      }
      const response = await handle(message)
      if (response) process.stdout.write(`${JSON.stringify(response)}\n`)
    })
  })
  .on("close", () => queue.then(() => process.exit(0)))
