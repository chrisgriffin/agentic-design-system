#!/usr/bin/env node
// npm run demo: the create command run against this checkout, in a fresh
// demo-ds folder under the system temp folder, with its prompts live (Enter
// takes the defaults). Arguments go to the create command after the demo's
// own, so a later --dir or --from wins; the closing lines name the folder the
// create command used.
import { execFileSync, spawnSync } from "node:child_process"
import { existsSync, mkdirSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"
import { fileURLToPath } from "node:url"

import { TEXT_FLAGS, VALUE_FLAGS } from "./defaults.mjs"
import { failure, rows, tick, warn } from "./ui.mjs"

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const args = process.argv.slice(2)
const git = (cwd, ...rest) =>
  execFileSync("git", ["-C", cwd, ...rest], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  })

// The last --dir given, read the way the create command reads its flags: a
// flag's value is skipped, so `--author --dir` names an author, not a folder.
const passedDir = args => {
  let dir
  for (let i = 0; i < args.length; i++) {
    if (!VALUE_FLAGS.has(args[i])) continue
    const value = args[i + 1]
    if (value === undefined) break
    if (value.startsWith("-") && !TEXT_FLAGS.has(args[i])) continue
    if (args[i] === "--dir") dir = value
    i++
  }
  return dir
}

const named = passedDir(args)
const folder = path.resolve(named ?? path.join(tmpdir(), "demo-ds"))

// --clean removes the demo's own folder and runs nothing else (#90). It takes
// no other argument: a folder --dir names is the person's, never removed.
if (args.includes("--clean")) {
  if (args.length > 1) {
    console.error(
      failure(
        "--clean takes no other argument: it removes only the demo's own folder.",
      ),
    )
    process.exit(1)
  }
  const there = existsSync(folder)
  rmSync(folder, { recursive: true, force: true })
  console.log(
    there ? tick("Removed", folder) : tick("Clean", `nothing at ${folder}`),
  )
  process.exit(0)
}

// The create command clones, so the template it copies is this checkout's last
// commit; the create command itself, and the init check it runs first, are the
// files on disk.
if (git(root, "status", "--porcelain").trim())
  console.error(
    warn(
      `${root} has uncommitted changes; the template the demo copies is its last commit, without them.`,
    ),
  )

// Only the demo's own folder is wiped: a folder the person named is theirs.
if (!named) {
  rmSync(folder, { recursive: true, force: true })
  mkdirSync(folder, { recursive: true })
}
const run = spawnSync(
  process.execPath,
  [path.join(root, "cli/create.mjs"), "--from", root, "--dir", folder, ...args],
  { stdio: "inherit" },
)
// A run refused before the copy leaves no repository of its own to show.
const inRepository = () => {
  try {
    return git(folder, "rev-parse", "--is-inside-work-tree").trim() === "true"
  } catch {
    return false
  }
}
// git status counted by kind, not listed: a new system is every file untracked.
const status = () => {
  const lines = git(folder, "status", "--porcelain").split("\n").filter(Boolean)
  const untracked = lines.filter(line => line.startsWith("??")).length
  const counts = [
    [untracked, "untracked"],
    [lines.length - untracked, "changed"],
  ].filter(([n]) => n)
  return counts.length
    ? counts.map(([n, kind]) => `${n} ${kind}`).join(", ")
    : "clean"
}
const shown =
  existsSync(folder) &&
  (named ? inRepository() : existsSync(path.join(folder, ".git")))
console.log(
  `\n${rows([
    ["Demo", folder],
    ["git status", shown ? status() : undefined],
  ])}`,
)
process.exit(run.status ?? 1)
