#!/usr/bin/env node
// `npm run update:skills [-- --from <url|path>]`: brings this system's managed
// agent skills up to date with the repository it was created from. A system
// starts its own history and never pulls again, so the skills come from a
// fresh shallow clone: each `.claude/skills/*/SKILL.md` there that carries the
// MANAGED line is written here, unless this system's copy has dropped the line,
// which claims the file as its own.
import { execFileSync } from "node:child_process"
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"
import { fileURLToPath } from "node:url"

export const MANAGED =
  "Managed by `npm run update:skills`, which overwrites this file. Delete this line to keep your own edits: the update then leaves the file alone."

const USAGE = "usage: npm run update:skills [-- --from <url|path>]"
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")

const fail = message => {
  console.error(`  ✗ ${message}`)
  process.exit(1)
}

function main(args) {
  let from
  for (let i = 0; i < args.length; i++)
    if (args[i] === "--from" && args[i + 1] && !args[i + 1].startsWith("-"))
      from = args[++i]
    else if (args[i] === "--from") fail(`--from needs a value\n\n${USAGE}`)
    else fail(`unknown argument ${JSON.stringify(args[i])}\n\n${USAGE}`)
  const pkg = JSON.parse(readFileSync(path.join(root, "package.json"), "utf8"))
  from ??= pkg.skillsFrom ?? pkg.repository?.url?.replace(/^git\+/, "")
  if (!from) fail(`no source: package.json has no skillsFrom\n\n${USAGE}`)

  const clone = mkdtempSync(path.join(tmpdir(), "skills-"))
  try {
    try {
      execFileSync("git", ["clone", "--quiet", "--depth", "1", from, clone], {
        stdio: ["ignore", "ignore", "pipe"],
      })
    } catch (error) {
      // Not fail(): process.exit would skip the finally that removes the clone.
      console.error(
        `  ✗ cloning ${from} failed; nothing was written.\n${String(error.stderr || error.message).trim()}`,
      )
      process.exitCode = 1
      return
    }
    // A created system's skills carry its own name where the source's carry
    // the source's (init renames them, #96), so an update maps one onto the
    // other: the source's name is its repository's, this system's is its
    // package's. The source itself, with no skillsFrom, maps nothing.
    const upstream = path.basename(from).replace(/\.git$/, "")
    const own = (pkg.skillsFrom && pkg.name) || upstream
    const mapped = text => text.replaceAll(upstream, own)
    const skills = path.join(clone, ".claude/skills")
    const names = existsSync(skills) ? readdirSync(skills).sort() : []
    for (const name of names) {
      const source = path.join(clone, `.claude/skills/${name}/SKILL.md`)
      const rel = `.claude/skills/${mapped(name)}/SKILL.md`
      if (!existsSync(source)) continue
      const text = mapped(readFileSync(source, "utf8"))
      if (!text.includes(MANAGED)) continue
      const local = path.join(root, rel)
      const mine = existsSync(local) ? readFileSync(local, "utf8") : undefined
      if (mine === text) console.log(`  ✓ current  ${rel}`)
      else if (mine !== undefined && !mine.includes(MANAGED))
        console.log(`  - kept     ${rel} (yours: it has no managed line)`)
      else {
        mkdirSync(path.dirname(local), { recursive: true })
        writeFileSync(local, text)
        console.log(`  ✓ ${mine === undefined ? "added  " : "updated"}  ${rel}`)
      }
    }
  } finally {
    rmSync(clone, { recursive: true, force: true })
  }
}

// Run, not imported (the test imports MANAGED); realpath, since a temp
// folder's path can run through a symlink (/var is /private/var on macOS).
if (realpathSync(process.argv[1]) === fileURLToPath(import.meta.url))
  main(process.argv.slice(2))
