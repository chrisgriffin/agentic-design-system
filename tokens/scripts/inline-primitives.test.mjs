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

test("#23 a cycle nothing references still throws", () => {
  assert.throws(
    () =>
      inlinePrimitives(`:root {
  --ads-primitive-a: var(--ads-primitive-b);
  --ads-primitive-b: var(--ads-primitive-a);
  --ads-x: #fff;
}
`),
    /primitive reference cycle: --ads-primitive-a -> --ads-primitive-b -> --ads-primitive-a/,
  )
})

test("#23 a reference with whitespace or a fallback is inlined", () => {
  const out = inlinePrimitives(`:root {
  --ads-primitive-a: #fff;
  --ads-primitive-b: var( --ads-primitive-a , red);
  --ads-x: var( --ads-primitive-a );
  --ads-y: var(--ads-primitive-a, red);
  --ads-z: var(--ads-primitive-a, rgb(0 0 0));
  --ads-w: VAR(--ads-primitive-b);
  --ads-v: calc(var(--ads-primitive-a,1px) + var(--ads-primitive-a));
}
`)
  assert.match(out, /--ads-x: #fff;/)
  assert.match(out, /--ads-y: #fff;/)
  assert.match(out, /--ads-z: #fff;/)
  assert.match(out, /--ads-w: #fff;/)
  assert.match(out, /--ads-v: calc\(#fff \+ #fff\);/)
  assert.doesNotMatch(out, /primitive|red|rgb/)
})

test("#23 a semantic name containing -primitive- is not a primitive", () => {
  const out = inlinePrimitives(`:root {
  --ads-button-primitive-look: #fff;
  --ads-x: var(--ads-button-primitive-look);
}
`)
  assert.match(out, /--ads-button-primitive-look: #fff;/)
  assert.match(out, /--ads-x: var\(--ads-button-primitive-look\);/)
})

test("#23 a primitive declared in two blocks throws", () => {
  assert.throws(
    () =>
      inlinePrimitives(`:root {
  --ads-primitive-a: #fff;
  --ads-x: var(--ads-primitive-a);
}

[data-theme="dark"] {
  --ads-primitive-a: #000;
}
`),
    /--ads-primitive-a is declared more than once/,
  )
})

test("#23 a primitive left in the output in any other form throws", () => {
  assert.throws(
    () =>
      inlinePrimitives(
        ':root {\n  --ads-primitive-a: #fff;\n  --ads-x: "--ads-primitive-a";\n}\n',
      ),
    /a primitive is left in the output/,
  )
  assert.throws(
    () => inlinePrimitives(":root { --ads-primitive-a: #fff; }\n"),
    /a primitive is left in the output/,
  )
})
