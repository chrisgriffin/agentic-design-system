import type { Meta, StoryObj } from "@storybook/react-vite"

import { Badge } from "./badge"

const meta: Meta<typeof Badge> = {
  title: "Components/Badge",
  component: Badge,
  tags: ["autodocs"],
  args: { children: "Badge" },
}
export default meta
type Story = StoryObj<typeof meta>

export const Neutral: Story = {}
export const Accent: Story = { args: { tone: "accent" } }
export const Success: Story = { args: { tone: "success" } }
export const Danger: Story = { args: { tone: "danger" } }
