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

test("init's failed command is one line naming it, exit 1, no stack trace", () => {
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
  // An npm that always fails, first on the path, so init stops at npm ci.
  const bin = path.join(dir, "bin")
  mkdirSync(bin)
  writeFileSync(path.join(bin, "npm"), "#!/bin/sh\nexit 3\n")
  chmodSync(path.join(bin, "npm"), 0o755)
  const init = spawnSync(
    process.execPath,
    [
      "scripts/init.mjs",
      "--name",
      "sample-system",
      "--prefix",
      "sds",
      "--owner",
      "sample-owner",
    ],
    {
      cwd: made,
      encoding: "utf8",
      env: {
        ...process.env,
        PATH: `${bin}${path.delimiter}${process.env.PATH}`,
      },
    },
  )
  assert.equal(init.status, 1)
  assert.match(init.stdout, /── npm ci --no-audit --no-fund ─+/)
  assert.match(
    init.stderr,
    /^ {2}✗ npm ci --no-audit --no-fund failed; fix the cause, then run init again\.$/m,
  )
  assert.doesNotMatch(init.stderr, /^\s+at /m)
})
