import ts from "typescript"
import { describe, expect, test } from "vitest"

import { type ContractProps, variantCases } from "./variants"

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
const parse = (source: string) =>
  ts.createSourceFile(
    "test.tsx",
    source,
    ts.ScriptTarget.Latest,
    false,
    ts.ScriptKind.TSX,
  )

const calls = (source: string, name: string) => {
  const visit = (node: ts.Node): boolean =>
    (ts.isCallExpression(node) &&
      ts.isIdentifier(node.expression) &&
      node.expression.text === name) ||
    (ts.forEachChild(node, visit) ?? false)
  return visit(parse(source))
}

const callsExpectNoViolations = (source: string) =>
  calls(source, "expectNoViolations")

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

/**
 * Holds the rule that every variant a contract gives code gets an
 * accessibility case (#57): `variantCases` turns a contract's code-side enums
 * into cases, and a contract with one fails here, by its path, when its
 * folder's test does not import it and call `variantCases`, so no variant
 * list is typed into a test by hand.
 */
describe("variantCases", () => {
  const contract = (props: ContractProps["props"]) => ({ props })

  test("gives every combination of the code-side enums, titled by value", () => {
    expect(
      variantCases(
        contract({
          size: { type: "enum", values: ["sm", "lg"] },
          tone: { type: "enum", values: ["a", "b"] },
          label: { type: "string" },
        }),
      ),
    ).toEqual([
      ["size sm, tone a", { size: "sm", tone: "a" }],
      ["size sm, tone b", { size: "sm", tone: "b" }],
      ["size lg, tone a", { size: "lg", tone: "a" }],
      ["size lg, tone b", { size: "lg", tone: "b" }],
    ])
  })

  test("gives no case for a design-only enum", () => {
    expect(
      variantCases(
        contract({
          size: { type: "enum", values: ["sm"] },
          state: { type: "enum", values: ["resting", "hovered"], code: "none" },
        }),
      ),
    ).toEqual([["size sm", { size: "sm" }]])
  })

  test("gives one defaults case for a contract with no code-side enum", () => {
    expect(variantCases(contract({ label: { type: "string" } }))).toEqual([
      ["defaults", {}],
    ])
  })
})

const contracts = Object.entries(
  import.meta.glob<ContractProps>("../components/**/*.contract.json", {
    import: "default",
    eager: true,
  }),
)
  .map(([path, json]) => [path.replace(/^\.\.\//, ""), json] as const)
  .sort(([a], [b]) => a.localeCompare(b))

const importsFrom = (source: string, specifier: string) =>
  parse(source).statements.some(
    node =>
      ts.isImportDeclaration(node) &&
      ts.isStringLiteral(node.moduleSpecifier) &&
      node.moduleSpecifier.text === specifier,
  )

test("finds the contracts", () => {
  expect(contracts.length).toBeGreaterThan(0)
})

const withCodeEnums = contracts.filter(([, json]) =>
  Object.values(json.props).some(
    prop => prop.type === "enum" && prop.code !== "none",
  ),
)

test.each(withCodeEnums)(
  "%s has its variants checked through variantCases",
  path => {
    const folder = folderOf(path)
    const tests = files.filter(([file]) => folderOf(file) === folder)
    const specifier = `./${path.slice(folder.length + 1)}`
    expect(
      tests.some(
        ([, source]) =>
          importsFrom(source, specifier) && calls(source, "variantCases"),
      ),
      `no test in ${folder} imports ${specifier} and calls variantCases`,
    ).toBe(true)
  },
)
