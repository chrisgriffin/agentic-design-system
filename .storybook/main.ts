import { execFileSync } from "node:child_process"
import path from "node:path"
import { fileURLToPath } from "node:url"

import type { StorybookConfig } from "@storybook/react-vite"

import tokenManifest from "../tokens/scripts/build-manifest.mjs"

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")

const config: StorybookConfig = {
  framework: "@storybook/react-vite",
  core: { disableTelemetry: true },
  stories: ["./pages/**/*.stories.tsx", "../components/**/*.stories.tsx"],
  addons: [
    "@storybook/addon-docs",
    "@storybook/addon-a11y",
    "@storybook/addon-themes",
  ],
  // The token manifest and the engine's own audit, computed once per start
  // and inlined for the Tokens and Design Drift pages: the same verdict CI
  // gates on, never a second comparison.
  viteFinal: config => ({
    ...config,
    define: {
      ...config.define,
      __TOKEN_MANIFEST__: JSON.stringify(tokenManifest),
      __DRIFT_AUDIT__: execFileSync(
        path.join(root, "node_modules/.bin/design-delta"),
        ["audit", "--json"],
        { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "inherit"] },
      ),
    },
  }),
}

export default config
