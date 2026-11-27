import figma from "@figma/code-connect"

import { Badge } from "./badge"

// Placeholder until a Figma file exists: `init --figma-file <key>` writes it.
figma.connect(
  Badge,
  "https://www.figma.com/design/FIGMA_FILE_KEY?node-id=0-1",
  {
    props: {
      children: figma.string("Label"),
      tone: figma.enum("tone", {
        neutral: "neutral",
        accent: "accent",
        success: "success",
        danger: "danger",
      }),
    },
    example: ({ children, tone }) => <Badge tone={tone}>{children}</Badge>,
  },
)
