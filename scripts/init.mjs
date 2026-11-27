#!/usr/bin/env node
// Turns a fresh copy of the template into a named design system, then deletes
// itself: `node scripts/init.mjs --name <kebab> --prefix <prefix> --owner <login>`.
import { execSync } from "node:child_process"
import {
  existsSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
  writeSync,
} from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

import { authorFrom } from "../cli/defaults.mjs"
import { failure, header, next, rows, tick } from "../cli/ui.mjs"

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
publish workflow, the template's specs/ and CHANGELOG.md release entries (the
preamble stays, and version starts at 0.0.0), this README section and every
docs passage marked <!-- init -->.
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
// version starts at 0.0.0 with the changelog below, so a system's first
// release is its own, not the next one in the template's line (#81).
edit(manifest, pkg => {
  pkg.name = name
  pkg.version = "0.0.0"
  pkg.private = true
  delete pkg.files
  pkg.description = description
  pkg.scripts.test = pkg.scripts.test.replace(CLI_TESTS, "")
  // npm run demo and demo:clean run cli/demo.mjs, which goes with cli/ below.
  delete pkg.scripts.demo
  delete pkg.scripts["demo:clean"]
  // npm run update:skills clones its managed skills from here (#96). Written
  // after the walk, so the rewrite above never reaches it: the one place a
  // system names the template, and only as the source of those skills.
  pkg.skillsFrom = `https://github.com/${TEMPLATE.owner}/${TEMPLATE.name}.git`
})
// The lock file is renamed here, not by an install, so it stays the template's:
// npm install lets the local npm re-resolve it, and npm 11 drops an entry the
// npm 10 on CI's Node 22 needs (#44). npm ci below installs it and writes nothing.
edit(lockfile, lock => {
  lock.name = lock.packages[""].name = name
  lock.version = lock.packages[""].version = "0.0.0"
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

// CHANGELOG.md is the template's release history, which names the template and
// its create command; a system starts its own, so only the lines above the
// first release heading stay (#81). A minor release is written as `## x.y.z`,
// a patch as `### [x.y.z](…)`: the release workflow finds the first entry with
// this same pattern, so either level is a release heading.
const RELEASE_HEADING = /^###? \[?v?[0-9]/m
const changelog = path.join(root, "CHANGELOG.md")
if (existsSync(changelog)) {
  const text = readFileSync(changelog, "utf8")
  const first = text.search(RELEASE_HEADING)
  if (first !== -1)
    writeFileSync(changelog, `${text.slice(0, first).trimEnd()}\n`)
}

// Under the create command, a failed command is handed to it on fd 3, which it
// opens for this, and is not printed here: create's failure line names it with
// the retry, so the run ends on one ✗ line (#88). False when fd 3 is not open.
const handOff = cmd => {
  if (!process.env.CREATE_AGENTIC_DS) return false
  try {
    writeSync(3, cmd)
    return true
  } catch {
    return false
  }
}

// Each command's own output, under a header naming it; a failure is one line.
const run = cmd => {
  console.log(header(cmd))
  try {
    execSync(cmd, { cwd: root, stdio: "inherit" })
  } catch {
    if (handOff(cmd)) process.exit(1)
    console.error(
      `\n${failure(`${cmd} failed; fix the cause, then run init again.`)}`,
    )
    process.exit(1)
  }
}
run("npm ci --no-audit --no-fund")
run("npx design-delta dock")
run("npx prettier --write . --log-level warn")
run("npm run verify")
// verify leaves the Storybook to its own check, so the copy builds it here,
// before the removals: a failed build leaves the script for a second run.
run("npm run build-storybook")

// Folders are shown with a trailing /, the workflows under one entry.
const gone = []
const workflows = []
for (const rel of removed) {
  const at = path.join(root, rel)
  if (!existsSync(at)) continue
  if (rel.startsWith(".github/workflows/")) workflows.push(path.basename(rel))
  else gone.push(statSync(at).isDirectory() ? `${rel}/` : rel)
  rmSync(at, { recursive: true })
}
if (workflows.length) gone.push(`.github/workflows/ ${workflows.join(" ")}`)
// npm ci writes neither file and Prettier ignores both, but the dock step, or
// a step added later, may change them, so they are read again and only bin
// leaves (#62).
edit(manifest, pkg => delete pkg.bin)
edit(lockfile, lock => delete lock.packages[""].bin)
console.log(`\n${tick(`${name} is ready`)}\n`)
console.log(
  rows([
    ["Prefix", `--${prefix}-`],
    ["Owner", owner],
    ["Author", author],
    ["Figma", figma],
    ["Rewritten", `${changed.size} files`],
    ["Removed", gone.join(", ")],
    ["Checks", "npm run verify ✓  npm run build-storybook ✓"],
  ]),
)
// Under the create command, which prints these itself once it is done, with
// the folder to cd to; run on its own, the last line names /setup-system (#59).
if (!process.env.CREATE_AGENTIC_DS)
  console.log(
    next([
      "read the diff, then commit",
      "run /setup-system in Claude Code here to write your own docs and brand",
    ]),
  )
