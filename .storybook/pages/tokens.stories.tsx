import type { Meta, StoryObj } from "@storybook/react-vite"

import styles from "./page.module.css"

// The manifest tokens/scripts/build-manifest.mjs computes when Storybook
// starts: every semantic token as a literal, colors per theme.
const { semantic, themes, primitivePalette } = __TOKEN_MANIFEST__

const meta: Meta = {
  title: "Tokens/Tokens",
  parameters: { layout: "fullscreen" },
}
export default meta

const Swatch = ({ value }: { value: string }) => (
  <span className={styles.swatch} style={{ background: value }} />
)

const Colors = () => (
  <>
    <h2 className={styles.heading}>Colors</h2>
    <p className={styles.note}>
      Semantic colors, one value per theme. The toolbar toggle switches the
      preview; this table always shows both.
    </p>
    <table className={styles.table}>
      <thead>
        <tr>
          <th>Token</th>
          <th>Light</th>
          <th>Dark</th>
        </tr>
      </thead>
      <tbody>
        {Object.keys(themes.light).map(name => (
          <tr key={name}>
            <td className={styles.code}>{name}</td>
            <td className={styles.light}>
              <Swatch value={themes.light[name]} />{" "}
              <span className={styles.code}>{themes.light[name]}</span>
            </td>
            <td className={styles.dark}>
              <Swatch value={themes.dark[name]} />{" "}
              <span className={styles.code}>{themes.dark[name]}</span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </>
)

const categories = [...new Set(semantic.map(t => t.category))]

const Scalars = () => (
  <>
    {categories.map(category => (
      <section key={category}>
        <h2 className={styles.heading}>{category}</h2>
        <table className={styles.table}>
          <tbody>
            {semantic
              .filter(t => t.category === category)
              .map(t => (
                <tr key={t.name}>
                  <td className={styles.code}>{t.name}</td>
                  <td className={styles.code}>{t.value}</td>
                  <td className={styles.note}>{t.type}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </section>
    ))}
  </>
)

const Palette = () => (
  <>
    <h2 className={styles.heading}>Primitive palette</h2>
    <p className={styles.note}>
      The raw values the semantic colors alias. They never ship as CSS; code
      references the semantic tokens.
    </p>
    <table className={styles.table}>
      <tbody>
        {primitivePalette.map(c => (
          <tr key={c.path}>
            <td className={styles.code}>{c.path}</td>
            <td>
              <Swatch value={c.value} />{" "}
              <span className={styles.code}>{c.value}</span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </>
)

export const Tokens: StoryObj = {
  render: () => (
    <main className={styles.page}>
      <h1 className={styles.title}>Tokens</h1>
      <p className={styles.note}>
        {Object.keys(themes.light).length} colors, {semantic.length} other
        semantic tokens and {primitivePalette.length} primitives, from
        tokens/json. Only the semantic tier ships, as --ads-* custom properties.
      </p>
      <Colors />
      <Scalars />
      <Palette />
    </main>
  ),
}
