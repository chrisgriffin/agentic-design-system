#!/usr/bin/env node
// Sets up a named design system from this template in the folder it is run
// in: `npx github:chrisgriffin/agentic-design-system`. It clones the template,
// copies it into the folder and hands over to the copy's own scripts/init.mjs,
// which rewrites the values, installs and runs the gate.
import { execFileSync, spawnSync } from "node:child_process"
import {
  cpSync,
  existsSync,
  lstatSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
} from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"
import { createInterface } from "node:readline/promises"
import { fileURLToPath } from "node:url"

import { authorFrom, gitUserName, ownerFrom, prefixFrom } from "./defaults.mjs"

const USAGE = `usage: npx github:chrisgriffin/agentic-design-system [--prefix <prefix>] [--owner <github-username>] [--name <name>] [--dir <path>] [--author <name>] [--description <text>] [--figma-file <key>] [--fleet]

  --prefix      the custom property prefix: a lowercase letter, then lowercase letters and digits (as in --ads-*)
  --owner       your GitHub username
  --name        the package and repo name, kebab-case (default: the folder's name)
  --dir         the folder to set up (default: the current folder); made when missing
  --author      the copyright holder in LICENSE (default: git's user.name, else --owner)
  --description one line for package.json and the README intro (default: "The <name> design system.")
  --figma-file  a Figma file key, written to design-delta.json and every Code Connect stub
  --fleet       keep evaluator-gate.yml and claude-mention.yml, which need a private operator

Sets up the template's default branch in the folder under your name, prefix
and owner, installs it and runs its gate. The folder must be empty, or in a
git repository with nothing uncommitted or ignored under it, so git can give
back every file the setup replaces. In a repository it keeps the history and the branch;
anywhere else it starts a repository on main. In a terminal, a missing prefix
or owner is asked for. Nothing is committed: read the diff, then commit.`

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
  "--name",
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
// The folder it is run in is the system (#75); a name alone names no folder.
if (positional.length)
  fail(
    `unexpected argument "${positional[0]}": the system is set up in the current folder, or the one --dir names, and --name names it\n\n${USAGE}`,
  )

const target = path.resolve(values["--dir"] ?? process.cwd())
const name = values["--name"] ?? path.basename(target)
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
  name,
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
// handed.
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
  return reasons.length
    ? reasons.join("\n")
    : `a value is missing or not valid: ${quoted()}`
}
// Asked of this copy first, so a bad value fails before the network.
const refused = initRefusal(root)
if (refused) fail(`${refused}\n\n${USAGE}`)

const git = (...gitArgs) => {
  try {
    return execFileSync("git", gitArgs, {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    })
  } catch (error) {
    if (error.code === "ENOENT") fail("git was not found on PATH")
    throw error
  }
}
const succeeds = (...gitArgs) => {
  try {
    git(...gitArgs)
    return true
  } catch {
    return false
  }
}

let existing
try {
  existing = statSync(target)
} catch {
  // Nothing there yet.
}
if (existing && !existing.isDirectory())
  fail(`${target} exists and is not a folder; nothing was written.`)
// The nearest folder that exists says whether the target is in a repository;
// the first one missing on the way is what a failed copy removes.
let probe = target
let made
while (!existsSync(probe)) {
  made = probe
  probe = path.dirname(probe)
}
let inRepo = false
try {
  inRepo =
    git("-C", probe, "rev-parse", "--is-inside-work-tree").trim() === "true"
} catch {
  // Not in a work tree.
}
const hadFiles = Boolean(existing && readdirSync(target).length)
// The init script rewrites names in every file it walks, formats the folder
// and removes specs/ and cli/ whole, so whatever is there already must be
// something git can give back (#75).
if (hadFiles && !inRepo)
  fail(
    `${target} is not empty and not in a git repository, so nothing could give back what the setup replaces; nothing was written. Run it in an empty folder, or in a git repository with everything committed.`,
  )
// A git command whose failure is one message naming what failed, never a
// stack trace.
const gitOr = (what, ...gitArgs) => {
  try {
    return git(...gitArgs)
  } catch (error) {
    fail(`${what}\n${String(error.stderr || error.message).trim()}`)
  }
}
if (hadFiles) {
  // Ignored files are listed too: git holds no copy of them, and the copy, the
  // init script's walk and its specs/ and cli/ removal reach them as well.
  const lines = gitOr(
    `reading git status in ${target} failed; nothing was written.`,
    "-C",
    target,
    "status",
    "--porcelain",
    "--untracked-files=all",
    "--ignored",
    "--",
    ".",
  )
    .split("\n")
    .filter(Boolean)
  const changes = lines.filter(line => !line.startsWith("!! "))
  const ignored = lines.filter(line => line.startsWith("!! "))
  if (changes.length)
    fail(
      `${target} has changes git could not give back; commit or stash them first. Nothing was written.\n${changes.join("\n")}`,
    )
  if (ignored.length)
    fail(
      `${target} holds files git ignores, so git could not give them back; move them out first. Nothing was written.\n${ignored.join("\n")}`,
    )
}

// The template is cloned to a folder of its own and copied in last, so a
// failure before the copy leaves the target as it was.
let staging
const step = (what, action) => {
  try {
    return action()
  } catch (error) {
    if (staging) rmSync(staging, { recursive: true, force: true })
    fail(
      `${what} failed; nothing was written.\n${String(error.stderr || error.message).trim()}`,
    )
  }
}
staging = step("creating a temporary folder", () =>
  mkdtempSync(path.join(tmpdir(), `${name}-`)),
)
step(`cloning ${from}`, () =>
  git("clone", "--quiet", "--depth", "1", from, staging),
)
// The clone's own init script is the one that will run, so it decides.
step("checking the values", () => {
  const why = initRefusal(staging)
  if (why)
    throw new Error(`the cloned template's init script refuses them: ${why}`)
})
rmSync(path.join(staging, ".git"), { recursive: true, force: true })

// The files already there that the copy writes over, for the closing line.
const files = dir =>
  readdirSync(path.join(staging, dir), { withFileTypes: true }).flatMap(e => {
    const rel = dir ? `${dir}/${e.name}` : e.name
    return e.isDirectory() ? files(rel) : [rel]
  })
const there = rel => {
  try {
    return Boolean(lstatSync(path.join(target, rel)))
  } catch {
    return false
  }
}
const replaced = hadFiles ? files("").filter(there) : []

try {
  cpSync(staging, target, { recursive: true })
} catch (error) {
  // An empty or new target is put back as it was, with any folder made on the
  // way to it; in a repository, git holds everything that was there.
  if (!existing) rmSync(made, { recursive: true, force: true })
  else if (!hadFiles)
    for (const entry of readdirSync(target))
      rmSync(path.join(target, entry), { recursive: true, force: true })
  rmSync(staging, { recursive: true, force: true })
  fail(
    `copying the template into ${target} failed${hadFiles ? "; git status there shows what was written, and git restore and git clean undo it" : "; nothing was written"}.\n${error.message}`,
  )
}
rmSync(staging, { recursive: true, force: true })

// A system's build check and Pages deploy run on main, whatever git's own
// default branch is (#68), so a new repository, or one with no commit yet,
// starts there. HEAD is pointed at main rather than passing --initial-branch,
// which git before 2.28 does not know. A repository with history keeps its
// branch.
const copied = `the template was copied into ${target}, but`
if (!inRepo)
  gitOr(
    `${copied} starting a git repository there failed. Run git init and git symbolic-ref HEAD refs/heads/main there, then node scripts/init.mjs ${quoted()}.`,
    "-C",
    target,
    "init",
    "--quiet",
  )
if (!succeeds("-C", target, "rev-parse", "--verify", "--quiet", "HEAD"))
  gitOr(
    `${copied} pointing its repository at main failed. Run git symbolic-ref HEAD refs/heads/main there, then node scripts/init.mjs ${quoted()}.`,
    "-C",
    target,
    "symbolic-ref",
    "HEAD",
    "refs/heads/main",
  )

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
      `\n${target} was set up, but its init script failed. Fix the cause, then run it again there:\n  node scripts/init.mjs ${quoted()}`,
    )
}
const relative = path.relative(process.cwd(), target)
const shown =
  relative && !relative.startsWith("..") && !path.isAbsolute(relative)
    ? relative
    : target
const over = replaced.length
  ? `, replacing ${replaced.join(", ")} (git diff shows what changed)`
  : ""
console.log(
  `\nSet up ${target}${over}. Next: ${relative ? `cd ${shown}, ` : ""}read it and commit, then run /setup-system in Claude Code.`,
)
