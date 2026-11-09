// The token source, read once for the CSS build and the manifest: one JSON
// file per group under tokens/json/{primitives,semantics}/, deep-merged into
// the single DTCG document Terrazzo parses. Primitives are literal values a
// component never uses directly; semantics alias them and are the only tier
// that ships as CSS.
import { readdirSync, readFileSync } from "node:fs"

export const PREFIX = "ads"

const JSON_DIR = new URL("../json/", import.meta.url)

function readTier(tier) {
  const dir = new URL(`${tier}/`, JSON_DIR)
  const merged = {}
  for (const file of readdirSync(dir)
    .filter(f => f.endsWith(".json"))
    .sort())
    merge(merged, JSON.parse(readFileSync(new URL(file, dir), "utf8")))
  return merged
}

function merge(into, from) {
  for (const [k, v] of Object.entries(from)) {
    if (
      v &&
      typeof v === "object" &&
      !Array.isArray(v) &&
      into[k] &&
      typeof into[k] === "object"
    )
      merge(into[k], v)
    else into[k] = v
  }
  return into
}

/** Dot-path ids of every token in a tree. */
function tokenIds(node, trail = [], out = new Set()) {
  if (node && typeof node === "object" && "$value" in node)
    out.add(trail.join("."))
  else if (node && typeof node === "object")
    for (const [k, v] of Object.entries(node))
      if (!k.startsWith("$")) tokenIds(v, [...trail, k], out)
  return out
}

const primitives = readTier("primitives")
export const semantics = readTier("semantics")
export const PRIMITIVE_IDS = tokenIds(primitives)
for (const id of tokenIds(semantics))
  if (PRIMITIVE_IDS.has(id))
    throw new Error(`tokens: ${id} is both a primitive and a semantic token`)
export const document = merge(structuredClone(primitives), semantics)
