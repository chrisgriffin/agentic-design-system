import assert from "node:assert/strict"
import { existsSync, readFileSync } from "node:fs"
import { test } from "node:test"

// The setup skill a copy runs once after init (#59). It ships in the template
// but only ever runs in a copy, so every path it names must be one a copy has.

const root = new URL("../", import.meta.url)
const file = ".claude/skills/setup-system/SKILL.md"
const skill = existsSync(new URL(file, root))
  ? readFileSync(new URL(file, root), "utf8")
  : ""
// What init removes from a copy (scripts/init.mjs, `removed`).
const REMOVED = [
  "scripts/init.mjs",
  ".github/workflows/init-check.yml",
  "cli",
  "specs",
]

test("#59 the skill ships, named setup-system", () => {
  assert.ok(skill, `${file} is missing`)
  assert.match(skill, /^---\nname: setup-system\ndescription: \S.*\n---\n/)
})

test("#59 every path the skill names is one a copy has", () => {
  const paths = [...skill.matchAll(/`([^`\s<>*]+)`/g)]
    .map(m => m[1])
    .filter(p => !p.startsWith("/") && /\/|\.(md|json|html|mjs)$/.test(p))
  assert.ok(paths.length > 5, `only ${paths.length} paths found`)
  for (const p of paths) {
    assert.ok(existsSync(new URL(p, root)), `${p} does not exist`)
    const gone = REMOVED.find(r => p === r || p.startsWith(`${r}/`))
    assert.equal(gone, undefined, `${p} is removed by init`)
  }
})

test("#59 init leaves the skill whole", () => {
  // init rewrites the name and prefix everywhere and strips init markers, and
  // init-check.yml fails a copy whose Markdown names the init script.
  for (const s of [
    "agentic-design-system",
    "--ads-",
    "FIGMA_FILE_KEY",
    "<!-- init -->",
    "init.mjs",
    "create.mjs",
    "init-check.yml",
  ])
    assert.ok(!skill.includes(s), `the skill names ${s}`)
})

test("#59 init's and create's closing lines name /setup-system", () => {
  for (const f of ["scripts/init.mjs", "cli/create.mjs"])
    assert.match(readFileSync(new URL(f, root), "utf8"), /\/setup-system/, f)
})

test("#73 create's closing line names the skill's file, for a session opened elsewhere", () => {
  const create = readFileSync(new URL("cli/create.mjs", root), "utf8")
  const closing = create.slice(create.lastIndexOf("console.log("))
  assert.ok(
    closing.includes(file),
    `create's closing line does not name ${file}`,
  )
})
