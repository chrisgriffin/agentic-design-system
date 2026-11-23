import assert from "node:assert/strict"
import { readdirSync, readFileSync } from "node:fs"
import { test } from "node:test"

// docs/releasing.md's one-time GitHub setup names the checks a copy's ruleset
// requires (#73). They must be exactly the pull-request CI jobs a copy keeps:
// a ruleset requiring a check nothing runs blocks every merge.

const root = new URL("../", import.meta.url)
const read = p => readFileSync(new URL(p, root), "utf8")
// The workflow init removes from every copy that runs pull-request CI.
const REMOVED = new Set(["init-check.yml"])

test("#73 the setup in docs/releasing.md names every pull-request check a copy keeps", () => {
  const setup = read("docs/releasing.md")
    .split(/^## /m)
    .find(s => s.startsWith("Setting up on GitHub"))
  assert.ok(setup, 'docs/releasing.md has no "Setting up on GitHub" section')
  const named = [...setup.matchAll(/`([a-z-]+) \/ ci`/g)].map(m => m[1]).sort()

  const dir = ".github/workflows/"
  const kept = []
  for (const f of readdirSync(new URL(dir, root))) {
    if (!f.endsWith(".yml") || REMOVED.has(f)) continue
    const yml = read(dir + f)
    if (!/^ {2}pull_request:/m.test(yml)) continue
    // Each top-level job, with the lines under it.
    for (const [, job, body] of yml.matchAll(
      /^ {2}([a-z-]+):\n((?: {4}.*\n|\n)*)/gm,
    ))
      if (/^ {4}uses: \S+\/_reusable-node-ci\.yml@/m.test(body)) kept.push(job)
  }
  kept.sort()

  assert.ok(kept.length >= 2, `only ${kept.join(", ")} found`)
  assert.deepEqual(named, kept)
})
