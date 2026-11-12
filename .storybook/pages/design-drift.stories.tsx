import type { Meta, StoryObj } from "@storybook/react-vite"

import styles from "./page.module.css"

// The engine's own audit (`design-delta audit --json`), run when Storybook
// starts and inlined by .storybook/main.ts: the verdict CI gates on, never a
// second comparison.
const audit = __DRIFT_AUDIT__

const meta: Meta = {
  title: "Design Drift/Audit",
  parameters: { layout: "fullscreen" },
}
export default meta

const bySeverity = (s: "error" | "warn" | "review") =>
  audit.findings.filter(f => f.severity === s).length

const rules = [...new Set(audit.findings.map(f => f.ruleId))]

export const Audit: StoryObj = {
  render: () => (
    <main className={styles.page}>
      <h1 className={styles.title}>Design Drift</h1>
      <p className={styles.note}>
        {audit.counts.contracts} contracts, {audit.counts.components}{" "}
        components, {audit.counts.tokens} tokens. {audit.findings.length}{" "}
        findings:{" "}
        <span className={styles.error}>{bySeverity("error")} error</span>,{" "}
        <span className={styles.warn}>{bySeverity("warn")} warn</span>,{" "}
        <span className={styles.review}>{bySeverity("review")} review</span>;{" "}
        {audit.decided.length} decided in design-delta.json.
      </p>
      {rules.map(ruleId => {
        const findings = audit.findings.filter(f => f.ruleId === ruleId)
        return (
          <section key={ruleId}>
            <h2 className={styles.heading}>
              <span className={styles.code}>{ruleId}</span> · {findings.length}
            </h2>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Severity</th>
                  <th>Entity</th>
                  <th>Finding</th>
                </tr>
              </thead>
              <tbody>
                {findings.map(f => (
                  <tr key={`${f.ruleId}:${f.entity}:${f.message}`}>
                    <td className={styles[f.severity]}>{f.severity}</td>
                    <td className={styles.code}>{f.entity}</td>
                    <td>{f.message}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )
      })}
    </main>
  ),
}
