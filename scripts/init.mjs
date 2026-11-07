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

const USAGE = `usage: node scripts/init.mjs --name <kebab-name> --prefix <prefix> --owner <github-login> [--figma-file <key>] [--fleet]

  --name        the package and repo name, kebab-case (today: agentic-design-system)
  --prefix      the custom property prefix, letters and digits (today: ads, as in --ads-*)
  --owner       the GitHub login the repo lives under (today: chrisgriffin, where it names this repo)
  --figma-file  a Figma file key, written to design-delta.json and every Code Connect stub
  --fleet       keep evaluator-gate.yml and claude-mention.yml, which need a private operator

Rewrites the name, prefix and owner everywhere they appear, installs, docks the
engine, runs npm run verify, then removes itself, its CI check, this README
section and every docs passage marked <!-- init -->. Nothing is committed:
read the diff, then commit.`

const args = process.argv.slice(2)
const flag = f => (args.includes(f) ? args[args.indexOf(f) + 1] : undefined)
if (args.includes("--help") || args.includes("-h")) {
  console.log(USAGE)
  process.exit(0)
}
const name = flag("--name")
const prefix = flag("--prefix")
const owner = flag("--owner")
const figma = flag("--figma-file")
const fleet = args.includes("--fleet")
const ok =
  /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/.test(name ?? "") &&
  /^[a-z][a-z0-9]*$/.test(prefix ?? "") &&
  /^[A-Za-z0-9-]+$/.test(owner ?? "") &&
  (figma === undefined || /^[A-Za-z0-9]+$/.test(figma))
if (!ok) {
  console.error(USAGE)
  process.exit(1)
}

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const self = path.relative(root, fileURLToPath(import.meta.url))
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
  name: "agentic-design-system",
  prefix: "ads",
  owner: "chrisgriffin",
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
  [" (scripts/init.mjs does)", ""],
]
if (figma) swaps.push(["FIGMA_FILE_KEY", figma])

const changed = []
for (const rel of walk("")) {
  if (rel === self) continue
  const file = path.join(root, rel)
  const before = readFileSync(file, "utf8")
  let after = before
  for (const [from, to] of swaps) after = after.replaceAll(from, to)
  if (after !== before) (writeFileSync(file, after), changed.push(rel))
}

if (figma) {
  const file = path.join(root, "design-delta.json")
  const config = JSON.parse(readFileSync(file, "utf8"))
  config.design = { ...config.design, files: [figma] }
  writeFileSync(file, JSON.stringify(config, null, 2) + "\n")
  changed.push("design-delta.json")
}

// The README section that describes this script goes with it, and so does every
// passage marked <!-- init --> ... <!-- /init -->: the docs that name this script
// or its check would otherwise describe files a copy no longer has.
const readme = path.join(root, "README.md")
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

const removed = [self, ".github/workflows/init-check.yml"]
if (!fleet)
  removed.push(
    ".github/workflows/evaluator-gate.yml",
    ".github/workflows/claude-mention.yml",
  )

const run = cmd => execSync(cmd, { cwd: root, stdio: "inherit" })
if (!existsSync(path.join(root, "node_modules/.bin/design-delta")))
  run("npm install --no-audit --no-fund")
run("npx design-delta dock")
run("npx prettier --write . --log-level warn")
run("npm run verify")

for (const rel of removed)
  if (existsSync(path.join(root, rel))) rmSync(path.join(root, rel))
console.log(
  `\n${name}: ${changed.length} files rewritten (prefix --${prefix}-, owner ${owner}${figma ? `, Figma file ${figma}` : ""}); removed ${removed.join(", ")}.\nverify is green. Read the diff, then commit.`,
)
