// The post-pass that makes only the semantic tier ship: every
// `var(--ads-primitive-*)` is replaced with that primitive's final value and
// the primitive declarations are dropped. A primitive whose value references
// another primitive is resolved through the chain first, and a cycle throws
// (#23). A reference is found in any spelling a `var()` takes (whitespace
// inside the parentheses, a fallback after a comma), a primitive declared
// twice throws rather than one value silently winning for every block, and
// any `--ads-primitive-*` still in the output throws, so no `var()` to a
// dropped declaration can ship. Kept apart from build-css.mjs, which runs the
// build when it is loaded, so a test can import it.
import { PREFIX } from "./source.mjs"

const NAME = `--${PREFIX}-primitive-[\\w-]+`
const PRIMITIVE = new RegExp(`^\\s*(${NAME})\\s*:\\s*(.+?)\\s*;\\s*$`, "gm")
const REFERENCE_START = new RegExp(
  `\\b[vV][aA][rR]\\(\\s*(${NAME})\\s*([,)])`,
  "g",
)
const LEFTOVER = new RegExp(`--${PREFIX}-primitive-`)

// Replaces every `var(<primitive>[, fallback])` in `text` with `fn(name)`. A
// fallback may hold nested parentheses, so its end is found by counting them.
function replaceReferences(text, fn) {
  let out = ""
  let from = 0
  REFERENCE_START.lastIndex = 0
  for (let m; (m = REFERENCE_START.exec(text));) {
    let end = REFERENCE_START.lastIndex
    if (m[2] === ",") {
      let depth = 1
      while (end < text.length && depth > 0) {
        if (text[end] === "(") depth++
        else if (text[end] === ")") depth--
        end++
      }
      if (depth > 0)
        throw new Error(`inline-primitives: unclosed var() for ${m[1]}`)
    }
    out += text.slice(from, m.index) + fn(m[1])
    from = end
    REFERENCE_START.lastIndex = end
  }
  return out + text.slice(from)
}

export function inlinePrimitives(css) {
  const values = {}
  for (const [, name, value] of css.matchAll(PRIMITIVE)) {
    if (name in values)
      throw new Error(
        `inline-primitives: ${name} is declared more than once; a primitive has one value`,
      )
    values[name] = value
  }
  const resolved = {}
  const resolve = (name, path) => {
    if (!(name in values))
      throw new Error(`inline-primitives: no primitive declares ${name}`)
    if (path.includes(name))
      throw new Error(
        `inline-primitives: primitive reference cycle: ${[...path, name].join(" -> ")}`,
      )
    resolved[name] ??= replaceReferences(values[name], ref =>
      resolve(ref, [...path, name]),
    )
    return resolved[name]
  }
  for (const name of Object.keys(values)) resolve(name, [])
  const out = replaceReferences(css.replace(PRIMITIVE, ""), name =>
    resolve(name, []),
  ).replace(/\n{3,}/g, "\n\n")
  const leftover = out.split("\n").find(line => LEFTOVER.test(line))
  if (leftover !== undefined)
    throw new Error(
      `inline-primitives: a primitive is left in the output: ${leftover.trim()}`,
    )
  return out
}
