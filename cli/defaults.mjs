// The defaults the create command offers when it asks for a value.
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

export const gitUserName = () => {
  try {
    return execFileSync("git", ["config", "user.name"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    })
  } catch {
    return undefined
  }
}
