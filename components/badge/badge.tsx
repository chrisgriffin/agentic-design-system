import type { HTMLAttributes } from "react"

import styles from "./badge.module.css"

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  children: string
  tone?: "neutral" | "accent" | "success" | "danger"
}

export function Badge({
  children,
  tone = "neutral",
  className,
  ...rest
}: BadgeProps) {
  return (
    <span
      className={[styles.badge, styles[tone], className]
        .filter(Boolean)
        .join(" ")}
      {...rest}
    >
      {children}
    </span>
  )
}
