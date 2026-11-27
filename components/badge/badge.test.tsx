import { render, screen } from "@testing-library/react"
import { expect, test } from "vitest"
import { expectNoViolations } from "../../test-utils/axe"
import { variantCases } from "../../test-utils/variants"
import { Badge, type BadgeProps } from "./badge"
import contract from "./badge.contract.json"

test("renders its label and tone class", () => {
  render(<Badge tone="accent">New</Badge>)
  const badge = screen.getByText("New")
  expect(badge).toHaveClass("badge", "accent")
})

test.each(variantCases<BadgeProps>(contract))(
  "%s has no accessibility violations",
  async (_, props) => {
    const { container } = render(<Badge {...props}>New</Badge>)
    await expectNoViolations(container)
  },
)
