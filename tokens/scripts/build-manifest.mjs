// The resolved-value token manifest, computed in memory whenever it is
// imported. The CSS is a var() chain; the Storybook token pages need literal
// values per theme, so this formats each token through Terrazzo's own CSS
// formatter with the aliases already followed by its parser.
// Shape: { semantic[], themes{light,dark}, primitivePalette[] }.
import { defineConfig, Logger, parse } from "@terrazzo/parser"
import { transformCSSValue } from "@terrazzo/token-tools/css"

import userConfig from "../../terrazzo.config.mjs"
import { document, PREFIX, PRIMITIVE_IDS } from "./source.mjs"

const cwd = new URL("../../", import.meta.url)
const logger = new Logger()
const config = defineConfig(userConfig, { cwd, logger })
const { tokens } = await parse(
  [
    {
      filename: new URL("tokens/json/tokens.json", cwd),
      src: JSON.stringify(document),
    },
  ],
  { config, logger },
)

const varName = id => `--${PREFIX}-${id.replaceAll(".", "-")}`

// One token's value for a mode, as a literal: the parsed set already followed
// every alias, so the alias fields are cleared and the formatter emits the
// value instead of a var() chain.
const resolve = (token, mode = ".") =>
  String(
    transformCSSValue(
      {
        ...token,
        $value: token.mode[mode].$value,
        aliasOf: undefined,
        aliasChain: undefined,
        partialAliasOf: undefined,
        mode: {},
      },
      { tokensSet: tokens, permutation: {} },
    ),
  )

const manifest = {
  semantic: [],
  themes: { light: {}, dark: {} },
  primitivePalette: [],
}
for (const token of Object.values(tokens)) {
  if (PRIMITIVE_IDS.has(token.id)) {
    if (token.$type === "color") {
      const [, family, ...step] = token.id.split(".")
      manifest.primitivePalette.push({
        path: token.id,
        family,
        step: step.join(".") || family,
        value: resolve(token),
      })
    }
    continue
  }
  if (token.$type === "color") {
    for (const theme of Object.keys(manifest.themes))
      manifest.themes[theme][varName(token.id)] = resolve(
        token,
        token.mode[theme] ? theme : ".",
      )
    continue
  }
  manifest.semantic.push({
    name: varName(token.id),
    category: token.id.split(".")[0],
    type: token.$type,
    value: resolve(token),
  })
}

export default manifest
