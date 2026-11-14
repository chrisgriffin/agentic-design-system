// @vitest-environment node

import { spawnSync } from "node:child_process"
import { cpSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { fileURLToPath } from "node:url"
import { afterEach, beforeEach, expect, test } from "vitest"

/**
 * Holds CLAUDE.md invariant 2 at the gate: a component no contract references
 * fails `drift:verify`, so it fails `npm run verify`. The engine's
 * `coverage/uncontracted-component` rule finds it; `design-delta.json` raises
 * that rule from its default `warn` to `error`, and this test fails if the
 * entry is lowered or removed, or the rule is renamed upstream.
 *
 * It asks the engine itself rather than reading the config: it copies the
 * project's config, components and tokens into a temp directory, adds a
 * component with no contract there, and runs the installed `design-delta`
 * against that copy. The fixture never lands in `components/`, where the
 * a11y coverage test would see a folder with no test file.
 */
const ROOT = fileURLToPath(new URL("..", import.meta.url))
const BIN = join(ROOT, "node_modules", ".bin", "design-delta")
const RULE = "coverage/uncontracted-component"
const FIXTURE = "components/no-contract/no-contract.tsx"

let project: string

beforeEach(() => {
  project = mkdtempSync(join(tmpdir(), "contract-coverage-"))
  cpSync(join(ROOT, "design-delta.json"), join(project, "design-delta.json"))
  for (const dir of ["components", "tokens"]) {
    cpSync(join(ROOT, dir), join(project, dir), { recursive: true })
  }
  mkdirSync(join(project, "components", "no-contract"))
  writeFileSync(
    join(project, FIXTURE),
    "export const NoContract = () => <p>no contract</p>\n",
  )
})

afterEach(() => {
  rmSync(project, { recursive: true, force: true })
})

const run = (...args: string[]) =>
  spawnSync(BIN, args, { cwd: project, encoding: "utf8" })

type Finding = { ruleId: string; severity: string; entity: string }

test("a component with no contract fails the gate", () => {
  const audit = run("audit", "--json")
  const findings = (JSON.parse(audit.stdout) as { findings: Finding[] })
    .findings
  expect(
    findings.find(f => f.ruleId === RULE && f.entity === FIXTURE)?.severity,
    `${RULE} on ${FIXTURE}`,
  ).toBe("error")

  const verify = run("verify")
  expect(verify.status, verify.stdout + verify.stderr).not.toBe(0)
  expect(verify.stdout).toContain(`${RULE}  ${FIXTURE}`)
}, 60_000)
