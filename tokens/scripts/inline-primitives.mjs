// The post-pass that makes only the semantic tier ship: every
// `var(--ads-primitive-*)` is replaced with that primitive's final value and
// the primitive declarations are dropped. A primitive whose value references
// another primitive is resolved through the chain first, and a cycle throws,
// so no `var()` to a dropped declaration can ship (#23). Kept apart from
// build-css.mjs, which runs the build when it is loaded, so a test can import
// it.
import { PREFIX } from "./source.mjs"

const PRIMITIVE = new RegExp(
  `^\\s*(--${PREFIX}-primitive-[\\w-]+):\\s*(.+);$`,
  "gm",
)
const REFERENCE = /var\((--[\w-]+-primitive-[\w-]+)\)/g

export function inlinePrimitives(css) {
  const values = Object.fromEntries(
    [...css.matchAll(PRIMITIVE)].map(m => [m[1], m[2]]),
  )
  const resolved = {}
  const resolve = (name, path) => {
    if (!(name in values))
      throw new Error(`inline-primitives: no primitive declares ${name}`)
    if (path.includes(name))
      throw new Error(
        `inline-primitives: primitive reference cycle: ${[...path, name].join(" -> ")}`,
      )
    resolved[name] ??= values[name].replace(REFERENCE, (whole, ref) =>
      resolve(ref, [...path, name]),
    )
    return resolved[name]
  }
  for (const name of Object.keys(values)) resolve(name, [])
  const out = css
    .replace(PRIMITIVE, "")
    .replace(REFERENCE, (whole, name) => resolve(name, []))
  return out.replace(/\n{3,}/g, "\n\n")
}
