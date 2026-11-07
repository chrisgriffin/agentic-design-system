// Builds tokens/css/tokens.css from the token source: the same
// parse() → build() → write the Terrazzo CLI runs, over the merged document,
// then every `var(--ads-primitive-*)` is inlined with its value and the
// primitive declarations are dropped, so only the semantic tier ships.
import { mkdirSync, writeFileSync } from "node:fs"

import { build, defineConfig, Logger, parse } from "@terrazzo/parser"

import userConfig from "../../terrazzo.config.mjs"
import { document, PREFIX } from "./source.mjs"

const cwd = new URL("../../", import.meta.url)
const logger = new Logger()
const config = defineConfig(userConfig, { cwd, logger })

const { tokens, sources } = await parse(
  [
    {
      filename: new URL("tokens/json/tokens.json", cwd),
      src: JSON.stringify(document),
    },
  ],
  { config, logger },
)
const result = await build(tokens, { sources, config, logger })

const PRIMITIVE = new RegExp(
  `^\\s*(--${PREFIX}-primitive-[\\w-]+):\\s*(.+);$`,
  "gm",
)
export function inlinePrimitives(css) {
  const values = Object.fromEntries(
    [...css.matchAll(PRIMITIVE)].map(m => [m[1], m[2]]),
  )
  const out = css
    .replace(PRIMITIVE, "")
    .replace(/var\((--[\w-]+-primitive-[\w-]+)\)/g, (whole, name) => {
      if (!(name in values))
        throw new Error(`build-css: no primitive declares ${name}`)
      return values[name]
    })
  return out.replace(/\n{3,}/g, "\n\n")
}

for (const { filename, contents } of result.outputFiles) {
  const output = new URL(filename, config.outDir)
  mkdirSync(new URL(".", output), { recursive: true })
  writeFileSync(output, inlinePrimitives(String(contents)))
}
console.log(`✔︎ Built ${Object.keys(tokens).length} tokens into tokens/css/`)
