// inlinePrimitives on its own, without running the build: the regexes that
// make only the semantic tier ship.
import assert from "node:assert/strict"
import { test } from "node:test"

import { inlinePrimitives } from "./inline-primitives.mjs"

const css = `:root {
  --ads-primitive-blue-500: rgb(0% 40% 100%);
  --ads-primitive-space-4: 1rem;
  --ads-color-fg-accent: var(--ads-primitive-blue-500);
  --ads-space-md: var(--ads-primitive-space-4);
}
`

test("a primitive reference becomes the primitive's value", () => {
  const out = inlinePrimitives(css)
  assert.match(out, /--ads-color-fg-accent: rgb\(0% 40% 100%\);/)
  assert.match(out, /--ads-space-md: 1rem;/)
  assert.doesNotMatch(out, /var\(/)
})

test("primitive declarations are gone from the output", () => {
  assert.doesNotMatch(inlinePrimitives(css), /--ads-primitive-/)
})

test("an undeclared primitive throws", () => {
  assert.throws(
    () =>
      inlinePrimitives(":root {\n  --ads-x: var(--ads-primitive-nope);\n}\n"),
    /no primitive declares --ads-primitive-nope/,
  )
})
