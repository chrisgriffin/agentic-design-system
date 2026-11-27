import assert from "node:assert/strict"
import { execFileSync, spawnSync } from "node:child_process"
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
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

function setup(pkg = {}) {
  const base = mkdtempSync(path.join(tmpdir(), "update-skills-test-"))
  const source = path.join(base, "source")
  write(source, {
    ".claude/skills/fresh/SKILL.md": managed("fresh", "new upstream"),
    ".claude/skills/stale/SKILL.md": managed("stale", "improved"),
    ".claude/skills/current/SKILL.md": managed("current", "same"),
    ".claude/skills/claimed/SKILL.md": managed("claimed", "upstream"),
    ".claude/skills/unmanaged/SKILL.md": skill("unmanaged", "runs once"),
  })
  const git = (...args) =>
    execFileSync(
      "git",
      ["-c", "user.name=t", "-c", "user.email=t@t", "-C", source, ...args],
      { stdio: "ignore" },
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
      { encoding: "utf8", env: { ...process.env, TMPDIR: temp } },
    )
  const read = name =>
    readFileSync(path.join(system, `.claude/skills/${name}/SKILL.md`), "utf8")
  return { source, system, temp, run, read }
}

test("#96 adds a missing managed skill, updates a stale one, keeps a claimed one", () => {
  const { source, temp, run, read } = setup()
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

test("#96 a skill the source carries without the managed line is never copied", () => {
  const { source, system, run } = setup()
  run("--from", source)
  assert.ok(!existsSync(path.join(system, ".claude/skills/unmanaged")))
})

test("#96 with no --from, package.json's skillsFrom is the source", () => {
  const base = setup()
  const { system, run, read } = base
  writeFileSync(
    path.join(system, "package.json"),
    JSON.stringify({ skillsFrom: base.source }),
  )
  const result = run()
  assert.equal(result.status, 0, result.stderr)
  assert.equal(read("fresh"), managed("fresh", "new upstream"))
})

test("#96 a clone that fails writes nothing and exits 1", () => {
  const { system, temp, run, read } = setup()
  const result = run("--from", path.join(system, "no-such-repo"))
  assert.equal(result.status, 1)
  assert.match(result.stderr, /^ {2}✗ cloning .* failed; nothing was written\./)
  assert.ok(!existsSync(path.join(system, ".claude/skills/fresh")))
  assert.equal(read("stale"), managed("stale", "old"))
  assert.deepEqual(readdirSync(temp), [], "the clone is removed")
})

test("#96 an unknown argument, or --from with no value, exits 1", () => {
  const { run } = setup()
  for (const args of [["--form", "x"], ["--from"]]) {
    const result = run(...args)
    assert.equal(result.status, 1, args.join(" "))
    assert.match(result.stderr, /^ {2}✗ .*\n\nusage: npm run update:skills/)
  }
})
