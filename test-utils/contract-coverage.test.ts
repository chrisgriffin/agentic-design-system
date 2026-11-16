// @vitest-environment node

import { spawnSync } from "node:child_process"
import {
  cpSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs"
import { tmpdir } from "node:os"
import { join, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import ts from "typescript"
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
 *
 * It also holds the typecheck to the gate tests: it fails when either
 * `test-utils/*.test.ts` file leaves the program `npm run typecheck` checks.
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

// The two gate tests in this folder enforce the template's invariants, so
// they are type-checked like the code they guard: leaving `test-utils` out of
// the program would let a type error in either one pass `npm run verify`.
// The guard asks TypeScript which files the program holds, so an `include`
// written another way, an `exclude` or JSONC comments all count as `tsc` does.
const TEST_UTILS = join(ROOT, "test-utils")
const GATE_TESTS = readdirSync(TEST_UTILS)
  .filter(name => name.endsWith(".test.ts"))
  .map(name => join(TEST_UTILS, name))

const programFiles = (text: string) => {
  const { config, error } = ts.parseConfigFileTextToJson("tsconfig.json", text)
  if (error)
    throw new Error(ts.flattenDiagnosticMessageText(error.messageText, "\n"))
  return ts
    .parseJsonConfigFileContent(config, ts.sys, ROOT)
    .fileNames.map(file => resolve(file))
}

const TSCONFIG = readFileSync(join(ROOT, "tsconfig.json"), "utf8")
const BASE = ts.parseConfigFileTextToJson("tsconfig.json", TSCONFIG).config as {
  include: string[]
}

/** The real tsconfig.json with its `include` and `exclude` replaced. */
const variant = (include: string[], exclude?: string[]) =>
  JSON.stringify({ ...BASE, include, ...(exclude && { exclude }) })

const JSONC = TSCONFIG.replace(/^\{/, "{\n  // a comment").replace(
  /\]\s*\}\s*$/,
  "],\n}\n",
)

test("the typecheck covers test-utils", () => {
  expect(GATE_TESTS).toHaveLength(2)
  expect(JSONC).toMatch(/\/\/ a comment[\s\S]*\],\n\}/)
  expect(programFiles(TSCONFIG)).toEqual(expect.arrayContaining(GATE_TESTS))
})

test.each([
  ["a test-utils exclude", variant(BASE.include, ["test-utils"]), false],
  ["a *.test.ts exclude", variant(BASE.include, ["**/*.test.ts"]), false],
  [
    "test-utils left out of include",
    variant(BASE.include.filter(entry => entry !== "test-utils")),
    false,
  ],
  [
    "a test-utils/**/* include",
    variant(
      BASE.include.map(e => (e === "test-utils" ? "test-utils/**/*" : e)),
    ),
    true,
  ],
  ["JSONC comments and a trailing comma", JSONC, true],
])("the guard reads %s as tsc does", (_, text, covered) => {
  const files = programFiles(text)
  for (const file of GATE_TESTS)
    expect(files.includes(file), file).toBe(covered)
})
