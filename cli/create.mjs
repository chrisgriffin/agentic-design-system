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

import { authorFrom, gitUserName, ownerFrom, prefixFrom } from "./defaults.mjs"

const USAGE = `usage: npx github:chrisgriffin/agentic-design-system <name> [--prefix <prefix>] [--owner <github-username>] [--author <name>] [--description <text>] [--figma-file <key>] [--fleet] [--dir <path>]

  <name>        the package and repo name, kebab-case; the new folder is named after it
  --prefix      the custom property prefix: a lowercase letter, then lowercase letters and digits (as in --ads-*)
  --owner       your GitHub username
  --author      the copyright holder in LICENSE (default: git's user.name, else --owner)
  --description one line for package.json and the README intro (default: "The <name> design system.")
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

const fail = message => {
  console.error(message)
  process.exit(1)
}

// --from and --no-init are for the tests and CI: another template source, and
// a copy left before the install and the gate.
const VALUE_FLAGS = new Set([
  "--prefix",
  "--owner",
  "--author",
  "--description",
  "--figma-file",
  "--dir",
  "--from",
])
// Free text, so a value starting with "-" is the value, not a flag (#49).
const TEXT_FLAGS = new Set(["--author", "--description"])
const SWITCHES = new Set(["--fleet", "--no-init", "--help", "-h"])
const values = {}
const switches = new Set()
const positional = []
let refusal
for (let i = 0; i < args.length; i++) {
  const arg = args[i]
  if (VALUE_FLAGS.has(arg)) {
    const value = args[i + 1]
    if (value === undefined || (value.startsWith("-") && !TEXT_FLAGS.has(arg)))
      refusal ??= `${arg} needs a value`
    else {
      values[arg] = value
      i++
    }
  } else if (SWITCHES.has(arg)) switches.add(arg)
  else if (arg.startsWith("-")) refusal ??= `unknown option ${arg}`
  else positional.push(arg)
}
if (switches.has("--help") || switches.has("-h")) {
  console.log(USAGE)
  process.exit(0)
}
if (refusal) fail(`${refusal}\n\n${USAGE}`)
if (positional.length > 1)
  fail(`one name only, got: ${positional.join(" ")}\n\n${USAGE}`)

let name = positional[0]
let prefix = values["--prefix"]
let owner = values["--owner"]
const figma = values["--figma-file"]
const author = values["--author"]
const description = values["--description"]
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
  ...(author === undefined ? [] : ["--author", author]),
  ...(description === undefined ? [] : ["--description", description]),
  ...(figma === undefined ? [] : ["--figma-file", figma]),
  ...(fleet ? ["--fleet"] : []),
]
// Quoted for a shell, since an author or description can hold spaces; built
// when it is shown, so it carries every argument pushed by then.
const quoted = () =>
  initArgs
    .map(a => (/^[\w./:@-]+$/.test(a) ? a : `'${a.replaceAll("'", "'\\''")}'`))
    .join(" ")
// The reason init gives, which names each value it refused (#56): only lines
// shaped like init's refusals, so a crash's stack trace or a Node warning is
// never shown as one; a template whose init gives none gets the values it was
// handed. Init's --name is this command's <name>.
const REFUSAL_LINE =
  /^(--[a-z][a-z-]* (is missing|needs a value|".*" is not valid: .+)|unknown argument .+)$/
const initRefusal = dir => {
  const run = spawnSync(
    process.execPath,
    [path.join(dir, "scripts/init.mjs"), "--check", ...initArgs],
    { encoding: "utf8", stdio: ["ignore", "ignore", "pipe"] },
  )
  if (run.status === 0) return undefined
  const lines = String(run.stderr ?? "").split("\n")
  const usage = lines.findIndex(line => line.startsWith("usage: "))
  const reasons = lines
    .slice(0, usage === -1 ? undefined : usage)
    .filter(line => REFUSAL_LINE.test(line))
    .map(line => line.replace(/^--name /, "<name> "))
  return reasons.length
    ? reasons.join("\n")
    : `a value is missing or not valid: ${quoted()}`
}
// Asked of this copy first, so a bad value fails before the network.
const refused = initRefusal(root)
if (refused) fail(`${refused}\n\n${USAGE}`)

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
  const why = initRefusal(staging)
  if (why)
    throw new Error(`the cloned template's init script refuses them: ${why}`)
})
// A new system starts its own history, on main, which its build check and
// Pages deploy run on, whatever git's own default branch is (#68). HEAD is
// pointed at main after init, not with --initial-branch, which git before 2.28
// does not know.
step("starting a new git history", () => {
  rmSync(path.join(staging, ".git"), { recursive: true, force: true })
  git("-C", staging, "init", "--quiet")
  git("-C", staging, "symbolic-ref", "HEAD", "refs/heads/main")
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
  // The author init would default to, resolved in the copy as init resolves
  // it, said before the install's output and handed to init so the name said
  // is the name written (#68).
  if (author === undefined) {
    const chosen = authorFrom(target, owner)
    console.log(
      `LICENSE names ${chosen.author} as the copyright holder, from ${chosen.from}; pass --author to name someone else.`,
    )
    initArgs.push("--author", chosen.author)
  }
  const run = spawnSync(process.execPath, ["scripts/init.mjs", ...initArgs], {
    cwd: target,
    stdio: "inherit",
  })
  if (run.status !== 0)
    fail(
      `\n${target} was created, but its init script failed. Fix the cause, then run it again there:\n  node scripts/init.mjs ${quoted()}`,
    )
}
const relative = path.relative(process.cwd(), target)
const shown =
  relative && !relative.startsWith("..") && !path.isAbsolute(relative)
    ? relative
    : target
console.log(
  `\nCreated ${target}. Next: cd ${shown}, read it and commit, then run /setup-system in Claude Code there (a session opened elsewhere reads ${shown}/.claude/skills/setup-system/SKILL.md and follows it).`,
)
