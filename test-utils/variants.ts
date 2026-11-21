/** The part of a `<name>.contract.json` the accessibility cases read. */
export interface ContractProps {
  props: Record<string, { type: string; values?: string[]; code?: string }>
}

/**
 * Turns a contract into accessibility cases for `test.each`: every
 * combination of the values of every enum prop code carries, as a
 * `[title, props]` pair, so a value added to the contract gets a case with no
 * test edit. An enum marked `"code": "none"` is design-only and never a prop,
 * so it gets none. A contract with no code-side enum gives one case, the
 * component's defaults.
 *
 * The props are cast to the component's own type: a contract value that type
 * does not know yet is exactly the case to run, and `drift:verify` reports a
 * contract and a prop type that disagree.
 */
export function variantCases<P>(
  contract: ContractProps,
): [string, Partial<P>][] {
  const axes = Object.entries(contract.props)
    .filter(([, prop]) => prop.type === "enum" && prop.code !== "none")
    .map(([name, prop]) => [name, prop.values ?? []] as const)

  const combos = axes.reduce<Record<string, string>[]>(
    (acc, [name, values]) =>
      acc.flatMap(combo => values.map(value => ({ ...combo, [name]: value }))),
    [{}],
  )

  return combos.map(combo => [
    Object.entries(combo)
      .map(([name, value]) => `${name} ${value}`)
      .join(", ") || "defaults",
    combo as Partial<P>,
  ])
}
