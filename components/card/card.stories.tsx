import type { Meta, StoryObj } from "@storybook/react-vite"

import { Badge } from "../badge"
import { Card } from "./card"

const meta: Meta<typeof Card> = {
  title: "Components/Card",
  component: Card,
  tags: ["autodocs"],
  args: {
    children: (
      <>
        <Card.Header
          title="Card title"
          trailing={<Badge tone="accent">New</Badge>}
        />
        <p>Body copy set in the body font, on a raised surface.</p>
      </>
    ),
  },
}
export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
export const NoPadding: Story = { args: { padding: "none" } }
