#!/usr/bin/env node
// Creates a named design system from this template in one run:
// `npx github:chrisgriffin/agentic-design-system <name>`. It clones the
// template, starts a fresh git history and hands over to the copy's own
// scripts/init.mjs, which rewrites the values, installs and runs the gate.
import { execFileSync, spawnSync } from "node:child_process"
import {
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  renameSync,
  rmdirSync,
  rmSync,
  statSync,
} from "node:fs"
import path from "node:path"
import { createInterface } from "node:readline/promises"
import { fileURLToPath } from "node:url"

import { gitUserName, ownerFrom, prefixFrom } from "./defaults.mjs"

const USAGE = `usage: npx github:chrisgriffin/agentic-design-system <name> [--prefix <prefix>] [--owner <github-username>] [--figma-file <key>] [--fleet] [--dir <path>]

  <name>        the package and repo name, kebab-case; the new folder is named after it
  --prefix      the custom property prefix, letters and digits (as in --ads-*)
  --owner       your GitHub username
  --figma-file  a Figma file key, written to design-delta.json and every Code Connect stub
  --fleet       keep evaluator-gate.yml and claude-mention.yml, which need a private operator
  --dir         where to create the folder (default: the current folder)

Creates <dir>/<name> as a new git repository holding the template's default
branch under your name, prefix and owner, installs it and runs its gate. It
refuses when <dir>/<name> exists and is not an empty folder. In a terminal, a
missing name, prefix or owner is asked for. Nothing is committed: read it,
then commit.`

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const args = process.argv.slice(2)
if (args.includes("--help") || args.includes("-h")) {
  console.log(USAGE)
  process.exit(0)
}

const fail = message => {
  console.error(message)
  process.exit(1)
}

// --from and --no-init are for the tests and CI: another template source, and
// a copy left before the install and the gate.
const VALUE_FLAGS = new Set([
  "--prefix",
  "--owner",
  "--figma-file",
  "--dir",
  "--from",
])
const SWITCHES = new Set(["--fleet", "--no-init"])
const values = {}
const switches = new Set()
const positional = []
for (let i = 0; i < args.length; i++) {
  const arg = args[i]
  if (VALUE_FLAGS.has(arg)) {
    const value = args[i + 1]
    if (value === undefined || value.startsWith("-"))
      fail(`${arg} needs a value\n\n${USAGE}`)
    values[arg] = value
    i++
  } else if (SWITCHES.has(arg)) switches.add(arg)
  else if (arg.startsWith("-")) fail(`unknown option ${arg}\n\n${USAGE}`)
  else positional.push(arg)
}
if (positional.length > 1)
  fail(`one name only, got: ${positional.join(" ")}\n\n${USAGE}`)

let name = positional[0]
let prefix = values["--prefix"]
let owner = values["--owner"]
const figma = values["--figma-file"]
const fleet = switches.has("--fleet")
const init = !switches.has("--no-init")
const pkg = JSON.parse(readFileSync(path.join(root, "package.json"), "utf8"))
const from = values["--from"] ?? pkg.repository.url.replace(/^git\+/, "")

const missing = [
  [name, "<name>"],
  [prefix, "--prefix"],
  [owner, "--owner"],
].filter(([value]) => !value)
if (missing.length && !process.stdin.isTTY)
  fail(`missing ${missing.map(([, label]) => label).join(", ")}\n\n${USAGE}`)
if (missing.length) {
  const rl = createInterface({ input: process.stdin, output: process.stdout })
  const ask = async (question, fallback) =>
    (
      await rl.question(`${question}${fallback ? ` (${fallback})` : ""}: `)
    ).trim() || fallback
  // Input that closes mid-question (Ctrl-D) rejects the pending answer.
  try {
    name ||= await ask("Name, kebab-case")
    prefix ||= await ask("Custom property prefix", prefixFrom(name))
    owner ||= await ask("Your GitHub username", ownerFrom(gitUserName()))
  } catch {
    fail("\ncanceled; nothing was written.")
  } finally {
    rl.close()
  }
}

// The template's own init script owns what a valid value is.
const initArgs = [
  "--name",
  name ?? "",
  "--prefix",
  prefix ?? "",
  "--owner",
  owner ?? "",
  ...(figma === undefined ? [] : ["--figma-file", figma]),
  ...(fleet ? ["--fleet"] : []),
]
const refused = `a value is missing or not valid: ${initArgs.join(" ")}`
const accepts = dir =>
  spawnSync(
    process.execPath,
    [path.join(dir, "scripts/init.mjs"), "--check", ...initArgs],
    { stdio: "ignore" },
  ).status === 0
// Asked of this copy first, so a bad value fails before the network.
if (!accepts(root)) fail(`${refused}\n\n${USAGE}`)

const target = path.resolve(values["--dir"] ?? process.cwd(), name)
let existing
try {
  existing = statSync(target)
} catch {
  // Nothing there yet.
}
if (existing && !existing.isDirectory())
  fail(`${target} exists and is not a folder; nothing was written.`)
if (existing && readdirSync(target).length)
  fail(`${target} exists and is not empty; nothing was written.`)

// Everything is built in a staging folder beside the target and moved into
// place last, so a failure on the way leaves nothing behind.
const parent = path.dirname(target)
let made
let staging
const step = (what, action) => {
  try {
    return action()
  } catch (error) {
    if (staging) rmSync(staging, { recursive: true, force: true })
    if (made) rmSync(made, { recursive: true, force: true })
    const why =
      error.code === "ENOENT" && error.path === "git"
        ? "git was not found on PATH"
        : String(error.stderr || error.message).trim()
    fail(`${what} failed; nothing was written.\n${why}`)
  }
}
made = step(`creating ${parent}`, () => mkdirSync(parent, { recursive: true }))
staging = step(`creating a folder in ${parent}`, () =>
  mkdtempSync(path.join(parent, `.${name}-`)),
)
const git = (...gitArgs) =>
  execFileSync("git", gitArgs, { stdio: ["ignore", "ignore", "pipe"] })
step(`cloning ${from}`, () =>
  git("clone", "--quiet", "--depth", "1", from, staging),
)
// The clone's own init script is the one that will run, so it decides.
step("checking the values", () => {
  if (!accepts(staging))
    throw new Error(
      `the cloned template's init script refuses them: ${refused}`,
    )
})
// A new system starts its own history.
step("starting a new git history", () => {
  rmSync(path.join(staging, ".git"), { recursive: true, force: true })
  git("-C", staging, "init", "--quiet")
})
step(`moving the copy to ${target}`, () => {
  if (existing) rmdirSync(target)
  try {
    renameSync(staging, target)
  } catch (error) {
    if (existing) mkdirSync(target)
    throw error
  }
})
staging = made = undefined

if (init) {
  const run = spawnSync(process.execPath, ["scripts/init.mjs", ...initArgs], {
    cwd: target,
    stdio: "inherit",
  })
  if (run.status !== 0)
    fail(
      `\n${target} was created, but its init script failed. Fix the cause, then run it again there:\n  node scripts/init.mjs ${initArgs.join(" ")}`,
    )
}
const relative = path.relative(process.cwd(), target)
const shown =
  relative && !relative.startsWith("..") && !path.isAbsolute(relative)
    ? relative
    : target
console.log(`\nCreated ${target}. Next: cd ${shown}, read it, then commit.`)
