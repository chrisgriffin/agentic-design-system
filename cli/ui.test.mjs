import assert from "node:assert/strict"
import { spawnSync } from "node:child_process"
import {
  chmodSync,
  copyFileSync,
  mkdirSync,
  mkdtempSync,
  rmSync,
  writeFileSync,
} from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"
import { afterEach, test } from "node:test"
import { fileURLToPath } from "node:url"

import {
  failure,
  header,
  next,
  prompt,
  rows,
  tick,
  title,
  warn,
} from "./ui.mjs"

// The create command's, init's and the demo's own output (#88).
const ROOT = fileURLToPath(new URL("..", import.meta.url))
const ESC = "\x1b["
const all = () => [
  title("agentic-ds", "new design system"),
  tick("Template", "~/code/agentic-ds"),
  prompt("Your GitHub username", "octocat"),
  header("npm ci"),
  rows([["Prefix", "--dd-"]]),
  next(["read the diff, then commit"]),
  warn("uncommitted changes"),
  failure("npm ci failed"),
]

// The streams as a terminal would show them, for the length of one call.
const asTerminal = (env, call) => {
  const before = [
    process.stdout.isTTY,
    process.stderr.isTTY,
    process.env.NO_COLOR,
  ]
  process.stdout.isTTY = process.stderr.isTTY = true
  if (env.NO_COLOR === undefined) delete process.env.NO_COLOR
  else process.env.NO_COLOR = env.NO_COLOR
  try {
    return call()
  } finally {
    ;[process.stdout.isTTY, process.stderr.isTTY] = before
    if (before[2] === undefined) delete process.env.NO_COLOR
    else process.env.NO_COLOR = before[2]
  }
}

let dir
afterEach(() => {
  if (dir) rmSync(dir, { recursive: true, force: true })
  dir = undefined
})

test("piped, the output holds no escape codes", () => {
  for (const text of all()) assert.ok(!text.includes(ESC), JSON.stringify(text))
})

test("on a terminal it is in color, and NO_COLOR turns that off", () => {
  assert.ok(asTerminal({}, () => tick("Template").includes(ESC)))
  assert.ok(asTerminal({}, () => failure("x").includes(ESC)))
  for (const text of asTerminal({ NO_COLOR: "1" }, all))
    assert.ok(!text.includes(ESC), JSON.stringify(text))
})

test("rows line up their keys and leave out an undefined value", () => {
  assert.equal(
    rows([
      ["Prefix", "--dd-"],
      ["Figma", undefined],
      ["Rewritten", "36 files"],
    ]),
    "    Prefix     --dd-\n    Rewritten  36 files",
  )
})

test("next numbers its steps, a step's second line under its text, the last step last", () => {
  const text = next(["cd demo-ds", "run /setup-system\n(a note)"])
  assert.equal(
    text,
    "\n  Next\n    1  cd demo-ds\n    2  run /setup-system\n       (a note)",
  )
})

test("a failure marks its first line, after any blank lines", () => {
  assert.equal(failure("\ncanceled"), "\n  ✗ canceled")
})

test("a step piped prints only its done line", () => {
  const run = spawnSync(
    process.execPath,
    [
      "--input-type=module",
      "-e",
      `import { pending } from ${JSON.stringify(path.join(ROOT, "cli/ui.mjs"))}
      pending("Template", "here")()`,
    ],
    { encoding: "utf8" },
  )
  assert.equal(run.stdout, "  ✓ Template  here\n")
})

// A pending step on a terminal `columns` wide; what it writes, escapes kept.
const pendingOn = (columns, label, detail) =>
  spawnSync(
    process.execPath,
    [
      "--input-type=module",
      "-e",
      `process.stdout.isTTY = true
      process.stdout.columns = ${columns}
      const { pending } = await import(${JSON.stringify(path.join(ROOT, "cli/ui.mjs"))})
      pending(${JSON.stringify(label)}, ${JSON.stringify(detail)})()`,
    ],
    { encoding: "utf8", env: { ...process.env, NO_COLOR: "" } },
  ).stdout

test("on a terminal a pending step that fits is cleared before its done line", () => {
  const text = pendingOn(80, "Folder", "/tmp/demo-ds")
  assert.match(text, /◇/)
  assert.ok(text.includes("\r\x1b[2K"), JSON.stringify(text))
  assert.match(text, /✓/)
})

test("a pending step as wide as the terminal or wider is not written, so nothing wraps", () => {
  const deep = `/var/folders/xy/${"a".repeat(40)}/T/demo-ds`
  for (const [columns, detail] of [
    [80, deep],
    // exactly the terminal's width: the cursor would wrap onto a new row
    [`  ◇ Folder    `.length + 10, "x".repeat(10)],
    // wide characters take two columns each
    [40, "/tmp/".concat("設計".repeat(10))],
    // a terminal that reports no width
    [0, "/tmp/demo-ds"],
  ]) {
    const text = pendingOn(columns, "Folder", detail)
    assert.doesNotMatch(text, /◇/, `${columns}: ${detail}`)
    assert.ok(!text.includes("\x1b[2K"), `${columns}: ${detail}`)
    assert.match(text, /✓/)
  }
})

// A one-commit template repository: the --no-init copy with this checkout's
// init script and its helpers on disk, so a create run clones what is tested.
const madeCopy = () => {
  dir = mkdtempSync(path.join(tmpdir(), "ui-"))
  const made = path.join(dir, "sample-system")
  const copy = spawnSync(
    process.execPath,
    [
      path.join(ROOT, "cli/create.mjs"),
      "--prefix",
      "sds",
      "--owner",
      "sample-owner",
      "--from",
      ROOT,
      "--dir",
      made,
      "--no-init",
    ],
    { encoding: "utf8" },
  )
  assert.equal(copy.status, 0, copy.stderr)
  // The clone is the last commit; the init script and its helpers on disk are
  // what this test is for.
  for (const rel of ["scripts/init.mjs", "cli/ui.mjs", "cli/defaults.mjs"])
    copyFileSync(path.join(ROOT, rel), path.join(made, rel))
  return made
}

// An npm that always fails, first on the path, so init stops at npm ci.
const failingNpm = () => {
  const bin = path.join(dir, "bin")
  mkdirSync(bin)
  writeFileSync(path.join(bin, "npm"), "#!/bin/sh\nexit 3\n")
  chmodSync(path.join(bin, "npm"), 0o755)
  return { ...process.env, PATH: `${bin}${path.delimiter}${process.env.PATH}` }
}

const INIT_ARGS = [
  "scripts/init.mjs",
  "--name",
  "sample-system",
  "--prefix",
  "sds",
  "--owner",
  "sample-owner",
]

test("init's failed command is one line naming it, exit 1, no stack trace", () => {
  const made = madeCopy()
  const env = failingNpm()
  const init = spawnSync(process.execPath, INIT_ARGS, {
    cwd: made,
    encoding: "utf8",
    env,
  })
  assert.equal(init.status, 1)
  assert.match(init.stdout, /── npm ci --no-audit --no-fund ─+/)
  assert.match(
    init.stderr,
    /^ {2}✗ npm ci --no-audit --no-fund failed; fix the cause, then run init again\.$/m,
  )
  assert.doesNotMatch(init.stderr, /^\s+at /m)
})

test("under the create command, init hands its failed command back on fd 3 and prints no ✗", () => {
  const made = madeCopy()
  const env = { ...failingNpm(), CREATE_AGENTIC_DS: "1" }
  const handed = spawnSync(process.execPath, INIT_ARGS, {
    cwd: made,
    env,
    stdio: ["ignore", "pipe", "pipe", "pipe"],
  })
  assert.equal(handed.status, 1)
  assert.equal(handed.output[3].toString(), "npm ci --no-audit --no-fund")
  assert.doesNotMatch(handed.stderr.toString(), /✗/)
  // With no fd 3 open, as under an older create command, init says it itself.
  const alone = spawnSync(process.execPath, INIT_ARGS, {
    cwd: made,
    env,
    encoding: "utf8",
  })
  assert.equal(alone.status, 1)
  assert.match(
    alone.stderr,
    /^ {2}✗ npm ci --no-audit --no-fund failed; fix the cause, then run init again\.$/m,
  )
})

test("a create run whose init fails ends on one ✗ line naming the command, with the retry", () => {
  const made = madeCopy()
  const git = (...args) =>
    spawnSync(
      "git",
      ["-C", made, "-c", "user.name=t", "-c", "user.email=t@t", ...args],
      { encoding: "utf8" },
    )
  git("add", "-A")
  assert.equal(git("commit", "--quiet", "-m", "template").status, 0)
  const target = path.join(dir, "from-create")
  const run = spawnSync(
    process.execPath,
    [
      path.join(ROOT, "cli/create.mjs"),
      "--prefix",
      "sds",
      "--owner",
      "sample-owner",
      "--author",
      "Sample Author",
      "--from",
      made,
      "--dir",
      target,
    ],
    { encoding: "utf8", env: failingNpm() },
  )
  assert.equal(run.status, 1)
  const marks = run.stderr.match(/✗.*/g) ?? []
  assert.equal(marks.length, 1, run.stderr)
  assert.match(
    marks[0],
    /its init script failed at npm ci --no-audit --no-fund\. Fix the cause, then run it again there:$/,
  )
  assert.match(
    run.stderr,
    /^ {2}node scripts\/init\.mjs .*--author 'Sample Author'/m,
  )
  assert.doesNotMatch(run.stderr, /^\s+at /m)
})
