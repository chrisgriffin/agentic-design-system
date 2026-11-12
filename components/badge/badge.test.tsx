import { render, screen } from "@testing-library/react"
import { expect, test } from "vitest"
import { expectNoViolations } from "../../test-utils/axe"
import { Badge } from "./badge"

test("renders its label and tone class", () => {
  render(<Badge tone="accent">New</Badge>)
  const badge = screen.getByText("New")
  expect(badge).toHaveClass("badge", "accent")
})

test.each(["neutral", "accent", "success", "danger"] as const)(
  "tone %s has no accessibility violations",
  async tone => {
    const { container } = render(<Badge tone={tone}>New</Badge>)
    await expectNoViolations(container)
  },
)
