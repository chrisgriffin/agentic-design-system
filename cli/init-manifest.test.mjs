import assert from "node:assert/strict"
import { spawnSync } from "node:child_process"
import {
  chmodSync,
  cpSync,
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
import { after, before, test } from "node:test"
import { fileURLToPath } from "node:url"

// scripts/init.mjs on a copy of the template, with npm and npx replaced by
// stubs on PATH: the install, dock and format steps each leave a mark in
// package.json and package-lock.json, and verify and the Storybook build pass.
// init must keep every mark and remove only bin (#62), and the copy must
// inherit nothing of the published create command (#79).
const ROOT = fileURLToPath(new URL("..", import.meta.url))
const SKIP = new Set([
  ".git",
  ".agents",
  ".specify",
  ".design-delta",
  "node_modules",
  "storybook-static",
])

// Each step adds its mark to both files, as an install or dock would.
const STUB = `#!${process.execPath}
const fs = require("fs")
const args = process.argv.slice(2).join(" ")
const step = /^ci\\b/.test(args) ? "ci" : /design-delta dock/.test(args) ? "dock" : /prettier --write/.test(args) ? "format" : null
if (step) {
  const edit = (file, change) => {
    const json = JSON.parse(fs.readFileSync(file, "utf8"))
    change(json)
    fs.writeFileSync(file, JSON.stringify(json, null, 2) + "\\n")
  }
  edit("package.json", pkg => { pkg.scripts["mark:" + step] = step })
  edit("package-lock.json", lock => { lock.packages[""]["mark:" + step] = step; lock["mark:" + step] = step })
}
`

let dir, copy, pkg, lock, run
before(() => {
  dir = mkdtempSync(path.join(tmpdir(), "init-manifest-"))
  copy = path.join(dir, "copy")
  cpSync(ROOT, copy, {
    recursive: true,
    filter: src => !SKIP.has(path.basename(src)),
  })
  // A release branch's changelog names the template and its create command,
  // and its manifests carry the released version; the copy is given both, a
  // patch entry (`### [x.y.z](…)`) above a minor one (`## x.y.z`), so #79 and
  // #81 hold on release/next, not just on develop.
  writeFileSync(
    path.join(copy, "CHANGELOG.md"),
    `${readFileSync(path.join(copy, "CHANGELOG.md"), "utf8").trimEnd()}\n\n### [0.1.1](https://github.com/chrisgriffin/agentic-ds/compare/v0.1.0...v0.1.1) (2026-11-24)\n\n### Bug Fixes\n\n* **init:** keep the copy private\n\n## 0.1.0 (2026-11-23)\n\n### Features\n\n* **cli:** make the create command publishable as create-agentic-ds and name the repo agentic-ds\n`,
  )
  for (const file of ["package.json", "package-lock.json"]) {
    const json = JSON.parse(readFileSync(path.join(copy, file), "utf8"))
    json.version = "0.1.1"
    if (json.packages) json.packages[""].version = "0.1.1"
    writeFileSync(path.join(copy, file), JSON.stringify(json, null, 2) + "\n")
  }
  const bin = path.join(dir, "bin")
  mkdirSync(bin)
  for (const name of ["npm", "npx"]) {
    writeFileSync(path.join(bin, name), STUB)
    chmodSync(path.join(bin, name), 0o755)
  }
  run = spawnSync(
    process.execPath,
    [
      "scripts/init.mjs",
      "--name",
      "sample-system",
      "--prefix",
      "sds",
      "--owner",
      "sample-owner",
      "--author",
      "Sample Author",
    ],
    {
      cwd: copy,
      encoding: "utf8",
      env: {
        ...process.env,
        PATH: `${bin}${path.delimiter}${process.env.PATH}`,
      },
    },
  )
  const read = file => JSON.parse(readFileSync(path.join(copy, file), "utf8"))
  pkg = read("package.json")
  lock = read("package-lock.json")
})
after(() => rmSync(dir, { recursive: true, force: true }))

test("init finishes with the stubbed steps (#62)", () => {
  assert.equal(run.status, 0, run.stderr)
})

test("#62 package.json keeps what the install, dock and format steps wrote, and loses bin", () => {
  for (const step of ["ci", "dock", "format"])
    assert.equal(pkg.scripts[`mark:${step}`], step, `the ${step} step's change`)
  assert.equal(pkg.bin, undefined)
  assert.equal(pkg.name, "sample-system")
  assert.equal(pkg.description, "The sample-system design system.")
})

test("#62 package-lock.json keeps what the install, dock and format steps wrote, and loses the root bin", () => {
  for (const step of ["ci", "dock", "format"]) {
    assert.equal(lock[`mark:${step}`], step, `the ${step} step's change`)
    assert.equal(
      lock.packages[""][`mark:${step}`],
      step,
      `the ${step} step's root entry`,
    )
  }
  assert.equal(lock.packages[""].bin, undefined)
  assert.equal(lock.name, "sample-system")
  assert.equal(lock.packages[""].name, "sample-system")
})

test("#79 the copy inherits no package name, bin or publish settings", () => {
  assert.equal(pkg.name, "sample-system")
  assert.equal(pkg.private, true)
  for (const key of ["bin", "files", "publishConfig"])
    assert.equal(pkg[key], undefined, `package.json keeps ${key}`)
  assert.ok(
    !existsSync(path.join(copy, ".github/workflows/publish.yml")),
    "the copy keeps publish.yml",
  )
})

test("the copy has no demo script, which runs the create command init removes", () => {
  assert.equal(pkg.scripts.demo, undefined)
})

// The template's name is rewritten everywhere, so a leftover would read
// create-sample-system: both spellings are looked for.
test("#79 no file of the copy names the template or its create command", () => {
  const files = dir =>
    readdirSync(dir, { withFileTypes: true }).flatMap(e =>
      e.isDirectory()
        ? files(path.join(dir, e.name))
        : [path.join(dir, e.name)],
    )
  const naming = files(copy).filter(file =>
    /agentic-ds|create-sample-system|npm create/.test(
      readFileSync(file, "utf8"),
    ),
  )
  assert.deepEqual(
    naming.map(file => path.relative(copy, file)),
    [],
  )
})

// Either heading level the release workflow writes counts as a release.
test("#81 the copy starts its own changelog, with none of the template's releases", () => {
  const changelog = readFileSync(path.join(copy, "CHANGELOG.md"), "utf8")
  assert.match(changelog, /^# Changelog/)
  assert.doesNotMatch(changelog, /^###? \[?v?[0-9]/m)
  assert.doesNotMatch(changelog, /^## /m)
  assert.doesNotMatch(changelog, /0\.1\.[01]/)
})

test("#81 the copy starts at version 0.0.0, not the template's", () => {
  assert.equal(pkg.version, "0.0.0")
  assert.equal(lock.version, "0.0.0")
  assert.equal(lock.packages[""].version, "0.0.0")
})

// The template's unused tokens are a decision, recorded in design-delta.json
// (README § Tokens), so the audit lists nothing: here, and in a copy init has
// renamed, whether or not its tokens/css has been built yet (#35).
const audit = cwd => {
  const out = spawnSync(
    path.join(ROOT, "node_modules/.bin/design-delta"),
    ["audit", "--json"],
    { cwd, encoding: "utf8" },
  )
  assert.equal(out.status, 0, out.stderr)
  return JSON.parse(out.stdout).findings.map(f => `${f.ruleId} ${f.entity}`)
}

test("#35 the template's audit reports no finding", () => {
  assert.deepEqual(audit(ROOT), [])
})

test("#35 an init'd copy's audit reports no finding, before and after its token build", () => {
  symlinkSync(path.join(ROOT, "node_modules"), path.join(copy, "node_modules"))
  rmSync(path.join(copy, "tokens/css"), { recursive: true, force: true })
  assert.deepEqual(audit(copy), [], "with no tokens/css")
  const build = spawnSync(process.execPath, ["tokens/scripts/build-css.mjs"], {
    cwd: copy,
    encoding: "utf8",
  })
  assert.equal(build.status, 0, build.stderr)
  assert.match(
    readFileSync(path.join(copy, "tokens/css/tokens.css"), "utf8"),
    /--sds-/,
  )
  assert.deepEqual(audit(copy), [], "with tokens/css built")
})
