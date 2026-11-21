import type { Preview } from "@storybook/react-vite"
import { withThemeByDataAttribute } from "@storybook/addon-themes"

import "../tokens/css/tokens.css"

const preview: Preview = {
  decorators: [
    // The tokens key off [data-theme] on the root (terrazzo.config.mjs); the
    // toolbar toggle sets that attribute and nothing else.
    withThemeByDataAttribute({
      themes: { light: "light", dark: "dark" },
      defaultTheme: "light",
      attributeName: "data-theme",
    }),
  ],
  parameters: {
    options: {
      storySort: { order: ["Tokens", "Design Drift", "Components"] },
    },
  },
}

export default preview
