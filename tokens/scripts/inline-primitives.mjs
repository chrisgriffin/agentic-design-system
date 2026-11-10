// The post-pass that makes only the semantic tier ship: every
// `var(--ads-primitive-*)` is replaced with that primitive's value and the
// primitive declarations are dropped. Kept apart from build-css.mjs, which
// runs the build when it is loaded, so a test can import it.
import { PREFIX } from "./source.mjs"

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
        throw new Error(`inline-primitives: no primitive declares ${name}`)
      return values[name]
    })
  return out.replace(/\n{3,}/g, "\n\n")
}
