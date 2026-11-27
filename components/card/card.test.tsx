import { render, screen } from "@testing-library/react"
import { expect, test } from "vitest"

import { expectNoViolations } from "../../test-utils/axe"
import { variantCases } from "../../test-utils/variants"
import { Badge } from "../badge"
import { Card, type CardProps } from "./card"
import contract from "./card.contract.json"

test("composes a header with a trailing slot inside a padded card", () => {
  render(
    <Card data-testid="card">
      <Card.Header title="Title" trailing={<span data-testid="trailing" />} />
      Body
    </Card>,
  )
  expect(screen.getByTestId("card")).toHaveClass("card")
  expect(screen.getByRole("heading", { level: 3, name: "Title" })).toHaveClass(
    "title",
  )
  expect(screen.getByTestId("trailing")).toBeInTheDocument()
})

test("padding none drops the inset", () => {
  render(
    <Card data-testid="card" padding="none">
      Body
    </Card>,
  )
  expect(screen.getByTestId("card")).toHaveClass("paddingNone")
})

test.each(variantCases<CardProps>(contract))(
  "%s with a header has no accessibility violations",
  async (_, props) => {
    const { container } = render(
      <Card {...props}>
        <Card.Header
          title="Title"
          trailing={<Badge tone="accent">New</Badge>}
        />
        Body
      </Card>,
    )
    await expectNoViolations(container)
  },
)
