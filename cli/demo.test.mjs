import assert from "node:assert/strict"
import { execFileSync, spawnSync } from "node:child_process"
import {
  copyFileSync,
  existsSync,
  mkdtempSync,
  rmSync,
  writeFileSync,
} from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"
import { afterEach, beforeEach, test } from "node:test"
import { fileURLToPath } from "node:url"

// npm run demo: the create command run against this checkout in a fresh
// demo-ds folder under the system temp folder, which TMPDIR points here.
const ROOT = fileURLToPath(new URL("..", import.meta.url))
const VALUES = ["--prefix", "dd", "--owner", "sample-owner", "--no-init"]

let dir
beforeEach(() => {
  dir = mkdtempSync(path.join(tmpdir(), "demo-"))
})
afterEach(() => {
  rmSync(dir, { recursive: true, force: true })
})

const demoIn = (root, ...args) =>
  spawnSync(process.execPath, [path.join(root, "cli/demo.mjs"), ...args], {
    encoding: "utf8",
    env: { ...process.env, TMPDIR: dir },
  })
const demo = (...args) => demoIn(ROOT, ...args)
const folder = () => path.join(dir, "demo-ds")

test("the demo sets up demo-ds in the temp folder and ends on its path and git status", () => {
  const run = demo(...VALUES)
  assert.equal(run.status, 0, run.stderr)
  assert.ok(existsSync(path.join(folder(), "scripts/init.mjs")))
  assert.match(run.stdout, new RegExp(`Demo: ${folder()}`))
  // A new repository with nothing committed: every file is untracked.
  assert.match(run.stdout, /^\?\? package\.json$/m)
})

test("each run starts from a fresh folder", () => {
  assert.equal(demo(...VALUES).status, 0)
  writeFileSync(path.join(folder(), "stale.txt"), "left by the last run")
  const run = demo(...VALUES)
  assert.equal(run.status, 0, run.stderr)
  assert.ok(!existsSync(path.join(folder(), "stale.txt")))
})

test("arguments reach the create command, and its exit code is the demo's", () => {
  const run = demo("--prefix", "9", "--owner", "sample-owner", "--no-init")
  assert.equal(run.status, 1)
  assert.match(run.stderr, /--prefix "9" is not valid/)
})

// The create command clones, so an uncommitted change is not in the demo.
// A clone of this checkout is clean whatever this checkout holds, so the
// clean run and the dirty one are both its.
test("a checkout with uncommitted changes is warned before the run, and a clean one is not", () => {
  const checkout = path.join(dir, "checkout")
  execFileSync("git", ["clone", "--quiet", ROOT, checkout])
  // The clone holds the demo as committed here; this run tests the file on disk.
  copyFileSync(
    path.join(ROOT, "cli/demo.mjs"),
    path.join(checkout, "cli/demo.mjs"),
  )
  execFileSync("git", [
    "-C",
    checkout,
    "update-index",
    "--assume-unchanged",
    "cli/demo.mjs",
  ])
  const clean = demoIn(checkout, ...VALUES)
  assert.equal(clean.status, 0, clean.stderr)
  assert.doesNotMatch(clean.stderr, /uncommitted changes/)
  writeFileSync(path.join(checkout, "uncommitted.txt"), "not committed")
  const dirty = demoIn(checkout, ...VALUES)
  assert.equal(dirty.status, 0, dirty.stderr)
  assert.match(dirty.stderr, /uncommitted changes/)
})
