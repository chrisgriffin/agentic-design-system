// Inlined by .storybook/main.ts at build time (Vite `define`).
declare const __TOKEN_MANIFEST__: {
  semantic: { name: string; category: string; type: string; value: string }[]
  themes: Record<"light" | "dark", Record<string, string>>
  primitivePalette: {
    path: string
    family: string
    step: string
    value: string
  }[]
}

declare const __DRIFT_AUDIT__: {
  counts: Record<string, number>
  findings: {
    ruleId: string
    severity: "error" | "warn" | "review"
    surface: string
    side: string
    entity: string
    message: string
  }[]
  decided: { ruleId: string; entity: string; message: string }[]
}

declare module "*.module.css" {
  const classes: Record<string, string>
  export default classes
}
