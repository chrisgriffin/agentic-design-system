import assert from "node:assert/strict"
import { spawnSync } from "node:child_process"
import {
  chmodSync,
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
// The create command clones the committed template, so that is what lands.
const TEMPLATE_README = spawnSync(
  "git",
  ["-C", ROOT, "show", "HEAD:README.md"],
  {
    encoding: "utf8",
  },
).stdout

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
const createWith = (env, cwd, ...args) => {
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
        ...env,
      },
    },
  )
}
const create = (cwd, ...args) => createWith({}, cwd, ...args)
// A git on PATH that runs `script` (sh, with "$@" the arguments and $real the
// real git) before handing everything to the real one.
const wrappedGit = script => {
  const real = spawnSync("sh", ["-c", "command -v git"], {
    encoding: "utf8",
  }).stdout.trim()
  const bin = path.join(dir, "bin")
  mkdirSync(bin)
  writeFileSync(
    path.join(bin, "git"),
    `#!/bin/sh\nreal="${real}"\n${script}\nexec "$real" "$@"\n`,
  )
  chmodSync(path.join(bin, "git"), 0o755)
  return { PATH: `${bin}${path.delimiter}${process.env.PATH}` }
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

// An ignored file is one git holds no copy of, in each place the setup reaches
// it: the init script's #44 step, the copy, and the removal of specs/.
for (const [what, ignore, file] of [
  ["node_modules", "node_modules/\n", "node_modules/x/index.js"],
  ["file at a template path", "package-lock.json\n", "package-lock.json"],
  ["file under specs/", "specs/notes.md\n", "specs/notes.md"],
])
  test(`#75 a repo with an ignored ${what} is refused, listing it, untouched`, () => {
    githubRepo()
    writeFileSync(path.join(repo, ".gitignore"), ignore)
    git(repo, "add", ".gitignore")
    git(repo, "commit", "--quiet", "-m", "ignore")
    mkdirSync(path.dirname(path.join(repo, file)), { recursive: true })
    writeFileSync(path.join(repo, file), "mine\n")
    const before = readdirSync(repo).sort()
    const run = create(repo)
    refusesUntouched(run, before)
    assert.match(
      run.stderr,
      /holds files git ignores, so git could not give them back; move them out first\. Nothing was written\./,
    )
    assert.match(run.stderr, new RegExp(`^!! ${file.split("/")[0]}`, "m"))
    assert.equal(readFileSync(path.join(repo, file), "utf8"), "mine\n")
  })

test("#75 a git status that fails is one message, nothing written", () => {
  githubRepo()
  writeFileSync(path.join(repo, ".git/index"), "not an index")
  const before = readdirSync(repo).sort()
  const run = create(repo)
  refusesUntouched(run, before)
  assert.match(
    run.stderr,
    /^reading git status in .+ failed; nothing was written\.$/m,
  )
})

for (const [what, script, said] of [
  [
    "starting a repository",
    'test "$3" = init && { echo "fatal: no init" >&2; exit 128; }',
    /, but starting a git repository there failed\. Run git init /,
  ],
  [
    "pointing it at main",
    'test "$3" = symbolic-ref && { echo "fatal: no ref" >&2; exit 128; }',
    /, but pointing its repository at main failed\. Run git symbolic-ref /,
  ],
])
  test(`#75 a git failure ${what} after the copy is one message saying what to run`, () => {
    const run = createWith(wrappedGit(script), repo)
    assert.equal(run.status, 1)
    assert.doesNotMatch(run.stderr, /^\s+at /m)
    assert.match(run.stderr, said)
    assert.match(run.stderr, /^fatal: no (init|ref)$/m)
  })

test("#75 a failed copy removes the folders it made on the way to --dir", () => {
  // While the template is cloned, a file appears where the folder goes, so
  // the copy fails after it made the folders above it.
  const env = wrappedGit(
    'if [ "$1" = clone ]; then mkdir -p "$(dirname "$BLOCK")" && : > "$BLOCK"; fi',
  )
  const run = createWith(
    { ...env, BLOCK: path.join(dir, "a/b/sample-system") },
    dir,
    "--dir",
    "a/b/sample-system",
  )
  assert.equal(run.status, 1)
  assert.doesNotMatch(run.stderr, /^\s+at /m)
  assert.match(
    run.stderr,
    /^copying the template into .+ failed; nothing was written\.$/m,
  )
  assert.ok(!existsSync(path.join(dir, "a")), "it left a/b/ behind")
})
