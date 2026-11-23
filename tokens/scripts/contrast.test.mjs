// Text contrast, which axe cannot measure in jsdom (#60): every text pair a
// component stylesheet sets reaches WCAG 2.1 AA's 4.5:1 in both themes. The
// pairs are read from the stylesheets, not listed here, so a new component or
// variant is checked with no edit to this file; the colors are the build
// manifest's, the values the CSS ships.
import assert from "node:assert/strict"
import { readdirSync, readFileSync } from "node:fs"
import { test } from "node:test"

import manifest from "./build-manifest.mjs"

const MIN = 4.5
const CANVAS = "--ads-color-bg-canvas"
const COMPONENTS = new URL("../../components/", import.meta.url)

// A component stylesheet as rules: a top-level `.class`, and its nested
// `&:state` blocks. Anything else throws, so a selector this reader does not
// model fails loudly instead of leaving its pairs unchecked.
function parseRules(css) {
  const rules = []
  const stack = []
  let text = ""
  const declare = () => {
    const decl = text.trim()
    text = ""
    if (!decl) return
    const at = decl.indexOf(":")
    const rule = stack.at(-1)
    if (!rule || at < 0) throw new Error(`contrast: cannot read "${decl}"`)
    rule.decls[decl.slice(0, at).trim()] = decl.slice(at + 1).trim()
  }
  for (const ch of css.replace(/\/\*[\s\S]*?\*\//g, "")) {
    if (ch === "{") {
      const selector = text.trim()
      text = ""
      const parent = stack.at(-1)
      const decls = {}
      // A nested list (`&:hover, &:active`) is one rule per state, sharing
      // its declarations.
      const group = (parent ? selector.split(",") : [selector]).map(s => {
        const top = !parent && /^\.([\w-]+)$/.exec(s.trim())
        const nested = parent && !parent.state && /^&:([\w-]+)$/.exec(s.trim())
        if (!top && !nested)
          throw new Error(`contrast: cannot model selector "${selector}"`)
        return top
          ? { cls: top[1], state: null, decls }
          : { cls: parent.cls, state: nested[1], decls }
      })
      rules.push(...group)
      stack.push(group[0])
    } else if (ch === ";") declare()
    else if (ch === "}") {
      declare()
      stack.pop()
    } else text += ch
  }
  return rules
}

const token = value => {
  if (value === "transparent") return CANVAS
  const m = /^var\((--[\w-]+)\)$/.exec(value)
  if (!m) throw new Error(`contrast: cannot resolve "${value}"`)
  return m[1]
}

// The text pairs one stylesheet sets. The first class is the component's
// root, and each other class a modifier applied on top of it. The cascade is
// followed as the browser does for these selectors: root, then modifier,
// then the root's `:state` (one class plus a pseudo-class outranks a lone
// modifier), then the modifier's `:state`. Text with no background of its own
// sits on the canvas, and an accent token used as text is also checked there.
function textPairs(css) {
  const rules = parseRules(css)
  if (!rules.length) return []
  const root = rules[0].cls
  // A class or state written in more than one block is every block, merged
  // in source order, as the browser's cascade does.
  const find = (cls, state) => {
    const matches = rules.filter(r => r.cls === cls && r.state === state)
    return matches.length
      ? Object.assign({}, ...matches.map(r => r.decls))
      : undefined
  }
  const modifiers = [null, ...new Set(rules.map(r => r.cls))].filter(
    c => c !== root,
  )
  const states = [null, ...new Set(rules.map(r => r.state).filter(Boolean))]
  const pairs = new Map()
  const add = (fg, bg, where) => {
    const key = `${fg} on ${bg}`
    if (!pairs.has(key)) pairs.set(key, { fg, bg, where })
  }
  for (const mod of modifiers)
    for (const state of states) {
      const layers = [
        find(root, null),
        mod && find(mod, null),
        state && find(root, state),
        mod && state && find(mod, state),
      ]
      let fg, bg
      for (const decls of layers.filter(Boolean)) {
        if (decls.color) fg = token(decls.color)
        const background = decls.background ?? decls["background-color"]
        if (background) bg = token(background)
      }
      if (!fg) continue
      const where = `.${root}${mod ? `.${mod}` : ""}${state ? `:${state}` : ""}`
      add(fg, bg ?? CANVAS, where)
      if (fg.startsWith("--ads-color-accent-")) add(fg, CANVAS, where)
    }
  return [...pairs.values()]
}

const luminance = rgb => {
  const m = /^rgb\(([\d.]+)% ([\d.]+)% ([\d.]+)%\)$/.exec(rgb)
  if (!m) throw new Error(`contrast: cannot read color "${rgb}"`)
  const [r, g, b] = m
    .slice(1)
    .map(p => Number(p) / 100)
    .map(c => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4))
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

const ratio = (a, b) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

const stylesheets = readdirSync(COMPONENTS, { recursive: true })
  .filter(f => f.endsWith(".module.css"))
  .sort()

test("#60 every component text pair reaches 4.5:1 in both themes", () => {
  const failures = []
  let checked = 0
  for (const file of stylesheets) {
    const css = readFileSync(new URL(file, COMPONENTS), "utf8")
    for (const { fg, bg, where } of textPairs(css))
      for (const [theme, colors] of Object.entries(manifest.themes)) {
        for (const name of [fg, bg])
          assert.ok(colors[name], `${file}: ${name} is not a color token`)
        const r = ratio(colors[fg], colors[bg])
        checked++
        if (r < MIN)
          failures.push(
            `${file} ${where}: ${fg} on ${bg} is ${r.toFixed(2)}:1 in ${theme}, needs ${MIN}:1`,
          )
      }
  }
  assert.ok(checked > 0, "no text pairs found in components/")
  assert.deepEqual(failures, [])
})

test("#60 the pair reader follows the cascade a browser does", () => {
  const css = `
    .root {
      background: var(--ads-color-accent-default);
      color: var(--ads-color-fg-on-accent);
      &:active { background: var(--ads-color-accent-active); }
    }
    .ghost {
      background: transparent;
      color: var(--ads-color-accent-default);
    }
  `
  const pairs = textPairs(css).map(p => `${p.where} ${p.fg} on ${p.bg}`)
  assert.deepEqual(pairs, [
    ".root --ads-color-fg-on-accent on --ads-color-accent-default",
    ".root:active --ads-color-fg-on-accent on --ads-color-accent-active",
    ".root.ghost --ads-color-accent-default on --ads-color-bg-canvas",
    ".root.ghost:active --ads-color-accent-default on --ads-color-accent-active",
  ])
  const listed = css.replace(
    /background: transparent;/,
    "$&\n&:hover, &:active { background: var(--ads-color-accent-subtle); }",
  )
  assert.deepEqual(
    textPairs(listed)
      .filter(p => p.where.startsWith(".root.ghost:"))
      .map(p => `${p.where} ${p.bg}`),
    [".root.ghost:active --ads-color-accent-subtle"],
  )
  // A class or state repeated in a later block is merged in, not dropped:
  // a second modifier block, a second root block and a second state block.
  const repeated = `${css}
    .ghost { color: var(--ads-color-fg-muted); }
    .root { color: var(--ads-color-fg-default); }
    .root { &:active { color: var(--ads-color-fg-subtle); } }
  `
  assert.deepEqual(
    textPairs(repeated).map(p => `${p.where} ${p.fg} on ${p.bg}`),
    [
      ".root --ads-color-fg-default on --ads-color-accent-default",
      ".root:active --ads-color-fg-subtle on --ads-color-accent-active",
      ".root.ghost --ads-color-fg-muted on --ads-color-bg-canvas",
    ],
  )
  assert.throws(() => textPairs(".a .b { color: red; }"), /cannot model/)
  assert.throws(() => textPairs(".a { color: red; }"), /cannot resolve/)
})

test("#60 the ratio is WCAG 2.1's", () => {
  assert.equal(
    ratio("rgb(100% 100% 100%)", "rgb(0% 0% 0%)").toFixed(2),
    "21.00",
  )
  assert.equal(
    ratio("rgb(100% 100% 100%)", "rgb(40% 55% 95%)").toFixed(2),
    "3.17",
  )
})
