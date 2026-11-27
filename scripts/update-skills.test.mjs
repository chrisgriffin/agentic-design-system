import assert from "node:assert/strict"
import { execFileSync, spawnSync } from "node:child_process"
import {
  copyFileSync,
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
import { test } from "node:test"
import { fileURLToPath } from "node:url"

import { MANAGED } from "./update-skills.mjs"

// npm run update:skills (#96), run from a copy of the script in a stand-in
// system against a stand-in source repository, so it touches neither this
// checkout nor the network.
const script = fileURLToPath(new URL("update-skills.mjs", import.meta.url))
const skill = (name, body) =>
  `---\nname: ${name}\ndescription: ${body}\n---\n\n${body}\n`
const managed = (name, body) => `${skill(name, body)}\n${MANAGED}\n`

const write = (dir, files) => {
  for (const [rel, text] of Object.entries(files)) {
    mkdirSync(path.dirname(path.join(dir, rel)), { recursive: true })
    writeFileSync(path.join(dir, rel), text)
  }
}

// Every git call ignores the machine's git config, so a global
// `commit.gpgsign` or `core.hooksPath` cannot make setup fail or prompt.
const GIT_ENV = {
  ...process.env,
  GIT_CONFIG_GLOBAL: "/dev/null",
  GIT_CONFIG_NOSYSTEM: "1",
}

// `t` is the running test: the stand-in folder is removed when it ends.
// `env` replaces GIT_ENV for setup's own git calls (the config test below).
function setup(t, { pkg = {}, env = GIT_ENV } = {}) {
  const base = mkdtempSync(path.join(tmpdir(), "update-skills-test-"))
  t.after(() => rmSync(base, { recursive: true, force: true }))
  const source = path.join(base, "source")
  write(source, {
    ".claude/skills/fresh/SKILL.md": managed("fresh", "new upstream"),
    ".claude/skills/stale/SKILL.md": managed("stale", "improved"),
    ".claude/skills/current/SKILL.md": managed("current", "same"),
    ".claude/skills/claimed/SKILL.md": managed("claimed", "upstream"),
    ".claude/skills/unmanaged/SKILL.md": skill("unmanaged", "runs once"),
    // Named for the source repository, as the template's own skills are.
    ".claude/skills/source-named/SKILL.md": managed(
      "source-named",
      "then the source-fresh step",
    ),
  })
  const git = (...args) =>
    execFileSync(
      "git",
      [
        ...["-c", "user.name=t", "-c", "user.email=t@t"],
        ...["-c", "commit.gpgsign=false", "-c", "core.hooksPath=/dev/null"],
        ...["-C", source, ...args],
      ],
      { stdio: "ignore", env },
    )
  git("init", "--quiet")
  git("add", ".")
  git("commit", "--quiet", "-m", "skills")

  const system = path.join(base, "system")
  write(system, {
    "package.json": JSON.stringify(pkg),
    ".claude/skills/stale/SKILL.md": managed("stale", "old"),
    ".claude/skills/current/SKILL.md": managed("current", "same"),
    ".claude/skills/claimed/SKILL.md": skill("claimed", "my own edits"),
  })
  mkdirSync(path.join(system, "scripts"))
  copyFileSync(script, path.join(system, "scripts/update-skills.mjs"))
  const temp = path.join(base, "tmp")
  mkdirSync(temp)
  const run = (...args) =>
    spawnSync(
      process.execPath,
      [path.join(system, "scripts/update-skills.mjs"), ...args],
      { encoding: "utf8", env: { ...GIT_ENV, TMPDIR: temp } },
    )
  const read = name =>
    readFileSync(path.join(system, `.claude/skills/${name}/SKILL.md`), "utf8")
  return { base, source, system, temp, run, read }
}

test("#96 adds a missing managed skill, updates a stale one, keeps a claimed one", t => {
  const { source, temp, run, read } = setup(t)
  const result = run("--from", source)
  assert.equal(result.status, 0, result.stderr)
  assert.match(result.stdout, /✓ added {4}\.claude\/skills\/fresh\/SKILL\.md/)
  assert.match(result.stdout, /✓ updated {2}\.claude\/skills\/stale\/SKILL\.md/)
  assert.match(
    result.stdout,
    /✓ current {2}\.claude\/skills\/current\/SKILL\.md/,
  )
  assert.match(
    result.stdout,
    /- kept {5}\.claude\/skills\/claimed\/SKILL\.md \(yours/,
  )
  assert.equal(read("fresh"), managed("fresh", "new upstream"))
  assert.equal(read("stale"), managed("stale", "improved"))
  assert.equal(read("claimed"), skill("claimed", "my own edits"))
  assert.doesNotMatch(result.stdout, /unmanaged/)
  assert.deepEqual(readdirSync(temp), [], "the clone is removed")
})

test("#96 a skill the source carries without the managed line is never copied", t => {
  const { source, system, run } = setup(t)
  run("--from", source)
  assert.ok(!existsSync(path.join(system, ".claude/skills/unmanaged")))
})

test("#96 with no --from, package.json's skillsFrom is the source", t => {
  const base = setup(t)
  const { system, run, read } = base
  writeFileSync(
    path.join(system, "package.json"),
    JSON.stringify({ skillsFrom: base.source }),
  )
  const result = run()
  assert.equal(result.status, 0, result.stderr)
  assert.equal(read("fresh"), managed("fresh", "new upstream"))
})

test("#96 in a created system, a skill named for the source arrives named for the system, folder and text", t => {
  const base = setup(t)
  const { system, run, read } = base
  writeFileSync(
    path.join(system, "package.json"),
    JSON.stringify({ name: "acme", skillsFrom: base.source }),
  )
  const result = run()
  assert.equal(result.status, 0, result.stderr)
  assert.match(
    result.stdout,
    /✓ added {4}\.claude\/skills\/acme-named\/SKILL\.md/,
  )
  assert.equal(
    read("acme-named"),
    managed("acme-named", "then the acme-fresh step"),
  )
  assert.ok(!existsSync(path.join(system, ".claude/skills/source-named")))
})

test("#96 with no skillsFrom (the source itself), names are left as they are", t => {
  const { source, system, run } = setup(t, { pkg: { name: "acme" } })
  assert.equal(run("--from", source).status, 0)
  assert.ok(
    existsSync(path.join(system, ".claude/skills/source-named/SKILL.md")),
  )
})

test("#96 a clone that fails writes nothing and exits 1", t => {
  const { system, temp, run, read } = setup(t)
  const result = run("--from", path.join(system, "no-such-repo"))
  assert.equal(result.status, 1)
  assert.match(result.stderr, /^ {2}✗ cloning .* failed; nothing was written\./)
  assert.ok(!existsSync(path.join(system, ".claude/skills/fresh")))
  assert.equal(read("stale"), managed("stale", "old"))
  assert.deepEqual(readdirSync(temp), [], "the clone is removed")
})

test("#96 an unknown argument, or --from with no value, exits 1", t => {
  const { run } = setup(t)
  for (const args of [["--form", "x"], ["--from"]]) {
    const result = run(...args)
    assert.equal(result.status, 1, args.join(" "))
    assert.match(result.stderr, /^ {2}✗ .*\n\nusage: npm run update:skills/)
  }
})

test("#96 setup removes its stand-in folder when the test ends", async t => {
  let base
  await t.test("a test that uses setup", st => {
    base = setup(st).base
    assert.ok(existsSync(base))
  })
  assert.ok(!existsSync(base), `${base} is left behind`)
})

test("#96 setup commits under a global config that signs commits and runs hooks", t => {
  // A global config with gpgsign on, a signing program that always fails and
  // a hooks path whose pre-commit refuses: setup's own -c flags must win.
  const dir = mkdtempSync(path.join(tmpdir(), "update-skills-config-"))
  t.after(() => rmSync(dir, { recursive: true, force: true }))
  const hooks = path.join(dir, "hooks")
  write(hooks, { "pre-commit": "#!/bin/sh\nexit 1\n" })
  execFileSync("chmod", ["+x", path.join(hooks, "pre-commit")])
  const config = path.join(dir, "gitconfig")
  writeFileSync(
    config,
    `[commit]\n\tgpgsign = true\n[gpg]\n\tprogram = false\n[core]\n\thooksPath = ${hooks}\n`,
  )
  const { source, run, read } = setup(t, {
    env: { ...process.env, GIT_CONFIG_GLOBAL: config },
  })
  const result = run("--from", source)
  assert.equal(result.status, 0, result.stderr)
  assert.equal(read("fresh"), managed("fresh", "new upstream"))
})
