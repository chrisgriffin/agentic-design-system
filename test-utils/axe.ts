import axe from "axe-core"
import { expect } from "vitest"

/**
 * Runs axe-core against a rendered container and fails on any violation,
 * naming each rule, what it checks, how many nodes broke it and the first one.
 */
export async function expectNoViolations(container: HTMLElement) {
  const { violations } = await axe.run(container, {
    rules: {
      // jsdom has no layout and no computed colour, so axe cannot measure
      // contrast here. Off explicitly, so nobody reads a silent pass into it.
      "color-contrast": { enabled: false },
    },
  })
  const report = violations.map(
    v =>
      `${v.id}: ${v.help} (${v.nodes.length} node(s)) — ${v.nodes[0]?.target.join(" ")}`,
  )
  expect(report, "axe-core violations").toEqual([])
}
