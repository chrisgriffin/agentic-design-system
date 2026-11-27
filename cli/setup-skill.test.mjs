import assert from "node:assert/strict"
import { existsSync, readFileSync } from "node:fs"
import { test } from "node:test"

// The setup skill a copy runs once after init (#59). It ships in the template
// but only ever runs in a copy; cli/agent-skills.test.mjs checks its paths and
// that init leaves it whole, with the other skills (#96).

const root = new URL("../", import.meta.url)
const file = ".claude/skills/setup-system/SKILL.md"
const skill = existsSync(new URL(file, root))
  ? readFileSync(new URL(file, root), "utf8")
  : ""
test("#59 the skill ships, named setup-system", () => {
  assert.ok(skill, `${file} is missing`)
  assert.match(skill, /^---\nname: setup-system\ndescription: \S.*\n---\n/)
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
