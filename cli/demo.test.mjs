import assert from "node:assert/strict"
import { execFileSync, spawnSync } from "node:child_process"
import {
  copyFileSync,
  existsSync,
  mkdirSync,
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

// The closing row naming the folder the demo ends on (#88).
const endsOn = (stdout, f) =>
  stdout
    .split("\n")
    .some(
      line => line.replace(/^ {4}Demo +/, "") === f && /^ {4}Demo /.test(line),
    )

test("the demo sets up demo-ds in the temp folder and ends on its path and git status", () => {
  const run = demo(...VALUES)
  assert.equal(run.status, 0, run.stderr)
  assert.ok(existsSync(path.join(folder(), "scripts/init.mjs")))
  assert.ok(endsOn(run.stdout, folder()), run.stdout)
  // A new repository with nothing committed: every file is untracked.
  assert.match(run.stdout, /^ {4}git status {2}\d+ untracked$/m)
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

// The create command clones, so an uncommitted change is not in the template
// it copies (the create command itself runs from disk). A clone of this checkout is clean whatever this checkout holds, so the
// clean run and the dirty one are both its.
const cleanCheckout = () => {
  const checkout = path.join(dir, "checkout")
  execFileSync("git", ["clone", "--quiet", ROOT, checkout])
  // The clone holds the demo as committed here; this run tests the files on
  // disk: the demo and the create command it runs, with the flags they share.
  const files = ["cli/demo.mjs", "cli/create.mjs", "cli/defaults.mjs"]
  for (const file of files)
    copyFileSync(path.join(ROOT, file), path.join(checkout, file))
  execFileSync("git", [
    "-C",
    checkout,
    "update-index",
    "--assume-unchanged",
    ...files,
  ])
  return checkout
}

test("a checkout with uncommitted changes is warned before the run, and a clean one is not", () => {
  const checkout = cleanCheckout()
  const clean = demoIn(checkout, ...VALUES)
  assert.equal(clean.status, 0, clean.stderr)
  assert.doesNotMatch(clean.stderr, /uncommitted changes/)
  writeFileSync(path.join(checkout, "uncommitted.txt"), "not committed")
  const dirty = demoIn(checkout, ...VALUES)
  assert.equal(dirty.status, 0, dirty.stderr)
  assert.match(
    dirty.stderr,
    /uncommitted changes; the template the demo copies is its last commit/,
  )
})

// A passed-through --dir wins (FR-002), so the closing lines are about the
// folder it names, and that folder is never wiped: it is the person's.
test("a passed-through --dir is the folder the demo sets up and reports on", () => {
  writeFileSync(path.join(dir, "keep.txt"), "")
  mkdirSync(folder())
  writeFileSync(path.join(folder(), "untouched.txt"), "")
  const first = path.join(dir, "first")
  const named = path.join(dir, "named")
  const run = demo(...VALUES, "--dir", first, "--dir", named)
  assert.equal(run.status, 0, run.stderr)
  assert.ok(existsSync(path.join(named, "scripts/init.mjs")))
  assert.ok(!existsSync(first))
  assert.ok(existsSync(path.join(folder(), "untouched.txt")))
  assert.ok(endsOn(run.stdout, named), run.stdout)
  assert.match(run.stdout, /^ {4}git status {2}\d+ untracked$/m)
})

test("a --dir the create command refuses is left as it was", () => {
  const named = path.join(dir, "named")
  mkdirSync(named)
  writeFileSync(path.join(named, "mine.txt"), "")
  const run = demo(...VALUES, "--dir", named)
  assert.equal(run.status, 1)
  assert.ok(existsSync(path.join(named, "mine.txt")))
  assert.ok(endsOn(run.stdout, named), run.stdout)
  assert.doesNotMatch(run.stdout, /git status/)
})

test("--dir as another flag's value names no folder", () => {
  const run = demo(...VALUES, "--author", "--dir")
  assert.equal(run.status, 0, run.stderr)
  assert.ok(existsSync(path.join(folder(), "scripts/init.mjs")))
  assert.ok(endsOn(run.stdout, folder()), run.stdout)
})

// --clean removes the demo's own folder and nothing else (#90).
test("--clean removes demo-ds and runs nothing else, and says so when nothing is there", () => {
  assert.equal(demo(...VALUES).status, 0)
  assert.ok(existsSync(folder()))
  const run = demo("--clean")
  assert.equal(run.status, 0, run.stderr)
  assert.ok(!existsSync(folder()))
  // One line and nothing else: the create command never ran.
  assert.equal(run.stdout, `  ✓ Removed   ${folder()}\n`)
  const again = demo("--clean")
  assert.equal(again.status, 0, again.stderr)
  assert.equal(again.stdout, `  ✓ Clean     nothing at ${folder()}\n`)
})

// FR-001: --clean runs nothing else, the uncommitted-changes warning included.
test("--clean in a checkout with uncommitted changes removes demo-ds without the warning", () => {
  const checkout = cleanCheckout()
  writeFileSync(path.join(checkout, "uncommitted.txt"), "not committed")
  mkdirSync(folder())
  const run = demoIn(checkout, "--clean")
  assert.equal(run.status, 0, run.stderr)
  assert.equal(run.stderr, "")
  assert.equal(run.stdout, `  ✓ Removed   ${folder()}\n`)
  assert.ok(!existsSync(folder()))
})

// --clean is the demo's flag only in a flag's place: as a free-text flag's
// value it is that value, and the demo runs as it would with any other.
for (const flag of ["--description", "--author"])
  test(`--clean as ${flag}'s value is that value, and the demo runs`, () => {
    const run = demo(...VALUES, flag, "--clean")
    assert.equal(run.status, 0, run.stderr)
    assert.doesNotMatch(run.stderr, /--clean takes no other argument/)
    assert.ok(existsSync(path.join(folder(), "scripts/init.mjs")))
    assert.ok(endsOn(run.stdout, folder()), run.stdout)
  })

// After a flag that takes no value from a dash word, --clean is a flag again,
// as the create command reads it: refused, since it is not alone.
test("--clean after --dir is --clean, and is refused with the other argument", () => {
  mkdirSync(folder())
  const run = demo("--dir", "--clean")
  assert.equal(run.status, 1)
  assert.match(run.stderr, /^ {2}✗ --clean takes no other argument/m)
  assert.ok(existsSync(folder()))
})

test("--clean with another argument is refused and removes nothing", () => {
  const mine = path.join(dir, "mine")
  mkdirSync(mine)
  writeFileSync(path.join(mine, "keep.txt"), "the person's own")
  mkdirSync(folder())
  const run = demo("--clean", "--dir", mine)
  assert.equal(run.status, 1)
  assert.match(run.stderr, /^ {2}✗ --clean takes no other argument/m)
  assert.ok(existsSync(path.join(mine, "keep.txt")))
  assert.ok(existsSync(folder()))
})

// npm run demo:clean is npm run demo -- --clean with no -- to forget (#92).
test("npm run demo:clean removes demo-ds", () => {
  mkdirSync(folder())
  const run = spawnSync("npm", ["run", "--silent", "demo:clean"], {
    cwd: ROOT,
    encoding: "utf8",
    env: { ...process.env, TMPDIR: dir },
  })
  assert.equal(run.status, 0, run.stderr)
  assert.ok(!existsSync(folder()))
  assert.match(run.stdout, /^ {2}✓ Removed {3}/m)
})
