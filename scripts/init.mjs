#!/usr/bin/env node
// Turns a fresh copy of the template into a named design system, then deletes
// itself: `node scripts/init.mjs --name <kebab> --prefix <prefix> --owner <login>`.
import { execSync } from "node:child_process"
import {
  existsSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

import { authorFrom } from "../cli/defaults.mjs"

const USAGE = `usage: node scripts/init.mjs --name <kebab-name> --prefix <prefix> --owner <github-username> [--author <name>] [--description <text>] [--figma-file <key>] [--fleet]

  --name        the repo name, and the package name init sets, kebab-case (today: the repo is agentic-ds, the package create-agentic-ds)
  --prefix      the custom property prefix: a lowercase letter, then lowercase letters and digits (today: ads, as in --ads-*)
  --owner       your GitHub username (today: chrisgriffin)
  --author      the copyright holder in LICENSE (default: git's user.name, else --owner)
  --description one line for package.json and the README intro (default: "The <name> design system.")
  --figma-file  a Figma file key, written to design-delta.json and every Code Connect stub
  --fleet       keep evaluator-gate.yml and claude-mention.yml, which need a private operator

Rewrites the name, prefix and owner everywhere they appear, writes the author
and description, installs, docks the engine, runs npm run verify and builds the
Storybook, then removes itself, its CI check, the create command and its npm
publish workflow, the template's specs/, this README section and every docs
passage marked <!-- init -->.
Nothing is committed: read the diff, then commit.`

// A value flag takes the next argument whatever it is, so free text that
// starts with "-" (an author, a description) is text, never a flag, and a
// value flag given last has no value and is refused below (#49).
const VALUE_FLAGS = new Set([
  "--name",
  "--prefix",
  "--owner",
  "--author",
  "--description",
  "--figma-file",
])
// Anything else is refused, never dropped: a misspelled --auther would
// otherwise leave the default author in silence (#52).
const SWITCHES = new Set(["--help", "-h", "--fleet", "--check"])
const values = {}
const switches = new Set()
let unknown
const argv = process.argv.slice(2)
for (let i = 0; i < argv.length; i++)
  if (VALUE_FLAGS.has(argv[i])) values[argv[i]] = argv[++i] ?? null
  else if (SWITCHES.has(argv[i])) switches.add(argv[i])
  else unknown ??= argv[i]
if (switches.has("--help") || switches.has("-h")) {
  console.log(USAGE)
  process.exit(0)
}
// Quoted, so an empty value or a line break shows in the refusal (#56).
const shown = JSON.stringify
if (unknown !== undefined) {
  console.error(`unknown argument ${shown(unknown)}\n\n${USAGE}`)
  process.exit(1)
}
const name = values["--name"]
const prefix = values["--prefix"]
const owner = values["--owner"]
const figma = values["--figma-file"]
const fleet = switches.has("--fleet")
// Each flag's pattern and, for the refusal, what it accepts (#56). The author
// and description are free text, one line: they land in LICENSE, package.json
// and the README.
const ONE_LINE = [/^[^\n\r]*\S[^\n\r]*$/, "one line of text, not blank"]
const RULES = {
  "--name": [
    /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/,
    "kebab-case, lowercase letters and digits in words joined by single hyphens, starting with a letter",
    true,
  ],
  "--prefix": [
    /^[a-z][a-z0-9]*$/,
    "a lowercase letter, then lowercase letters and digits",
    true,
  ],
  "--owner": [/^[A-Za-z0-9-]+$/, "letters, digits and hyphens", true],
  "--figma-file": [/^[A-Za-z0-9]+$/, "letters and digits"],
  "--author": ONE_LINE,
  "--description": ONE_LINE,
}
const refusals = Object.entries(RULES).flatMap(
  ([flag, [pattern, rule, required]]) => {
    const value = values[flag]
    if (value === undefined) return required ? [`${flag} is missing`] : []
    if (value === null) return [`${flag} needs a value`]
    return pattern.test(value)
      ? []
      : [`${flag} ${shown(value)} is not valid: ${rule}`]
  },
)
if (refusals.length) {
  console.error(`${refusals.join("\n")}\n\n${USAGE}`)
  process.exit(1)
}
// cli/create.mjs asks this script whether its values are valid before it
// writes anything, so the patterns above have one home.
if (switches.has("--check")) process.exit(0)

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const author = values["--author"] ?? authorFrom(root, owner).author
const description = values["--description"] ?? `The ${name} design system.`
const self = path.relative(root, fileURLToPath(import.meta.url))
// A node_modules means an install already ran in this copy and may have
// re-resolved the lock (#44), so the committed one is restored before anything
// is written; a copy with no committed lock to restore stops here, unchanged.
const lockfile = path.join(root, "package-lock.json")
if (existsSync(path.join(root, "node_modules"))) {
  let committed
  try {
    committed = execSync("git show HEAD:./package-lock.json", {
      cwd: root,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    })
  } catch {
    console.error(
      "#44: node_modules exists, so an install may have re-resolved package-lock.json, and there is no committed lock to restore. Put back the template's package-lock.json, delete node_modules, then run this script again.",
    )
    process.exit(1)
  }
  writeFileSync(lockfile, committed)
}
const SKIP = new Set([
  "node_modules",
  ".git",
  ".design-delta",
  "storybook-static",
  "package-lock.json",
  "specs",
  "tokens/css",
])
const walk = dir =>
  readdirSync(path.join(root, dir), { withFileTypes: true }).flatMap(e => {
    const rel = dir ? `${dir}/${e.name}` : e.name
    if (SKIP.has(rel) || SKIP.has(e.name)) return []
    return e.isDirectory() ? walk(rel) : [rel]
  })

// The template's own values. The owner is replaced only where it names this
// repo: the shared config and the public workflows stay the dependencies they are.
const TEMPLATE = {
  name: "agentic-ds",
  prefix: "ads",
  owner: "chrisgriffin",
  description:
    "A design system template an agent can build in and keep honest.",
}
const swaps = [
  [
    `github.com/${TEMPLATE.owner}/${TEMPLATE.name}`,
    `github.com/${owner}/${name}`,
  ],
  [
    `${TEMPLATE.owner}.github.io/${TEMPLATE.name}`,
    `${owner}.github.io/${name}`,
  ],
  [`* @${TEMPLATE.owner}`, `* @${owner}`],
  [TEMPLATE.name, name],
  [`--${TEMPLATE.prefix}-`, `--${prefix}-`],
  [`PREFIX = "${TEMPLATE.prefix}"`, `PREFIX = "${prefix}"`],
]
if (figma) swaps.push(["FIGMA_FILE_KEY", figma])

const changed = new Set()
for (const rel of walk("")) {
  if (rel === self) continue
  const file = path.join(root, rel)
  const before = readFileSync(file, "utf8")
  let after = before
  for (const [from, to] of swaps) after = after.replaceAll(from, to)
  if (after !== before) (writeFileSync(file, after), changed.add(rel))
}

// The README's intro sentence is the template's description; package.json's
// and LICENSE's lines are set whole, so any text is safe in them.
const readme = path.join(root, "README.md")
const license = path.join(root, "LICENSE")
writeFileSync(
  readme,
  readFileSync(readme, "utf8").replace(TEMPLATE.description, () => description),
)
writeFileSync(
  license,
  readFileSync(license, "utf8").replace(
    /^Copyright \(c\) .*$/m,
    () => `Copyright (c) ${new Date().getFullYear()} ${author}`,
  ),
)
changed.add("README.md").add("LICENSE")

if (figma) {
  const file = path.join(root, "design-delta.json")
  const config = JSON.parse(readFileSync(file, "utf8"))
  config.design = { ...config.design, files: [figma] }
  writeFileSync(file, JSON.stringify(config, null, 2) + "\n")
  changed.add("design-delta.json")
}

// The README section that describes this script goes with it, and so does every
// passage marked <!-- init --> ... <!-- /init -->: the docs that name this script
// or its check would otherwise describe files a copy no longer has.
writeFileSync(
  readme,
  readFileSync(readme, "utf8").replace(
    /\n## Starting your own\n[\s\S]*?(?=\n## )/,
    "",
  ),
)
for (const rel of walk("").filter(f => f.endsWith(".md"))) {
  const file = path.join(root, rel)
  const before = readFileSync(file, "utf8")
  const after = before.replace(/<!-- init -->[\s\S]*?<!-- \/init -->/g, "")
  if (after !== before) writeFileSync(file, after)
}

// The create command belongs to the template, not to a system made from it:
// its folder, its bin and its tests leave the copy, and so does everything
// that publishes it to npm as create-agentic-ds: the package name, the files
// list and publish.yml. A system is private until its owner says otherwise.
// The bin goes last, with the folder, so a copy whose gate failed below still
// reads as one init has not finished: the setup skill stops where it finds a
// bin.
const CLI_TESTS = " cli/*.test.mjs"
const manifest = path.join(root, "package.json")
// Each write reads the file afresh, so no step's change is written over (#62).
const edit = (file, change) => {
  const json = JSON.parse(readFileSync(file, "utf8"))
  change(json)
  writeFileSync(file, JSON.stringify(json, null, 2) + "\n")
}
edit(manifest, pkg => {
  pkg.name = name
  pkg.private = true
  delete pkg.files
  pkg.description = description
  pkg.scripts.test = pkg.scripts.test.replace(CLI_TESTS, "")
})
// The lock file is renamed here, not by an install, so it stays the template's:
// npm install lets the local npm re-resolve it, and npm 11 drops an entry the
// npm 10 on CI's Node 22 needs (#44). npm ci below installs it and writes nothing.
edit(lockfile, lock => {
  lock.name = lock.packages[""].name = name
})

// specs/ is the template's build history; a system starts its own.
const removed = [
  self,
  ".github/workflows/init-check.yml",
  ".github/workflows/publish.yml",
  "cli",
  "specs",
]
if (!fleet)
  removed.push(
    ".github/workflows/evaluator-gate.yml",
    ".github/workflows/claude-mention.yml",
  )

const run = cmd => execSync(cmd, { cwd: root, stdio: "inherit" })
run("npm ci --no-audit --no-fund")
run("npx design-delta dock")
run("npx prettier --write . --log-level warn")
run("npm run verify")
// verify leaves the Storybook to its own check, so the copy builds it here,
// before the removals: a failed build leaves the script for a second run.
run("npm run build-storybook")

for (const rel of removed)
  if (existsSync(path.join(root, rel)))
    rmSync(path.join(root, rel), { recursive: true })
// npm ci writes neither file and Prettier ignores both, but the dock step, or
// a step added later, may change them, so they are read again and only bin
// leaves (#62).
edit(manifest, pkg => delete pkg.bin)
edit(lockfile, lock => delete lock.packages[""].bin)
console.log(
  `\n${name}: ${changed.size} files rewritten (prefix --${prefix}-, owner ${owner}, author ${author}${figma ? `, Figma file ${figma}` : ""}); removed ${removed.join(", ")}.\nverify and the Storybook build are green. Read the diff and commit it, then run /setup-system in Claude Code here to write your own docs and brand.`,
)
