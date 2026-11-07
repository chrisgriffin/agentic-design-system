import figma from "@figma/code-connect"

import { Button } from "./button"

// Placeholder until a Figma file exists: `init --figma-file <key>` writes it.
figma.connect(
  Button,
  "https://www.figma.com/design/FIGMA_FILE_KEY?node-id=0-2",
  {
    props: {
      children: figma.string("Label"),
      size: figma.enum("size", { sm: "sm", md: "md", lg: "lg" }),
      variant: figma.enum("variant", {
        default: "default",
        outline: "outline",
      }),
      // The design tool toggles a fixed icon beside the label; code takes any node.
      iconBefore: figma.boolean("iconBefore", {
        true: <span aria-hidden="true">→</span>,
        false: undefined,
      }),
    },
    example: ({ children, size, variant, iconBefore }) => (
      <Button size={size} variant={variant} iconBefore={iconBefore}>
        {children}
      </Button>
    ),
  },
)
