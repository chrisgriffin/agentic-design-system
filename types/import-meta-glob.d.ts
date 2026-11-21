// Vitest runs on Vite, so the gate tests in test-utils/ read files with
// `import.meta.glob`. This types that one member and nothing else: Vite's own
// `vite/types/importMeta.d.ts` (or `vite/client`) would also add `env` and
// `hot` to `import.meta` across the whole program.
import type { ImportGlobFunction } from "vite/types/importGlob.d.ts"

declare global {
  interface ImportMeta {
    readonly glob: ImportGlobFunction
  }
}

export {}
