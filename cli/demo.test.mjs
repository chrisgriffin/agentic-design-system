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
test("a checkout with uncommitted changes is warned before the run", () => {
  const checkout = path.join(dir, "checkout")
  execFileSync("git", ["clone", "--quiet", ROOT, checkout])
  copyFileSync(
    path.join(ROOT, "cli/demo.mjs"),
    path.join(checkout, "cli/demo.mjs"),
  )
  const run = demoIn(checkout, ...VALUES)
  assert.equal(run.status, 0, run.stderr)
  assert.match(run.stderr, /uncommitted changes/)
})
