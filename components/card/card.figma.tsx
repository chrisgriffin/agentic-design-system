import figma from "@figma/code-connect"

import { Card } from "./card"

// Placeholder until a Figma file exists: `init --figma-file <key>` writes it.
figma.connect(Card, "https://www.figma.com/design/FIGMA_FILE_KEY?node-id=0-3", {
  props: {
    children: figma.children("Content"),
    padding: figma.enum("padding", { default: "default", none: "none" }),
  },
  example: ({ children, padding }) => <Card padding={padding}>{children}</Card>,
})
