// Builds tokens/css/tokens.css from the token source: the same
// parse() → build() → write the Terrazzo CLI runs, over the merged document,
// then every `var(--ads-primitive-*)` is inlined with its value and the
// primitive declarations are dropped, so only the semantic tier ships.
import { mkdirSync, writeFileSync } from "node:fs"

import { build, defineConfig, Logger, parse } from "@terrazzo/parser"

import userConfig from "../../terrazzo.config.mjs"
import { inlinePrimitives } from "./inline-primitives.mjs"
import { document } from "./source.mjs"

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

for (const { filename, contents } of result.outputFiles) {
  const output = new URL(filename, config.outDir)
  mkdirSync(new URL(".", output), { recursive: true })
  writeFileSync(output, inlinePrimitives(String(contents)))
}
console.log(`✔︎ Built ${Object.keys(tokens).length} tokens into tokens/css/`)
