import assert from "node:assert/strict"
import { spawnSync } from "node:child_process"
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"
import { afterEach, beforeEach, test } from "node:test"
import { fileURLToPath } from "node:url"

// The create command sets up the folder it is run in (#75): a repo made for
// the system keeps its history and branch, and nothing git cannot give back
// is written over.
const ROOT = fileURLToPath(new URL("..", import.meta.url))
const CREATE = path.join(ROOT, "cli/create.mjs")
const VALUES = ["--prefix", "sds", "--owner", "sample-owner"]
const TEMPLATE_README = readFileSync(path.join(ROOT, "README.md"), "utf8")

let dir
let repo
beforeEach(() => {
  dir = mkdtempSync(path.join(tmpdir(), "create-in-place-"))
  repo = path.join(dir, "sample-system")
  mkdirSync(repo)
})
afterEach(() => {
  rmSync(dir, { recursive: true, force: true })
})

// Run in `cwd`, under a git config of its own, so the machine has no say.
const create = (cwd, ...args) => {
  const gitconfig = path.join(dir, "gitconfig")
  writeFileSync(gitconfig, "[init]\n\tdefaultBranch = trunk\n")
  return spawnSync(
    process.execPath,
    [CREATE, ...VALUES, "--from", ROOT, "--no-init", ...args],
    {
      cwd,
      encoding: "utf8",
      env: {
        ...process.env,
        GIT_CONFIG_GLOBAL: gitconfig,
        GIT_CONFIG_NOSYSTEM: "1",
      },
    },
  )
}
const git = (cwd, ...args) =>
  spawnSync(
    "git",
    ["-C", cwd, "-c", "user.name=t", "-c", "user.email=t@t", ...args],
    { encoding: "utf8" },
  )
// A repo as GitHub makes one: a README and a LICENSE, one commit, on trunk.
const githubRepo = () => {
  git(repo, "init", "--quiet", "--initial-branch", "trunk")
  writeFileSync(path.join(repo, "README.md"), "# sample-system\n")
  writeFileSync(path.join(repo, "LICENSE"), "mine\n")
  git(repo, "add", "-A")
  assert.equal(git(repo, "commit", "--quiet", "-m", "Initial commit").status, 0)
}
const refusesUntouched = (run, before) => {
  assert.equal(run.status, 1)
  assert.doesNotMatch(run.stderr, /^\s+at /m)
  assert.deepEqual(readdirSync(repo).sort(), before)
}

test("#75 with no --dir it sets up the folder it is run in, named after it", () => {
  const run = create(repo)
  assert.equal(run.status, 0, run.stderr)
  assert.ok(existsSync(path.join(repo, "package.json")))
  assert.deepEqual(readdirSync(dir).sort(), ["gitconfig", "sample-system"])
  assert.match(run.stdout, /Next: read it and commit, then run \/setup-system/)
  const check = spawnSync(
    process.execPath,
    [
      path.join(repo, "scripts/init.mjs"),
      "--check",
      "--name",
      "sample-system",
      ...VALUES,
    ],
    { encoding: "utf8" },
  )
  assert.equal(check.status, 0, check.stderr)
})

test("#75 in a clean repo it keeps the history and branch and names what it replaced", () => {
  githubRepo()
  const run = create(repo)
  assert.equal(run.status, 0, run.stderr)
  assert.equal(git(repo, "log", "--format=%s").stdout, "Initial commit\n")
  assert.equal(git(repo, "symbolic-ref", "--short", "HEAD").stdout, "trunk\n")
  assert.equal(
    readFileSync(path.join(repo, "README.md"), "utf8"),
    TEMPLATE_README,
  )
  assert.match(
    run.stdout,
    /, replacing LICENSE, README\.md \(git diff shows what changed\)\./,
  )
  assert.match(git(repo, "status", "--porcelain").stdout, /^ M README\.md$/m)
})

for (const [change, make] of [
  ["a modified file", () => writeFileSync(path.join(repo, "README.md"), "x\n")],
  [
    "an untracked file",
    () => writeFileSync(path.join(repo, "notes.txt"), "x\n"),
  ],
  [
    "a staged file",
    () => {
      writeFileSync(path.join(repo, "notes.txt"), "x\n")
      git(repo, "add", "notes.txt")
    },
  ],
])
  test(`#75 a repo with ${change} is refused, listing it, untouched`, () => {
    githubRepo()
    make()
    const before = readdirSync(repo).sort()
    const readme = readFileSync(path.join(repo, "README.md"), "utf8")
    const run = create(repo)
    refusesUntouched(run, before)
    assert.match(
      run.stderr,
      /has changes git could not give back; commit or stash them first/,
    )
    assert.match(run.stderr, /(README\.md|notes\.txt)$/m)
    assert.equal(readFileSync(path.join(repo, "README.md"), "utf8"), readme)
  })

test("#75 a repo with no commit yet starts on main", () => {
  git(repo, "init", "--quiet", "--initial-branch", "trunk")
  const run = create(repo)
  assert.equal(run.status, 0, run.stderr)
  assert.equal(git(repo, "symbolic-ref", "--short", "HEAD").stdout, "main\n")
})

test("#75 --dir in a repo sets up that folder, made when missing, with no repo of its own", () => {
  githubRepo()
  const run = create(repo, "--dir", "packages/tokens")
  assert.equal(run.status, 0, run.stderr)
  const made = path.join(repo, "packages/tokens")
  assert.ok(existsSync(path.join(made, "package.json")))
  assert.ok(!existsSync(path.join(made, ".git")), "it started a nested repo")
  assert.match(run.stdout, /Next: cd packages\/tokens, read it/)
})
