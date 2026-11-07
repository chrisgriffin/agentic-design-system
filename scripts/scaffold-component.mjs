#!/usr/bin/env node
// `npm run scaffold -- <kebab-name>`: a new component directory in the shape
// of components/badge, plus the contract design-delta drafts from its props.
// The result passes `npm run verify` as written; the contract is a draft to
// finish by hand (its styles bindings in particular).
import { execFileSync } from "node:child_process"
import { existsSync, mkdirSync, renameSync, writeFileSync } from "node:fs"
import path from "node:path"

const name = process.argv[2]
if (!/^[a-z][a-z0-9]*(-[a-z0-9]+)*$/.test(name ?? "")) {
  console.error("usage: npm run scaffold -- <kebab-name>")
  process.exit(1)
}
const pascal = name.replace(/(^|-)([a-z0-9])/g, (_, __, c) => c.toUpperCase())
const camel = pascal[0].toLowerCase() + pascal.slice(1)
const dir = path.join("components", name)
if (existsSync(dir)) {
  console.error(`${dir} already exists`)
  process.exit(1)
}

const files = {
  [`${name}.tsx`]: `import type { HTMLAttributes } from "react"

import styles from "./${name}.module.css"

export interface ${pascal}Props extends HTMLAttributes<HTMLDivElement> {
  children: string
}

export function ${pascal}({ children, className, ...rest }: ${pascal}Props) {
  return (
    <div className={[styles.${camel}, className].filter(Boolean).join(" ")} {...rest}>
      {children}
    </div>
  )
}
`,
  [`${name}.module.css`]: `.${camel} {
  padding: var(--ads-inset-md);
  color: var(--ads-color-fg-default);
  font-family: var(--ads-font-family-body);
  font-size: var(--ads-font-size-md);
  line-height: var(--ads-line-height-body);
}
`,
  [`${name}.stories.tsx`]: `import type { Meta, StoryObj } from "@storybook/react-vite"

import { ${pascal} } from "./${name}"

const meta: Meta<typeof ${pascal}> = {
  title: "Components/${pascal}",
  component: ${pascal},
  tags: ["autodocs"],
  args: { children: "${pascal}" },
}
export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
`,
  [`${name}.test.tsx`]: `import { render, screen } from "@testing-library/react"
import { expect, test } from "vitest"

import { ${pascal} } from "./${name}"

test("renders its content", () => {
  render(<${pascal}>Hello</${pascal}>)
  expect(screen.getByText("Hello")).toHaveClass("${camel}")
})
`,
  [`${name}.figma.tsx`]: `import figma from "@figma/code-connect"

import { ${pascal} } from "./${name}"

// Placeholder until a Figma file exists: \`init --figma-file <key>\` writes it.
figma.connect(${pascal}, "https://www.figma.com/design/FIGMA_FILE_KEY?node-id=0-1", {
  props: { children: figma.string("Label") },
  example: ({ children }) => <${pascal}>{children}</${pascal}>,
})
`,
  "index.ts": `export { ${pascal} } from "./${name}"
export type { ${pascal}Props } from "./${name}"
`,
}

mkdirSync(dir)
for (const [file, text] of Object.entries(files))
  writeFileSync(path.join(dir, file), text)

// The engine drafts the contract from the props census, at
// <contractsDir>/<id>.contract.json; it moves in beside the component.
const draft = JSON.parse(
  execFileSync(
    "npx",
    ["design-delta", "scaffold", pascal, "--json", "--quiet"],
    {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "inherit"],
    },
  ),
)
renameSync(draft.output, path.join(dir, `${name}.contract.json`))
execFileSync("npx", ["prettier", "--write", dir], { stdio: "inherit" })
console.log(`scaffolded ${dir}: ${Object.keys(files).length + 1} files`)
