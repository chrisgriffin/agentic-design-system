import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { expect, test, vi } from "vitest"

import { expectNoViolations } from "../../test-utils/axe"
import { variantCases } from "../../test-utils/variants"
import { Button, type ButtonProps } from "./button"
import contract from "./button.contract.json"

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

test("keyboard: Tab reaches it, and Enter and Space each fire onClick once", async () => {
  const user = userEvent.setup()
  const onClick = vi.fn()
  render(<Button onClick={onClick}>Save</Button>)
  const button = screen.getByRole("button", { name: "Save" })

  await user.tab()
  expect(button).toHaveFocus()

  await user.keyboard("{Enter}")
  expect(onClick).toHaveBeenCalledOnce()

  onClick.mockClear()
  await user.keyboard(" ")
  expect(onClick).toHaveBeenCalledOnce()
})

test("keyboard: a disabled Button is skipped by Tab and fires nothing on Enter or Space", async () => {
  const user = userEvent.setup()
  const onClick = vi.fn()
  render(
    <>
      <button type="button">Before</button>
      <Button disabled onClick={onClick}>
        Save
      </Button>
    </>,
  )
  const before = screen.getByRole("button", { name: "Before" })
  const disabled = screen.getByRole("button", { name: "Save" })

  await user.tab()
  expect(before).toHaveFocus()
  await user.tab()
  expect(disabled).not.toHaveFocus()
  expect(document.body).toHaveFocus()

  await user.keyboard("{Enter}")
  await user.keyboard(" ")
  expect(onClick).not.toHaveBeenCalled()
})

test.each(variantCases<ButtonProps>(contract))(
  "%s has no accessibility violations",
  async (_, props) => {
    const { container } = render(<Button {...props}>Save</Button>)
    await expectNoViolations(container)
  },
)

test("with an icon before the label has no accessibility violations", async () => {
  const { container } = render(
    <Button iconBefore={<span aria-hidden="true">→</span>}>Continue</Button>,
  )
  await expectNoViolations(container)
})
