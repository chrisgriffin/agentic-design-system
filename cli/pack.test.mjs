import assert from "node:assert/strict"
import { execFileSync, spawnSync } from "node:child_process"
import {
  cpSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
} from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"
import { test } from "node:test"
import { fileURLToPath } from "node:url"

// The package npm publishes as create-agentic-ds (#79): what `npm create
// agentic-ds` installs is the create command and the two scripts it runs,
// nothing else of the template, which it clones at run time.
const ROOT = fileURLToPath(new URL("..", import.meta.url))
const read = file => readFileSync(path.join(ROOT, file), "utf8")
const pkg = JSON.parse(read("package.json"))
const packed = JSON.parse(
  execFileSync("npm", ["pack", "--dry-run", "--json"], {
    cwd: ROOT,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
  }),
)[0]
  .files.map(f => f.path)
  .sort()

test("#79 the package is create-agentic-ds, with the bin npm create runs", () => {
  assert.equal(pkg.name, "create-agentic-ds")
  assert.deepEqual(pkg.bin, { "create-agentic-ds": "cli/create.mjs" })
  assert.notEqual(pkg.private, true)
  // Nothing is installed with it: the template's packages are all dev ones.
  assert.equal(pkg.dependencies, undefined)
  const lock = JSON.parse(read("package-lock.json"))
  assert.equal(lock.name, pkg.name)
  assert.equal(lock.packages[""].name, pkg.name)
  assert.deepEqual(lock.packages[""].bin, pkg.bin)
})

test("#79 npm pack holds the create command, its scripts and nothing else", () => {
  assert.deepEqual(packed, [
    "LICENSE",
    "README.md",
    "cli/create.mjs",
    "cli/defaults.mjs",
    "cli/ui.mjs",
    "package.json",
    "scripts/init.mjs",
  ])
})

test("#79 the packed files alone run the command, up to init's own refusal", () => {
  const dir = mkdtempSync(path.join(tmpdir(), "pack-"))
  try {
    const out = path.join(dir, "package")
    for (const file of packed) {
      mkdirSync(path.dirname(path.join(out, file)), { recursive: true })
      cpSync(path.join(ROOT, file), path.join(out, file))
    }
    const run = spawnSync(
      process.execPath,
      [
        path.join(out, pkg.bin["create-agentic-ds"]),
        ...["--prefix", "Bad", "--owner", "sample-owner"],
        ...["--dir", path.join(dir, "sample-system")],
      ],
      { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] },
    )
    assert.equal(run.status, 1)
    assert.match(run.stderr, /^ {2}✗ --prefix "Bad" is not valid: /)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test("#79 only publish.yml publishes, with NPM_TOKEN and provenance", () => {
  const dir = ".github/workflows"
  const publish = read(`${dir}/publish.yml`)
  assert.match(publish, /NODE_AUTH_TOKEN: \$\{\{ secrets\.NPM_TOKEN \}\}/)
  assert.match(publish, /npm publish --provenance --access public/)
  assert.match(publish, /^ {2}id-token: write$/m)
  // Every other workflow is one a created system keeps, or runs no publish.
  for (const file of readdirSync(path.join(ROOT, dir)))
    if (file !== "publish.yml")
      assert.doesNotMatch(
        read(`${dir}/${file}`),
        /NPM_TOKEN|npm publish|npm_registry_url/,
        file,
      )
})
