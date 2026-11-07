import type { Meta, StoryObj } from "@storybook/react-vite"

import { Button } from "./button"

const meta: Meta<typeof Button> = {
  title: "Components/Button",
  component: Button,
  tags: ["autodocs"],
  argTypes: {
    size: { control: "select", options: ["sm", "md", "lg"] },
    variant: { control: "select", options: ["default", "outline"] },
  },
  args: { children: "Button" },
}
export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
export const Outline: Story = { args: { variant: "outline" } }
export const Small: Story = { args: { size: "sm" } }
export const Large: Story = { args: { size: "lg" } }
export const WithIcon: Story = {
  args: { iconBefore: <span aria-hidden="true">→</span>, children: "Continue" },
}
