import base from "@chrisgriffin/config/eslint"
import globals from "globals"

export default [
  { ignores: ["tokens/css/", "storybook-static/", "dist/", "coverage/"] },
  ...base,
  { files: ["components/**"], languageOptions: { globals: globals.browser } },
]
