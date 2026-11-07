import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { expect, test, vi } from "vitest"

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
