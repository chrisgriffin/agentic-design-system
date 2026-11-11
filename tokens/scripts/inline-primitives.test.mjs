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

test("#23 a primitive aliasing another inlines to its final value", () => {
  const out = inlinePrimitives(`:root {
  --ads-primitive-a: #fff;
  --ads-primitive-b: var(--ads-primitive-a);
  --ads-primitive-c: var(--ads-primitive-b);
  --ads-x: var(--ads-primitive-b);
  --ads-y: var(--ads-primitive-c);
}
`)
  assert.match(out, /--ads-x: #fff;/)
  assert.match(out, /--ads-y: #fff;/)
  assert.doesNotMatch(out, /primitive/)
})

test("#23 a reference cycle between primitives throws, naming it", () => {
  assert.throws(
    () =>
      inlinePrimitives(`:root {
  --ads-primitive-a: var(--ads-primitive-b);
  --ads-primitive-b: var(--ads-primitive-a);
  --ads-x: var(--ads-primitive-a);
}
`),
    /primitive reference cycle: --ads-primitive-a -> --ads-primitive-b -> --ads-primitive-a/,
  )
})

test("#23 a primitive referencing itself throws", () => {
  assert.throws(
    () =>
      inlinePrimitives(
        ":root {\n  --ads-primitive-a: var(--ads-primitive-a);\n  --ads-x: var(--ads-primitive-a);\n}\n",
      ),
    /primitive reference cycle: --ads-primitive-a -> --ads-primitive-a/,
  )
})
