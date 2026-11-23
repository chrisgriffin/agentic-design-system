import assert from "node:assert/strict"
import { spawnSync } from "node:child_process"
import {
  chmodSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"
import { afterEach, beforeEach, test } from "node:test"
import { fileURLToPath } from "node:url"

// What a copy starts on, and the author the create command names (#68).
const ROOT = fileURLToPath(new URL("..", import.meta.url))
const CREATE = path.join(ROOT, "cli/create.mjs")
const VALUES = ["--prefix", "sds", "--owner", "sample-owner"]

let dir
let gitconfig
beforeEach(() => {
  dir = mkdtempSync(path.join(tmpdir(), "create-branch-"))
  gitconfig = path.join(dir, "gitconfig")
})
afterEach(() => {
  rmSync(dir, { recursive: true, force: true })
})

// The create command under a global git config holding only `config`, so the
// machine running the test has no say.
// `env` adds to that environment.
const create = (config, ...args) => createWith({}, config, ...args)
const createWith = (env, config, ...args) => {
  writeFileSync(gitconfig, config)
  const out = path.join(dir, "out")
  return spawnSync(process.execPath, [CREATE, ...args, "--dir", out], {
    cwd: dir,
    encoding: "utf8",
    env: {
      ...process.env,
      GIT_CONFIG_GLOBAL: gitconfig,
      GIT_CONFIG_NOSYSTEM: "1",
      ...env,
    },
  })
}
const copy = () => path.join(dir, "out/sample-system")
const git = (...args) =>
  spawnSync("git", ["-C", copy(), ...args], { encoding: "utf8" })

// The branches a workflow's `on.push` lists, read from its YAML.
const pushBranches = file => {
  const yaml = readFileSync(path.join(copy(), file), "utf8")
  const push = yaml.match(/^ {2}push:\n((?: {4,}.*\n)+)/m)?.[1] ?? ""
  return [...push.matchAll(/^ {6}- (\S+)$|\[([^\]]+)\]/gm)].flatMap(m =>
    (m[1] ?? m[2]).split(",").map(b => b.trim()),
  )
}

for (const machineDefault of ["master", "trunk"])
  test(`#68 a copy starts on main when git's default branch is ${machineDefault}`, () => {
    const run = create(
      `[init]\n\tdefaultBranch = ${machineDefault}\n`,
      "sample-system",
      ...VALUES,
      "--from",
      ROOT,
      "--no-init",
    )
    assert.equal(run.status, 0, run.stderr)
    const head = git("symbolic-ref", "--short", "HEAD")
    assert.equal(head.stdout.trim(), "main")
  })

test("#68 the branch a copy starts on is one its build check runs on", () => {
  const run = create(
    "",
    "sample-system",
    ...VALUES,
    "--from",
    ROOT,
    "--no-init",
  )
  assert.equal(run.status, 0, run.stderr)
  const branch = git("symbolic-ref", "--short", "HEAD").stdout.trim()
  assert.ok(
    pushBranches(".github/workflows/build-check.yml").includes(branch),
    `build-check.yml does not run on a push to ${branch}`,
  )
})

// A git on PATH that refuses --initial-branch as git before 2.28 does, and
// passes everything else to the real one.
const oldGit = () => {
  const real = spawnSync("sh", ["-c", "command -v git"], {
    encoding: "utf8",
  }).stdout.trim()
  const bin = path.join(dir, "bin")
  mkdirSync(bin)
  writeFileSync(
    path.join(bin, "git"),
    `#!/bin/sh
for a in "$@"; do
  case "$a" in
    --initial-branch*) echo "error: unknown option \\\`$a'" >&2; exit 129 ;;
  esac
done
exec "${real}" "$@"
`,
  )
  chmodSync(path.join(bin, "git"), 0o755)
  return { PATH: `${bin}${path.delimiter}${process.env.PATH}` }
}

test("#68 a copy starts on main with a git older than 2.28", () => {
  const run = createWith(
    oldGit(),
    "[init]\n\tdefaultBranch = master\n",
    "sample-system",
    ...VALUES,
    "--from",
    ROOT,
    "--no-init",
  )
  assert.equal(run.status, 0, run.stderr)
  const head = git("symbolic-ref", "--short", "HEAD")
  assert.equal(head.stdout.trim(), "main")
})

// A one-commit template repository whose init script records its arguments,
// and exits 1 after recording them when `failing`.
const withTemplate = (use, { failing = false } = {}) => {
  const template = path.join(dir, "template")
  mkdirSync(path.join(template, "scripts"), { recursive: true })
  writeFileSync(
    path.join(template, "scripts/init.mjs"),
    `import { writeFileSync } from "node:fs"
if (!process.argv.includes("--check")) {
  writeFileSync("argv.json", JSON.stringify(process.argv.slice(2)))
  ${failing ? "process.exit(1)" : ""}
}
`,
  )
  const run = (...args) =>
    spawnSync(
      "git",
      ["-C", template, "-c", "user.name=t", "-c", "user.email=t@t", ...args],
      { encoding: "utf8" },
    )
  run("init", "--quiet")
  run("add", "-A")
  assert.equal(run("commit", "--quiet", "-m", "template").status, 0)
  use(template)
}
const initAuthor = () => {
  const argv = JSON.parse(readFileSync(path.join(copy(), "argv.json"), "utf8"))
  return argv.includes("--author")
    ? argv[argv.indexOf("--author") + 1]
    : undefined
}

test("#68 with no --author, the output names git's user.name as the LICENSE holder", () => {
  withTemplate(template => {
    const run = create(
      "[user]\n\tname = sample-bot[bot]\n",
      "sample-system",
      ...VALUES,
      "--from",
      template,
    )
    assert.equal(run.status, 0, run.stderr)
    assert.match(
      run.stdout,
      /^LICENSE names sample-bot\[bot\] as the copyright holder, from git's user\.name; pass --author to name someone else\.$/m,
    )
    assert.equal(initAuthor(), "sample-bot[bot]", "init wrote another name")
  })
})

test("#68 with no --author and no git user.name, the output names the owner", () => {
  withTemplate(template => {
    const run = create("", "sample-system", ...VALUES, "--from", template)
    assert.equal(run.status, 0, run.stderr)
    assert.match(
      run.stdout,
      /^LICENSE names sample-owner as the copyright holder, from --owner; pass --author to name someone else\.$/m,
    )
    assert.equal(initAuthor(), "sample-owner")
  })
})

test("#68 with --author, the output says nothing about where it came from", () => {
  withTemplate(template => {
    const run = create(
      "[user]\n\tname = sample-bot[bot]\n",
      "sample-system",
      ...VALUES,
      "--author",
      "Sample Author",
      "--from",
      template,
    )
    assert.equal(run.status, 0, run.stderr)
    assert.doesNotMatch(run.stdout, /^LICENSE names/m)
    assert.equal(initAuthor(), "Sample Author")
  })
})

test("#68 when init fails, the retry line carries the author the output named", () => {
  withTemplate(
    template => {
      const run = create(
        "[user]\n\tname = Sample Bot\n",
        "sample-system",
        ...VALUES,
        "--from",
        template,
      )
      assert.notEqual(run.status, 0)
      assert.match(
        run.stdout,
        /^LICENSE names Sample Bot as the copyright holder, from git's user\.name;/m,
      )
      assert.match(
        run.stderr,
        /^ {2}node scripts\/init\.mjs .* --author 'Sample Bot'(?: |$)/m,
      )
      assert.equal(initAuthor(), "Sample Bot")
    },
    { failing: true },
  )
})
