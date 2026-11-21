import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { test } from "node:test"

// The lock file every copy of the template starts from: no minimatch inside
// GHSA-g3hv-75wg-m249's range (>= 7.0.0, < 11.0.1), the advisory #43 fixed
// with the minimatch override in package.json.

const lock = JSON.parse(
  readFileSync(new URL("../package-lock.json", import.meta.url), "utf8"),
)

function parse(version) {
  const match = /^(\d+)\.(\d+)\.(\d+)(-.+)?$/.exec(version ?? "")
  if (!match) return null
  const [, major, minor, patch, pre] = match
  return { core: [Number(major), Number(minor), Number(patch)], pre: !!pre }
}

function compare(a, b) {
  for (let i = 0; i < 3; i++)
    if (a.core[i] !== b.core[i]) return a.core[i] - b.core[i]
  return (b.pre ? 1 : 0) - (a.pre ? 1 : 0)
}

const FIRST_AFFECTED = parse("7.0.0")
const FIRST_FIXED = parse("11.0.1")

function isAffected(version) {
  const parsed = parse(version)
  if (!parsed) return true
  return (
    compare(parsed, FIRST_AFFECTED) >= 0 && compare(parsed, FIRST_FIXED) < 0
  )
}

const minimatchEntries = Object.entries(lock.packages).filter(
  ([key]) =>
    key === "node_modules/minimatch" || key.endsWith("/node_modules/minimatch"),
)

test("the advisory range check counts its bounds the way GHSA-g3hv-75wg-m249 does (#43)", () => {
  for (const version of ["7.0.0", "9.0.9", "10.2.6", "11.0.0", "11.0.1-rc.1"]) {
    assert.equal(isAffected(version), true, `${version} is inside the range`)
  }
  for (const version of ["3.1.5", "6.2.0", "11.0.1", "11.0.9", "12.0.0"]) {
    assert.equal(isAffected(version), false, `${version} is outside the range`)
  }
  assert.equal(
    isAffected(undefined),
    true,
    "an entry with no version is not trusted",
  )
})

test("no minimatch in package-lock.json resolves inside GHSA-g3hv-75wg-m249 (#43)", () => {
  assert.ok(
    minimatchEntries.length > 0,
    "package-lock.json holds no minimatch at all",
  )
  const affected = minimatchEntries
    .filter(([, entry]) => isAffected(entry.version))
    .map(([key, entry]) => `${key} at ${entry.version ?? "(no version)"}`)
  assert.deepEqual(affected, [])
})
