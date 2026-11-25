#!/usr/bin/env node
// npm run demo: the create command run against this checkout, in a fresh
// demo-ds folder under the system temp folder, with its prompts live (Enter
// takes the defaults). Arguments go to the create command after the demo's
// own, so a later --dir or --from wins.
import { execFileSync, spawnSync } from "node:child_process"
import { existsSync, mkdirSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"
import { fileURLToPath } from "node:url"

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const folder = path.join(tmpdir(), "demo-ds")
const git = (cwd, ...args) =>
  execFileSync("git", ["-C", cwd, ...args], { encoding: "utf8" })

// The create command clones, so it sees the last commit and nothing after it.
if (git(root, "status", "--porcelain").trim())
  console.error(
    `${root} has uncommitted changes; the demo runs its last commit, not them.`,
  )

rmSync(folder, { recursive: true, force: true })
mkdirSync(folder, { recursive: true })
const run = spawnSync(
  process.execPath,
  [
    path.join(root, "cli/create.mjs"),
    "--from",
    root,
    "--dir",
    folder,
    ...process.argv.slice(2),
  ],
  { stdio: "inherit" },
)
console.log(`\nDemo: ${folder}`)
// A run refused before the copy leaves no repository of its own to show.
if (existsSync(path.join(folder, ".git")))
  console.log(git(folder, "status", "--short"))
process.exit(run.status ?? 1)
