import ts from "typescript"
import { describe, expect, test } from "vitest"

/**
 * Holds the rule that every component test calls `expectNoViolations`: a test
 * file under `components/` that never calls it fails here, by its path.
 */
const sources = import.meta.glob<string>("../components/**/*.test.tsx", {
  query: "?raw",
  import: "default",
  eager: true,
})

const files = Object.entries(sources)
  .map(([path, source]) => [path.replace(/^\.\.\//, ""), source] as const)
  .sort(([a], [b]) => a.localeCompare(b))

/**
 * Parses the source as TSX and looks for a call whose callee is the
 * identifier `expectNoViolations`. The parser, not a regex, decides what is a
 * comment, a string, a template or JSX, so `"image/*"` or `"https://…"` in a
 * test never hides a real call, and a call inside a comment or a string never
 * counts as one.
 */
const callsExpectNoViolations = (source: string) => {
  const file = ts.createSourceFile(
    "test.tsx",
    source,
    ts.ScriptTarget.Latest,
    false,
    ts.ScriptKind.TSX,
  )
  const visit = (node: ts.Node): boolean =>
    (ts.isCallExpression(node) &&
      ts.isIdentifier(node.expression) &&
      node.expression.text === "expectNoViolations") ||
    (ts.forEachChild(node, visit) ?? false)
  return visit(file)
}

describe("callsExpectNoViolations", () => {
  test.each([
    [
      "a JSX attribute holding /* before a later block comment",
      'render(<input accept="image/*" />)\nawait expectNoViolations(container)\n/** later */',
    ],
    [
      "a JSX attribute holding // on the call's line",
      'render(<a href="https://x.dev">x</a>); await expectNoViolations(container)',
    ],
    [
      "a double-quoted string holding /* before a later block comment",
      'const glob = "src/*"\nawait expectNoViolations(container)\n/* later */',
    ],
    [
      "a single-quoted string holding // on the call's line",
      "const url = 'https://x.dev'; await expectNoViolations(container)",
    ],
    [
      "a template literal holding /* and //",
      "const t = `a/*b//c`; await expectNoViolations(container)\n/* later */",
    ],
    [
      "JSX text holding // on the call's line",
      "render(<p>https://x.dev</p>); await expectNoViolations(container)",
    ],
    [
      "a regex literal holding //",
      "const re = /\\/\\//; await expectNoViolations(container)",
    ],
    ["a space before the parenthesis", "await expectNoViolations (container)"],
  ])("counts a real call after %s", (_, source) => {
    expect(callsExpectNoViolations(source)).toBe(true)
  })

  test.each([
    [
      "an import alone",
      'import { expectNoViolations } from "../../test-utils/axe"',
    ],
    ["a line comment", "// await expectNoViolations(container)"],
    ["a block comment", "/* await expectNoViolations(container) */"],
    ["a string", 'const s = "expectNoViolations(container)"'],
    ["a template literal", "const s = `expectNoViolations(container)`"],
  ])("does not count %s", (_, source) => {
    expect(callsExpectNoViolations(source)).toBe(false)
  })
})

test("finds the component test files", () => {
  expect(files.length).toBeGreaterThan(0)
})

/**
 * Holds the rule that every component folder has a test: a folder under
 * `components/` holding a component source file but no `.test.tsx` fails
 * here, by its path. The check is per folder, so a composed part such as
 * `card/card-header.tsx` is covered by its parent's test. The glob is not
 * eager: only its keys are read, so no component module is imported.
 */
const NOT_A_COMPONENT = /\.(test|stories|figma)\.tsx$/

const folderOf = (path: string) =>
  path.replace(/^\.\.\//, "").replace(/\/[^/]+$/, "")

const componentFolders = [
  ...new Set(
    Object.keys(import.meta.glob("../components/**/*.tsx"))
      .filter(path => !NOT_A_COMPONENT.test(path))
      .map(folderOf),
  ),
].sort()

const testedFolders = new Set(Object.keys(sources).map(folderOf))

test("finds the component folders", () => {
  expect(componentFolders.length).toBeGreaterThan(0)
})

test.each(componentFolders)("%s has a test file", folder => {
  expect(testedFolders.has(folder), `${folder} has no .test.tsx file`).toBe(
    true,
  )
})

test.each(files)("%s calls expectNoViolations", (file, source) => {
  expect(
    callsExpectNoViolations(source),
    `${file} never calls expectNoViolations`,
  ).toBe(true)
})
