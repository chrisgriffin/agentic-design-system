import assert from "node:assert/strict"
import { execFileSync } from "node:child_process"
import { readFileSync } from "node:fs"
import { test } from "node:test"
import { fileURLToPath } from "node:url"

// The repo was agentic-design-system until #79 renamed it agentic-ds, to
// match the package npm holds as create-agentic-ds. GitHub redirects the old
// repo name, but not the old Pages URL, and a clone or a provenance check
// that names the old repo breaks the day the redirect does.
const ROOT = fileURLToPath(new URL("..", import.meta.url))
// Records of what was true when they were written, and this file.
const KEPT = ["specs", "CHANGELOG.md", "cli/old-name.test.mjs"]

test("#79 nothing outside the kept records names the repo's old name", () => {
  let found = ""
  try {
    found = execFileSync(
      "git",
      [
        "grep",
        "--untracked",
        "-n",
        "-i",
        "-e",
        "agentic-design-system",
        "-e",
        "agentic design system",
        "--",
        ".",
        ...KEPT.map(kept => `:!${kept}`),
      ],
      { cwd: ROOT, encoding: "utf8" },
    )
  } catch (error) {
    // git grep exits 1 when nothing matches.
    if (error.status !== 1) throw error
  }
  assert.equal(found, "")
})

test("#79 package.json names the repo the create command clones", () => {
  const pkg = JSON.parse(
    readFileSync(new URL("package.json", `file://${ROOT}`)),
  )
  assert.equal(
    pkg.repository.url,
    "git+https://github.com/chrisgriffin/agentic-ds.git",
  )
})
