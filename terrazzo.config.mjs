// How the DTCG source becomes CSS. tokens/scripts/build-css.mjs hands Terrazzo
// the merged document and writes what the plugin emits to tokens/css/.
//
//   tokens/css/tokens.css   :root                 every token, light colors
//                           [data-theme="dark"]   dark colors
//
// A semantic token is `--ads-<id>`; a primitive is `--ads-primitive-<id>` only
// so build-css.mjs can find it, inline it and drop it. Primitives never ship.
// The prefix is one constant, in tokens/scripts/source.mjs.
import { RECOMMENDED_CONFIG } from "@terrazzo/parser"
import css from "@terrazzo/plugin-css"

import { PREFIX, PRIMITIVE_IDS, semantics } from "./tokens/scripts/source.mjs"

const SEMANTIC_COLORS = Object.keys(semantics.color).map(g => `color.${g}.**`)
const variableName = token =>
  `--${PREFIX}-${PRIMITIVE_IDS.has(token.id) ? "primitive-" : ""}${token.id.replaceAll(".", "-")}`

/** @type {import("@terrazzo/parser").Config} */
export default {
  outDir: "./tokens/css/",
  lint: {
    rules: {
      ...RECOMMENDED_CONFIG,
      "core/consistent-naming": "error",
      "core/colorspace": ["error", { colorSpace: "srgb" }],
      "core/required-modes": [
        "error",
        { matches: [{ match: SEMANTIC_COLORS, modes: ["light", "dark"] }] },
      ],
    },
  },
  plugins: [
    css({
      filename: "tokens.css",
      baseSelector: ":root",
      variableName,
      modeSelectors: [
        {
          mode: "dark",
          tokens: SEMANTIC_COLORS,
          selectors: ['[data-theme="dark"]'],
        },
      ],
    }),
  ],
}
