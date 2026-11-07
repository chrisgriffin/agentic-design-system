import { render, screen } from "@testing-library/react"
import { expect, test } from "vitest"

import { Badge } from "./badge"

test("renders its label and tone class", () => {
  render(<Badge tone="accent">New</Badge>)
  const badge = screen.getByText("New")
  expect(badge).toHaveClass("badge", "accent")
})
