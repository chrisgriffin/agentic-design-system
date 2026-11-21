import ts from "typescript"
import { describe, expect, test } from "vitest"

import { codeEnums, type ContractProps, variantCases } from "./variants"

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

/** Parses a test file's source as TSX. */
const parse = (source: string) =>
  ts.createSourceFile(
    "test.tsx",
    source,
    ts.ScriptTarget.Latest,
    false,
    ts.ScriptKind.TSX,
  )

/**
 * Looks under `root` for a call whose callee is the identifier `name`. The
 * parser, not a regex, decides what is a comment, a string, a template or
 * JSX, so `"image/*"` or `"https://…"` in a test never hides a real call, and
 * a call inside a comment or a string never counts as one.
 */
const callsIn = (root: ts.Node, name: string) => {
  const visit = (node: ts.Node): boolean =>
    (ts.isCallExpression(node) &&
      ts.isIdentifier(node.expression) &&
      node.expression.text === name) ||
    (ts.forEachChild(node, visit) ?? false)
  return visit(root)
}

/** `callsIn` over a whole test file's source. */
const calls = (source: string, name: string) => callsIn(parse(source), name)

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
 * into cases, and a contract with one fails here, naming the contract and
 * its folder's test files, unless one of them imports it and passes that
 * import to `test.each(variantCases(…))` with a case that calls
 * `expectNoViolations`, so no variant list is typed into a test by hand and
 * every case reaches axe.
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

  test("gives one defaults case for a contract with no props", () => {
    expect(variantCases({ id: "empty", title: "Empty" })).toEqual([
      ["defaults", {}],
    ])
  })

  test("takes numeric enum values, as the schema allows", () => {
    const numeric = { props: { columns: { type: "enum", values: [2, 3] } } }
    expect(variantCases<{ columns: number }>(numeric)).toEqual([
      ["columns 2", { columns: 2 }],
      ["columns 3", { columns: 3 }],
    ])
  })

  test("skips a _-prefixed key and a prop that is not an object", () => {
    const annotated = {
      props: {
        _comment: "a note the schema allows",
        _note: null,
        _list: ["enum"],
        broken: null,
        size: { type: "enum", values: ["sm"] },
      },
    }
    expect(codeEnums(annotated)).toEqual([["size", ["sm"]]])
    expect(variantCases(annotated)).toEqual([["size sm", { size: "sm" }]])
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

/** Strips parentheses, `as`, `satisfies` and `!` around an expression. */
const unwrap = (node: ts.Expression): ts.Expression =>
  ts.isParenthesizedExpression(node) ||
  ts.isAsExpression(node) ||
  ts.isSatisfiesExpression(node) ||
  ts.isNonNullExpression(node) ||
  ts.isTypeAssertionExpression(node)
    ? unwrap(node.expression)
    : node

/** The local names an import of `specifier` binds to its default export. */
const bindingsOf = (file: ts.SourceFile, specifier: string) =>
  file.statements.flatMap(node => {
    if (
      !ts.isImportDeclaration(node) ||
      !ts.isStringLiteral(node.moduleSpecifier) ||
      node.moduleSpecifier.text !== specifier ||
      !node.importClause
    )
      return []
    const { name, namedBindings } = node.importClause
    return [
      ...(name ? [name.text] : []),
      ...(namedBindings && ts.isNamedImports(namedBindings)
        ? namedBindings.elements
            .filter(
              element =>
                (element.propertyName ?? element.name).text === "default",
            )
            .map(element => element.name.text)
        : []),
    ]
  })

/** True for `test.each`, `it.each`, `test.concurrent.each` and the like. */
const isTestEach = (node: ts.Expression): boolean => {
  if (!ts.isPropertyAccessExpression(node) || node.name.text !== "each")
    return false
  let root: ts.Expression = node.expression
  while (ts.isPropertyAccessExpression(root)) root = root.expression
  return ts.isIdentifier(root) && ["test", "it"].includes(root.text)
}

/**
 * True when the source imports `specifier` and passes that import straight
 * to `variantCases` as the cases of a `test.each(…)(title, fn)` whose `fn`
 * calls `expectNoViolations`, so every case the contract gives reaches axe.
 */
const readsContract = (source: string, specifier: string) => {
  const file = parse(source)
  const names = bindingsOf(file, specifier)
  if (names.length === 0) return false
  const isCasesCall = (node: ts.Expression | undefined) => {
    const call = node && unwrap(node)
    if (
      !call ||
      !ts.isCallExpression(call) ||
      !ts.isIdentifier(call.expression) ||
      call.expression.text !== "variantCases"
    )
      return false
    const argument = call.arguments[0] && unwrap(call.arguments[0])
    return (
      argument !== undefined &&
      ts.isIdentifier(argument) &&
      names.includes(argument.text)
    )
  }
  const visit = (node: ts.Node): boolean =>
    (ts.isCallExpression(node) &&
      ts.isCallExpression(node.expression) &&
      isTestEach(node.expression.expression) &&
      isCasesCall(node.expression.arguments[0]) &&
      node.arguments.some(
        fn =>
          (ts.isArrowFunction(fn) || ts.isFunctionExpression(fn)) &&
          callsIn(fn.body, "expectNoViolations"),
      )) ||
    (ts.forEachChild(node, visit) ?? false)
  return visit(file)
}

describe("readsContract", () => {
  const header = [
    'import { expectNoViolations } from "../../test-utils/axe"',
    'import { variantCases } from "../../test-utils/variants"',
    'import contract from "./x.contract.json"',
  ].join("\n")
  const each = (cases: string, body = "await expectNoViolations(container)") =>
    `test.each(${cases})("%s", async (_, props) => { ${body} })`

  test.each([
    ["the scaffold's form", `${header}\n${each("variantCases<P>(contract)")}`],
    [
      "it.each",
      `${header}\n${each("variantCases(contract)").replace("test.each", "it.each")}`,
    ],
    [
      "test.concurrent.each",
      `${header}\n${each("variantCases(contract)").replace("test.each", "test.concurrent.each")}`,
    ],
    ["a cast contract", `${header}\n${each("variantCases((contract as C))")}`],
    [
      "a renamed default import",
      `import { default as spec } from "./x.contract.json"\n${each("variantCases(spec)")}`,
    ],
    [
      "a function expression",
      `${header}\ntest.each(variantCases(contract))("%s", async function () { await expectNoViolations(c) })`,
    ],
  ])("counts %s", (_, source) => {
    expect(readsContract(source, "./x.contract.json")).toBe(true)
  })

  test.each([
    ["no import of the contract", each("variantCases(contract)")],
    [
      "an import whose binding never reaches variantCases",
      `${header}\nimport other from "./y.contract.json"\n${each("variantCases(other)")}`,
    ],
    [
      "variantCases outside test.each",
      `${header}\nconst cases = variantCases(contract)\ntest("x", async () => { await expectNoViolations(c) })`,
    ],
    [
      "a test.each case that never calls expectNoViolations",
      `${header}\n${each("variantCases(contract)", "render(props)")}`,
    ],
    [
      "a call inside a comment",
      `${header}\n// ${each("variantCases(contract)")}`,
    ],
  ])("does not count %s", (_, source) => {
    expect(readsContract(source, "./x.contract.json")).toBe(false)
  })

  test("does not count a second contract imported beside the first", () => {
    const source = `${header}\nimport headerContract from "./card-header.contract.json"\n${each("variantCases(contract)")}`
    expect(readsContract(source, "./card-header.contract.json")).toBe(false)
    expect(readsContract(source, "./x.contract.json")).toBe(true)
  })
})

test("finds the contracts", () => {
  expect(contracts.length).toBeGreaterThan(0)
})

const withCodeEnums = contracts.filter(([, json]) => codeEnums(json).length > 0)

test.each(withCodeEnums)(
  "%s has its variants checked through variantCases",
  path => {
    const folder = folderOf(path)
    const tests = files.filter(([file]) => folderOf(file) === folder)
    const specifier = `./${path.slice(folder.length + 1)}`
    expect(
      tests.some(([, source]) => readsContract(source, specifier)),
      tests.length === 0
        ? `${path}: ${folder} has no test file to read it`
        : `${path}: ${tests.map(([file]) => file).join(", ")} ` +
            `never passes its import of ${specifier} to ` +
            "test.each(variantCases(…)) with a case calling expectNoViolations",
    ).toBe(true)
  },
)
