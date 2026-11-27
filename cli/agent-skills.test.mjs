import assert from "node:assert/strict"
import { existsSync, readdirSync, readFileSync } from "node:fs"
import { test } from "node:test"

import { MANAGED } from "../scripts/update-skills.mjs"

// This system's own skills (#59, #96). They ship in the template but run in a
// created system, so every path one names must be a path a copy has, and none
// may hold what init rewrites: an update writes the template's text, which must
// be the text init gave the copy.

const root = new URL("../", import.meta.url)
const read = file =>
  existsSync(new URL(file, root))
    ? readFileSync(new URL(file, root), "utf8")
    : ""
// The skills a created system keeps and npm run update:skills manages, and the
// one it runs once, which deletes itself and must never come back.
// The kept skills carry the template's name, which init rewrites to the
// system's in their folders and their text alike (#96).
const KEPT = ["add-component", "add-token", "change-theme"].map(
  s => `agentic-ds-${s}`,
)
const ONCE = "setup-system"
const file = name => `.claude/skills/${name}/SKILL.md`
// What init removes from a copy (scripts/init.mjs, `removed`).
const REMOVED = [
  "scripts/init.mjs",
  ".github/workflows/init-check.yml",
  ".github/workflows/publish.yml",
  "cli",
  "specs",
]

for (const name of [...KEPT, ONCE]) {
  const skill = read(file(name))

  test(`${name} ships, with its name and a description`, () => {
    assert.ok(skill, `${file(name)} is missing`)
    assert.match(
      skill,
      new RegExp(`^---\\nname: ${name}\\ndescription: \\S.*\\n---\\n`),
    )
  })

  test(`${name}: every path it names is one a copy has`, () => {
    const paths = [...skill.matchAll(/`([^`\s<>*]+)`/g)]
      .map(m => m[1])
      .filter(p => !p.startsWith("/") && /\/|\.(md|json|html|mjs)$/.test(p))
      // A bare extension (`.contract.json`) names a kind of file, and the
      // built CSS exists only after a build (CLAUDE.md, invariant 4).
      .filter(p => !/^\.[\w.-]+$/.test(p) && !p.startsWith("tokens/css/"))
    assert.ok(paths.length > 3, `only ${paths.length} paths found`)
    for (const p of paths) {
      assert.ok(existsSync(new URL(p, root)), `${p} does not exist`)
      const gone = REMOVED.find(r => p === r || p.startsWith(`${r}/`))
      assert.equal(gone, undefined, `${p} is removed by init`)
    }
  })

  test(`${name}: init leaves it whole`, () => {
    // init rewrites the name and prefix everywhere and strips init markers, and
    // init-check.yml fails a copy whose Markdown names the init script.
    for (const s of [
      "agentic-ds",
      "--ads-",
      "FIGMA_FILE_KEY",
      "<!-- init -->",
      "init.mjs",
      "create.mjs",
      "init-check.yml",
    ])
      // A kept skill's own name and the others' are rewritten with its folder.
      assert.ok(
        !KEPT.reduce((text, kept) => text.replaceAll(kept, ""), skill).includes(
          s,
        ),
        `${name} names ${s}`,
      )
  })
}

for (const name of KEPT)
  test(`${name} ends on the managed line, and never says "template", which the setup skill rewrites`, () => {
    const skill = read(file(name))
    assert.ok(skill.trimEnd().endsWith(MANAGED), `${name} has no managed line`)
    assert.doesNotMatch(skill, /template/i)
  })

// The examples setup-system lets an owner delete: every component but badge,
// which scaffold copies and which always stays. An update writes the template's
// text over a kept skill, so a kept skill that named one would bring back a
// pointer at a component the system no longer has.
const EXAMPLES = readdirSync(new URL("components/", root), {
  withFileTypes: true,
})
  .filter(d => d.isDirectory() && d.name !== "badge")
  .map(d => d.name)

test("the setup skill's droppable examples are found", () => {
  assert.ok(EXAMPLES.length > 0, "no example component besides badge")
})

for (const name of KEPT)
  test(`${name} names no example component setup-system may delete`, () => {
    const skill = read(file(name))
    for (const example of EXAMPLES)
      // A path (`components/card/`), a part (`card-header`), a file
      // (`button.test.tsx`) or the word in prose: each names the example.
      assert.doesNotMatch(
        skill,
        new RegExp(`\\b${example}\\b`, "i"),
        `${name} names the ${example} example`,
      )
  })

test(`${ONCE} carries no managed line, so an update never brings it back`, () => {
  assert.ok(!read(file(ONCE)).includes(MANAGED))
})
