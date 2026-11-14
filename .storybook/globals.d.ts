// Inlined by .storybook/main.ts at build time (Vite `define`).
declare const __TOKEN_MANIFEST__: import("../tokens/scripts/build-manifest.mjs").TokenManifest

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
