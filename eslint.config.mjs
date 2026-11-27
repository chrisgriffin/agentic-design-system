import base from "@chrisgriffin/config/eslint"
import globals from "globals"

export default [
  { ignores: ["tokens/css/", "storybook-static/", "dist/", "coverage/"] },
  ...base,
  {
    files: ["components/**", ".storybook/**"],
    languageOptions: {
      globals: {
        ...globals.browser,
        __TOKEN_MANIFEST__: "readonly",
        __DRIFT_AUDIT__: "readonly",
      },
    },
  },
]
