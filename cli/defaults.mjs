// The defaults the create command offers when it asks for a value, and the
// LICENSE author it and scripts/init.mjs fall back to when --author is not given.
import { execFileSync } from "node:child_process"

// A GitHub login: letters, digits and hyphens, the shape scripts/init.mjs
// accepts for --owner.
const LOGIN = /^[A-Za-z0-9-]+$/

// The initials of the name: my-system → ms.
export const prefixFrom = name =>
  (name ?? "")
    .split("-")
    .map(part => part[0] ?? "")
    .join("")

// git's user.name, when it is a valid login; otherwise no default.
export const ownerFrom = gitName => {
  const value = (gitName ?? "").trim()
  return LOGIN.test(value) ? value : undefined
}

// git's user.name as seen from `cwd`, trimmed; undefined when none is set.
// scripts/init.mjs reaches it through authorFrom, while cli/ is still in the copy.
export const gitUserName = cwd => {
  try {
    return (
      execFileSync("git", ["config", "user.name"], {
        cwd,
        encoding: "utf8",
        stdio: ["ignore", "pipe", "ignore"],
      }).trim() || undefined
    )
  } catch {
    return undefined
  }
}

// The LICENSE copyright holder when --author is not given: git's user.name in
// `cwd`, else the owner, with where it came from, for the line that says so.
// scripts/init.mjs and the create command both take it from here (#68).
export const authorFrom = (cwd, owner) => {
  const gitName = gitUserName(cwd)
  return gitName === undefined
    ? { author: owner, from: "--owner" }
    : { author: gitName, from: "git's user.name" }
}

// The create command's flags that take a value, and of those the free-text ones,
// which cli/demo.mjs reads too, to find the folder a passed-through --dir names.
export const VALUE_FLAGS = new Set([
  "--prefix",
  "--owner",
  "--name",
  "--author",
  "--description",
  "--figma-file",
  "--dir",
  "--from",
])
// Free text, so a value starting with "-" is the value, not a flag (#49).
export const TEXT_FLAGS = new Set(["--author", "--description"])
