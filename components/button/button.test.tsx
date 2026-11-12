import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { expect, test, vi } from "vitest"

import { expectNoViolations } from "../../test-utils/axe"
import { Button } from "./button"

test("renders the label, the size and variant classes, and the icon slot", () => {
  render(
    <Button
      size="lg"
      variant="outline"
      iconBefore={<span data-testid="icon" />}
    >
      Continue
    </Button>,
  )
  const button = screen.getByRole("button", { name: "Continue" })
  expect(button).toHaveClass("button", "lg", "outline")
  expect(screen.getByTestId("icon")).toBeInTheDocument()
})

test("defaults to md and default, and forwards onClick", async () => {
  const onClick = vi.fn()
  render(<Button onClick={onClick}>Save</Button>)
  const button = screen.getByRole("button", { name: "Save" })
  expect(button).toHaveClass("md", "default")
  await userEvent.click(button)
  expect(onClick).toHaveBeenCalledOnce()
})

const SIZES = ["sm", "md", "lg"] as const
const VARIANTS = ["default", "outline"] as const

test.each(SIZES.flatMap(size => VARIANTS.map(variant => ({ size, variant }))))(
  "size $size, variant $variant has no accessibility violations",
  async ({ size, variant }) => {
    const { container } = render(
      <Button size={size} variant={variant}>
        Save
      </Button>,
    )
    await expectNoViolations(container)
  },
)

test("with an icon before the label has no accessibility violations", async () => {
  const { container } = render(
    <Button iconBefore={<span aria-hidden="true">→</span>}>Continue</Button>,
  )
  await expectNoViolations(container)
})
