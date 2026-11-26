// The output the create command, scripts/init.mjs and npm run demo print of
// their own: a title, a line per step, a header above each tool whose output
// follows (shown as that tool prints it), aligned rows and numbered steps.
// Color, and a step line that turns from pending to done in place, only on a
// terminal with NO_COLOR unset; piped, as in the tests and CI, it is plain text.
import { styleText } from "node:util"

export const colored = stream => Boolean(stream.isTTY) && !process.env.NO_COLOR

// styleText checks the stream itself only from Node 22.13, so the check is ours.
const painter = stream => (format, text) =>
  colored(stream) ? styleText(format, text, { validateStream: false }) : text
const out = painter(process.stdout)
const err = painter(process.stderr)

// A pending line left open on a terminal, cleared before the next one.
let open = false
const close = () => {
  if (open) process.stdout.write("\r\x1b[2K")
  open = false
}

const line = (mark, label, detail) =>
  `  ${mark} ${detail === undefined ? label : `${label.padEnd(9)} ${out("dim", detail)}`}`

export const title = (name, what) =>
  `\n  ${out("bold", name)} ${out("dim", `· ${what}`)}\n`

export const tick = (label, detail) => line(out("green", "✓"), label, detail)

// A step that takes a while: on a terminal its line shows as pending until the
// returned function marks it done; piped, only the done line is written.
export const pending = (label, detail) => {
  if (colored(process.stdout)) {
    process.stdout.write(line(out("dim", "◇"), label, detail))
    open = true
  }
  return () => {
    close()
    console.log(tick(label, detail))
  }
}

export const prompt = (question, fallback) =>
  `  ${out("cyan", "◆")} ${question}${fallback ? ` ${out("dim", `(${fallback})`)}` : ""} ${out("dim", "›")} `

export const header = command =>
  `\n  ${out("dim", `── ${command} ${"─".repeat(Math.max(3, 44 - command.length))}`)}`

// Pairs whose value is undefined are left out; keys line up.
export const rows = pairs => {
  const shown = pairs.filter(([, value]) => value !== undefined)
  const width = Math.max(...shown.map(([key]) => key.length))
  return shown
    .map(([key, value]) => `    ${out("dim", key.padEnd(width))}  ${value}`)
    .join("\n")
}

// Numbered; a step's second line sits under its text.
export const next = steps =>
  `\n  ${out("bold", "Next")}\n${steps
    .map(
      (step, i) =>
        `    ${out("dim", String(i + 1))}  ${step.replaceAll("\n", "\n       ")}`,
    )
    .join("\n")}`

export const warn = text => `  ${err("yellow", "!")} ${text}`

// The mark goes on the first line of text, after any blank lines before it.
export const failure = text => {
  close()
  const [, blank, rest] = text.match(/^(\n*)([\s\S]*)$/)
  return `${blank}  ${err("red", "✗")} ${rest}`
}
