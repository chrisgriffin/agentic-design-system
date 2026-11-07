// The one check that fails if the pipeline breaks: the built CSS ships the
// semantic tier only, in both themes, and the manifest resolves every value.
import assert from "node:assert/strict"
import { execFileSync } from "node:child_process"
import { readFileSync } from "node:fs"
import { test } from "node:test"

const ROOT = new URL("../../", import.meta.url)
execFileSync(process.execPath, ["tokens/scripts/build-css.mjs"], {
  cwd: ROOT,
  stdio: "pipe",
})
const css = readFileSync(new URL("tokens/css/tokens.css", ROOT), "utf8")

test("only semantic --ads-* custom properties ship, with no var() chains left", () => {
  assert.doesNotMatch(css, /--ads-primitive-/)
  assert.doesNotMatch(css, /var\(/)
  assert.ok((css.match(/^\s*--ads-[\w-]+:/gm) || []).length > 40)
})

test("both themes are present and differ", () => {
  const dark = css.split('[data-theme="dark"]')[1]
  assert.ok(dark, 'a [data-theme="dark"] block')
  assert.match(css, /--ads-color-bg-canvas: rgb\(100% 100% 100%\)/)
  assert.match(dark, /--ads-color-bg-canvas: rgb\(5% 5% 5%\)/)
})

test("the manifest resolves every semantic token to a literal", async () => {
  const { default: manifest } = await import("./build-manifest.mjs")
  assert.ok(manifest.semantic.length > 30)
  for (const t of manifest.semantic)
    assert.doesNotMatch(t.value, /[{}]|var\(/, t.name)
  for (const theme of ["light", "dark"]) {
    assert.ok(Object.keys(manifest.themes[theme]).length >= 15)
    for (const [name, v] of Object.entries(manifest.themes[theme]))
      assert.doesNotMatch(v, /[{}]|var\(/, name)
  }
  assert.notEqual(
    manifest.themes.light["--ads-color-bg-canvas"],
    manifest.themes.dark["--ads-color-bg-canvas"],
  )
  assert.ok(manifest.primitivePalette.length > 20)
})
