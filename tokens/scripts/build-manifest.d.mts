// The type side of build-manifest.mjs: the shape its default export has, read
// by .storybook/main.ts and, through __TOKEN_MANIFEST__, the Tokens page.
export interface TokenManifest {
  semantic: { name: string; category: string; type: string; value: string }[]
  themes: Record<"light" | "dark", Record<string, string>>
  primitivePalette: {
    path: string
    family: string
    step: string
    value: string
  }[]
}

declare const manifest: TokenManifest
export default manifest
