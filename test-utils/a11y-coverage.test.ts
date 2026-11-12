import { expect, test } from "vitest"

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

const stripComments = (source: string) =>
  source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "")

test("finds the component test files", () => {
  expect(files.length).toBeGreaterThan(0)
})

test.each(files)("%s calls expectNoViolations", (file, source) => {
  expect(
    /\bexpectNoViolations\s*\(/.test(stripComments(source)),
    `${file} never calls expectNoViolations`,
  ).toBe(true)
})
