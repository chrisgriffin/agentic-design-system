#!/usr/bin/env node
// Creates a named design system from this template in one run:
// `npx github:chrisgriffin/agentic-design-system <name>`. It clones the
// template, starts a fresh git history and hands over to the copy's own
// scripts/init.mjs, which rewrites the values, installs and runs the gate.
import { execFileSync, spawnSync } from "node:child_process"
import { existsSync, readdirSync, readFileSync, rmSync } from "node:fs"
import path from "node:path"
import { createInterface } from "node:readline/promises"
import { fileURLToPath } from "node:url"

const USAGE = `usage: npx github:chrisgriffin/agentic-design-system <name> [--prefix <prefix>] [--owner <github-login>] [--figma-file <key>] [--fleet] [--dir <path>]

  <name>        the package and repo name, kebab-case; the new folder is named after it
  --prefix      the custom property prefix, letters and digits (as in --ads-*)
  --owner       the GitHub login the repo will live under
  --figma-file  a Figma file key, written to design-delta.json and every Code Connect stub
  --fleet       keep evaluator-gate.yml and claude-mention.yml, which need a private operator
  --dir         where to create the folder (default: the current folder)

Creates <dir>/<name> as a new git repository holding the template under your
name, prefix and owner, installs it and runs its gate. In a terminal, a missing
name, prefix or owner is asked for. Nothing is committed: read it, then commit.`

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const args = process.argv.slice(2)
if (args.includes("--help") || args.includes("-h")) {
  console.log(USAGE)
  process.exit(0)
}

const VALUE_FLAGS = ["--prefix", "--owner", "--figma-file", "--dir", "--from"]
const flag = f => (args.includes(f) ? args[args.indexOf(f) + 1] : undefined)
const positional = args.filter(
  (a, i) => !a.startsWith("--") && !VALUE_FLAGS.includes(args[i - 1]),
)
const fail = message => {
  console.error(message)
  process.exit(1)
}

let name = positional[0]
let prefix = flag("--prefix")
let owner = flag("--owner")
const figma = flag("--figma-file")
const fleet = args.includes("--fleet")
// --from and --no-init are for the tests and CI: another template source, and
// a copy left before the install and the gate.
const pkg = JSON.parse(readFileSync(path.join(root, "package.json"), "utf8"))
const from = flag("--from") ?? pkg.repository.url.replace(/^git\+/, "")
const init = !args.includes("--no-init")

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
  name ||= await ask("Name, kebab-case")
  // The initials of the name: my-system → ms.
  prefix ||= await ask(
    "Custom property prefix",
    (name ?? "")
      .split("-")
      .map(part => part[0])
      .join(""),
  )
  owner ||= await ask("GitHub login the repo will live under")
  rl.close()
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
const check = spawnSync(
  process.execPath,
  [path.join(root, "scripts/init.mjs"), "--check", ...initArgs],
  { stdio: "ignore" },
)
if (check.status !== 0)
  fail(`a value is missing or not valid: ${initArgs.join(" ")}\n\n${USAGE}`)

const target = path.resolve(flag("--dir") ?? process.cwd(), name)
if (existsSync(target) && readdirSync(target).length)
  fail(`${target} exists and is not empty; nothing was written.`)

const git = (...gitArgs) => execFileSync("git", gitArgs, { stdio: "inherit" })
git("clone", "--quiet", "--depth", "1", from, target)
// A new system starts its own history, and the template's specs are the
// template's.
for (const rel of [".git", "specs"])
  rmSync(path.join(target, rel), { recursive: true, force: true })
git("-C", target, "init", "--quiet")

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
console.log(`\nCreated ${target}. Next: cd ${name}, read it, then commit.`)
