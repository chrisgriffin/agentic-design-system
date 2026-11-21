import assert from "node:assert/strict"
import { spawnSync } from "node:child_process"
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"
import { afterEach, beforeEach, test } from "node:test"
import { fileURLToPath } from "node:url"

import { gitUserName, ownerFrom, prefixFrom } from "./defaults.mjs"

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

// A refusal is one message, never a stack trace.
const refusesCleanly = run => {
  assert.equal(run.status, 1)
  assert.doesNotMatch(run.stderr, /^\s+at /m)
}

test("--help prints the usage line and exits 0", () => {
  const run = create("--help")
  assert.equal(run.status, 0)
  assert.match(run.stdout.split("\n")[0], /^usage: npx github:/)
})

test("--help calls --owner your GitHub username", () => {
  assert.match(create("--help").stdout, /--owner {7}your GitHub username\n/)
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

test("init in a copy with node_modules and no committed lock stops unchanged (#44)", () => {
  const run = create("sample-system", ...VALUES, "--from", ROOT, "--no-init")
  assert.equal(run.status, 0, run.stderr)
  const made = path.join(dir, "sample-system")
  mkdirSync(path.join(made, "node_modules"))
  const manifest = readFileSync(path.join(made, "package.json"), "utf8")
  const init = spawnSync(
    process.execPath,
    ["scripts/init.mjs", "--name", "sample-system", ...VALUES],
    { cwd: made, encoding: "utf8" },
  )
  refusesCleanly(init)
  assert.match(init.stderr, /^#44: node_modules exists/)
  assert.equal(readFileSync(path.join(made, "package.json"), "utf8"), manifest)
  assert.ok(existsSync(path.join(made, "scripts/init.mjs")))
})

test("an unknown option is refused with the usage, before any write", () => {
  for (const args of [
    ["--figma", "abc", "sample-system"],
    ["sample-system", "-x"],
    ["sample-system", "--figma-file=abc"],
  ]) {
    const run = create(...args, ...VALUES)
    refusesCleanly(run)
    assert.match(run.stderr, /^unknown option /)
    assert.match(run.stderr, /usage: /)
  }
  assert.deepEqual(readdirSync(dir), [])
})

test("a value flag with no value, or a second name, is refused", () => {
  for (const [args, message] of [
    [
      ["sample-system", "--owner", "sample-owner", "--prefix"],
      /^--prefix needs a value/,
    ],
    [
      ["sample-system", "--prefix", "--owner", "sample-owner"],
      /^--prefix needs a value/,
    ],
    [["sample-system", "other", ...VALUES], /^one name only/],
  ]) {
    const run = spawnSync(process.execPath, [CREATE, ...args], {
      encoding: "utf8",
      cwd: dir,
    })
    refusesCleanly(run)
    assert.match(run.stderr, message)
  }
  assert.deepEqual(readdirSync(dir), [])
})

test("a target that is a file is refused, untouched", () => {
  writeFileSync(path.join(dir, "sample-system"), "mine\n")
  const run = create("sample-system", ...VALUES)
  refusesCleanly(run)
  assert.match(run.stderr, /exists and is not a folder; nothing was written/)
  assert.deepEqual(readdirSync(dir), ["sample-system"])
})

test("an empty target folder is used", () => {
  mkdirSync(path.join(dir, "sample-system"))
  const run = create("sample-system", ...VALUES, "--from", ROOT, "--no-init")
  assert.equal(run.status, 0, run.stderr)
  assert.ok(existsSync(path.join(dir, "sample-system/package.json")))
  assert.deepEqual(readdirSync(dir), ["sample-system"])
})

test("the next step names the folder it made, wherever --dir put it", () => {
  const run = create("sample-system", ...VALUES, "--from", ROOT, "--no-init")
  assert.equal(run.status, 0, run.stderr)
  const made = path.join(dir, "sample-system")
  assert.ok(run.stdout.includes(`Next: cd ${made},`), run.stdout)
})

test("a clone that fails exits 1 and leaves nothing behind", () => {
  const run = create(
    "sample-system",
    ...VALUES,
    "--from",
    path.join(dir, "no-such-template"),
    "--no-init",
  )
  refusesCleanly(run)
  assert.match(run.stderr, /^cloning .* failed; nothing was written/)
  assert.deepEqual(readdirSync(dir), [])
})

test("with no git on PATH it exits 1 saying so and leaves nothing behind", () => {
  const bin = mkdtempSync(path.join(tmpdir(), "create-bin-"))
  try {
    symlinkSync(process.execPath, path.join(bin, "node"))
    const run = spawnSync(
      process.execPath,
      [CREATE, "sample-system", ...VALUES, "--from", ROOT, "--dir", dir],
      { encoding: "utf8", env: { ...process.env, PATH: bin } },
    )
    refusesCleanly(run)
    assert.match(run.stderr, /git was not found on PATH/)
    assert.deepEqual(readdirSync(dir), [])
  } finally {
    rmSync(bin, { recursive: true, force: true })
  }
})

// A one-commit template repository whose scripts/init.mjs is `source`.
const withTemplate = (source, use) => {
  const template = mkdtempSync(path.join(tmpdir(), "create-template-"))
  try {
    mkdirSync(path.join(template, "scripts"))
    writeFileSync(path.join(template, "scripts/init.mjs"), source)
    const git = (...args) =>
      spawnSync(
        "git",
        ["-C", template, "-c", "user.name=t", "-c", "user.email=t@t", ...args],
        { encoding: "utf8" },
      )
    git("init", "--quiet")
    git("add", "-A")
    assert.equal(git("commit", "--quiet", "-m", "template").status, 0)
    use(template)
  } finally {
    rmSync(template, { recursive: true, force: true })
  }
}

test("the cloned template's own init script decides before the copy is kept", () => {
  // A template whose init script refuses every value, as another version of
  // the template might refuse values this copy accepts.
  withTemplate(
    "process.exit(process.argv.includes('--check') ? 1 : 0)\n",
    template => {
      const run = create("sample-system", ...VALUES, "--from", template)
      refusesCleanly(run)
      assert.match(run.stderr, /cloned template's init script refuses them/)
      assert.deepEqual(readdirSync(dir), [])
    },
  )
})

test("--author and --description reach the init script as given (#49)", () => {
  // A template whose init script records the arguments of its real run.
  withTemplate(
    `import { writeFileSync } from "node:fs"
if (!process.argv.includes("--check"))
  writeFileSync("argv.json", JSON.stringify(process.argv.slice(2)))
`,
    template => {
      const run = create(
        "sample-system",
        ...VALUES,
        "--author",
        "Sample Author",
        "--description",
        "Sample tokens.",
        "--from",
        template,
      )
      assert.equal(run.status, 0, run.stderr)
      const argv = JSON.parse(
        readFileSync(path.join(dir, "sample-system/argv.json"), "utf8"),
      )
      const value = f => argv[argv.indexOf(f) + 1]
      assert.equal(value("--author"), "Sample Author")
      assert.equal(value("--description"), "Sample tokens.")
    },
  )
})

test("an author or description that starts with - reaches the init script as text (#49)", () => {
  withTemplate(
    `import { writeFileSync } from "node:fs"
if (!process.argv.includes("--check"))
  writeFileSync("argv.json", JSON.stringify(process.argv.slice(2)))
`,
    template => {
      for (const [f, text] of [
        ["--description", "- tokens for the web"],
        ["--description", "--fleet"],
        ["--description", "-h"],
        ["--author", "-x"],
        ["--author", "--help"],
      ]) {
        const made = path.join(dir, "sample-system")
        const run = create(
          "sample-system",
          ...VALUES,
          f,
          text,
          "--from",
          template,
        )
        assert.equal(run.status, 0, `${f} ${text}: ${run.stderr}`)
        const argv = JSON.parse(
          readFileSync(path.join(made, "argv.json"), "utf8"),
        )
        assert.equal(argv[argv.indexOf(f) + 1], text)
        assert.equal(argv.filter(a => a === text).length, 1, argv.join(" "))
        rmSync(made, { recursive: true, force: true })
      }
    },
  )
})

// The init script's own parser, asked through --check as the create command asks it.
const INIT = path.join(ROOT, "scripts/init.mjs")
const check = (...args) =>
  spawnSync(
    process.execPath,
    [INIT, "--name", "sample-system", ...VALUES, ...args, "--check"],
    { encoding: "utf8" },
  )

test("the init script reads a value after --author or --description as text (#49)", () => {
  for (const [f, text] of [
    ["--description", "- tokens for the web"],
    ["--description", "--fleet"],
    ["--description", "--help"],
    ["--author", "-h"],
  ]) {
    const run = check(f, text)
    assert.equal(run.status, 0, `${f} ${text}: ${run.stderr}`)
    assert.equal(run.stdout, "", `${f} ${text} printed the usage`)
  }
})

test("the init script refuses --author or --description with no value (#49)", () => {
  for (const f of ["--author", "--description"]) {
    const run = spawnSync(
      process.execPath,
      [INIT, "--check", "--name", "sample-system", ...VALUES, f],
      { encoding: "utf8" },
    )
    refusesCleanly(run)
    assert.match(run.stderr, /^usage: /)
    const missing = spawnSync(
      process.execPath,
      [CREATE, "sample-system", ...VALUES, f],
      { encoding: "utf8", cwd: dir },
    )
    refusesCleanly(missing)
    assert.match(missing.stderr, new RegExp(`^${f} needs a value`))
  }
  assert.deepEqual(readdirSync(dir), [])
})

test("#52 the init script refuses an argument it does not recognize, naming it", () => {
  for (const args of [
    ["--auther", "Jane"],
    ["--bogus"],
    ["-x"],
    ["--figma-file=abc"],
    ["stray"],
  ]) {
    const run = check(...args)
    refusesCleanly(run)
    assert.match(
      run.stderr,
      new RegExp(`^unknown argument ${args[0]}\n\nusage: `),
      args.join(" "),
    )
    assert.equal(run.stdout, "", `${args.join(" ")} printed to stdout`)
  }
  // Without --check it stops before it writes anything. The first write is the
  // lock restore a copy with a node_modules gets (#44), so the refusal must
  // come before that step's own stop. The copy is cloned from the committed
  // template, so it is handed this checkout's script.
  const made = path.join(dir, "sample-system")
  const copy = create("sample-system", ...VALUES, "--from", ROOT, "--no-init")
  assert.equal(copy.status, 0, copy.stderr)
  writeFileSync(path.join(made, "scripts/init.mjs"), readFileSync(INIT))
  mkdirSync(path.join(made, "node_modules"))
  const manifest = readFileSync(path.join(made, "package.json"), "utf8")
  const init = spawnSync(
    process.execPath,
    [
      "scripts/init.mjs",
      "--name",
      "sample-system",
      ...VALUES,
      "--auther",
      "Jane",
    ],
    { cwd: made, encoding: "utf8" },
  )
  refusesCleanly(init)
  assert.match(init.stderr, /^unknown argument --auther\n/)
  assert.equal(readFileSync(path.join(made, "package.json"), "utf8"), manifest)
  assert.ok(existsSync(path.join(made, "scripts/init.mjs")))
})

test("#52 the init script still takes every switch its usage lists", () => {
  for (const f of ["--help", "-h"]) {
    const run = spawnSync(process.execPath, [INIT, f, "--bogus"], {
      encoding: "utf8",
    })
    assert.equal(run.status, 0, `${f}: ${run.stderr}`)
    assert.match(run.stdout, /^usage: node scripts\/init\.mjs /)
  }
  for (const args of [[], ["--fleet"], ["--figma-file", "abc123"]]) {
    const run = check(...args)
    assert.equal(run.status, 0, `${args.join(" ")}: ${run.stderr}`)
  }
})

test("an author or description with a line break is refused (#49)", () => {
  for (const f of ["--author", "--description"]) {
    const run = create("sample-system", ...VALUES, f, "two\nlines")
    refusesCleanly(run)
    assert.deepEqual(readdirSync(dir), [])
  }
})

test("the prefix defaults to the name's initials", () => {
  assert.equal(prefixFrom("my-system"), "ms")
  assert.equal(prefixFrom("tokens"), "t")
  assert.equal(prefixFrom(undefined), "")
})

test("the owner defaults to git's user.name only when it is a valid login", () => {
  assert.equal(ownerFrom("sample-owner\n"), "sample-owner")
  assert.equal(ownerFrom("Sample Owner"), undefined)
  assert.equal(ownerFrom(""), undefined)
  assert.equal(ownerFrom(undefined), undefined)
})

test("git's user.name is read in the folder given, trimmed, or undefined", () => {
  const git = (...args) => spawnSync("git", ["-C", dir, ...args])
  git("init", "--quiet")
  git("config", "user.name", "  Sample Author  ")
  assert.equal(gitUserName(dir), "Sample Author")
  git("config", "user.name", "")
  assert.equal(gitUserName(dir), undefined)
})
