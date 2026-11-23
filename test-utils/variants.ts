/** An enum value the contract schema allows: a string or a number. */
export type ContractValue = string | number

/**
 * The part of a `<name>.contract.json` the accessibility cases read, as wide
 * as the contract schema: only `id` and `title` are required, so `props` may
 * be missing, and a `_`-prefixed key inside `props` may hold anything.
 */
export interface ContractProps {
  props?: Record<string, unknown>
  [key: string]: unknown
}

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value)

const isValue = (value: unknown): value is ContractValue =>
  typeof value === "string" || typeof value === "number"

/**
 * The contract's code-side enum props, as `[name, values]` pairs: every prop
 * whose `type` is `"enum"` and whose `code` is not `"none"`. A missing
 * `props` gives none, and a `_`-prefixed key or a prop that is not an object
 * is skipped before its `type` is read.
 */
export function codeEnums(
  contract: ContractProps,
): [string, ContractValue[]][] {
  return Object.entries(contract.props ?? {})
    .filter(([name]) => !name.startsWith("_"))
    .flatMap(([name, prop]): [string, ContractValue[]][] =>
      isObject(prop) && prop.type === "enum" && prop.code !== "none"
        ? [
            [
              name,
              Array.isArray(prop.values) ? prop.values.filter(isValue) : [],
            ],
          ]
        : [],
    )
}

/**
 * Turns a contract into accessibility cases for `test.each`: every
 * combination of the values of every enum prop code carries, as a
 * `[title, props]` pair, so a value added to the contract gets a case with no
 * test edit. An enum marked `"code": "none"` is design-only and never a prop,
 * so it gets none. A contract with no code-side enum gives one case, the
 * component's defaults. A code-side enum with no string or number value (its
 * `values` missing, empty or holding only other things) throws, naming the
 * prop: it would empty the product and leave the component with no case at
 * all (#71).
 *
 * The props are cast to the component's own type: a contract value that type
 * does not know yet is exactly the case to run, and `drift:verify` reports a
 * contract and a prop type that disagree.
 */
export function variantCases<P>(
  contract: ContractProps,
): [string, Partial<P>][] {
  const enums = codeEnums(contract)
  const empty = enums.filter(([, values]) => values.length === 0)
  if (empty.length > 0)
    throw new Error(
      `enum prop ${empty.map(([name]) => `"${name}"`).join(", ")} has no ` +
        "string or number values, so it would give no accessibility case",
    )

  const combos = enums.reduce<Record<string, ContractValue>[]>(
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
