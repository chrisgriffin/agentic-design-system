import assert from "node:assert/strict"
import { spawnSync } from "node:child_process"
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"
import { afterEach, beforeEach, test } from "node:test"
import { fileURLToPath } from "node:url"

// The create command up to the hand-off: its arguments, its refusals and the
// folder it writes. The install and the gate it then runs are proved end to
// end by the init check in CI, which needs the network.
const ROOT = fileURLToPath(new URL("..", import.meta.url))
const CREATE = path.join(ROOT, "cli/create.mjs")
const VALUES = ["--prefix", "sds", "--owner", "sample-owner"]

let dir
beforeEach(() => {
  dir = mkdtempSync(path.join(tmpdir(), "create-"))
})
afterEach(() => {
  rmSync(dir, { recursive: true, force: true })
})

// spawnSync gives the child no terminal, so it never stops to ask.
const create = (...args) =>
  spawnSync(process.execPath, [CREATE, ...args, "--dir", dir], {
    encoding: "utf8",
  })

test("--help prints the usage line and exits 0", () => {
  const run = create("--help")
  assert.equal(run.status, 0)
  assert.match(run.stdout.split("\n")[0], /^usage: npx github:/)
})

test("with no terminal, a missing value exits 1 and names the flag", () => {
  const run = create("sample-system", "--owner", "sample-owner")
  assert.equal(run.status, 1)
  assert.match(run.stderr, /^missing --prefix/)
  assert.deepEqual(readdirSync(dir), [])
})

test("a value the init script refuses exits 1 and writes nothing", () => {
  const run = create("Sample_System", ...VALUES)
  assert.equal(run.status, 1)
  assert.deepEqual(readdirSync(dir), [])
})

test("a folder that exists and is not empty is refused, untouched", () => {
  mkdirSync(path.join(dir, "sample-system"))
  writeFileSync(path.join(dir, "sample-system/keep.txt"), "mine\n")
  const run = create("sample-system", ...VALUES)
  assert.equal(run.status, 1)
  assert.match(run.stderr, /exists and is not empty/)
  assert.deepEqual(readdirSync(path.join(dir, "sample-system")), ["keep.txt"])
})

test("it writes the template as a new git repository", () => {
  const run = create("sample-system", ...VALUES, "--from", ROOT, "--no-init")
  assert.equal(run.status, 0, run.stderr)
  const made = path.join(dir, "sample-system")
  for (const file of ["package.json", ".gitignore", "scripts/init.mjs", ".git"])
    assert.ok(existsSync(path.join(made, file)), `${file} is missing`)
  const log = spawnSync("git", ["-C", made, "log", "--oneline"], {
    encoding: "utf8",
  })
  assert.notEqual(log.status, 0, "the copy kept the template's history")
})
