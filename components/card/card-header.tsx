import type { HTMLAttributes, ReactNode } from "react"

import styles from "./card-header.module.css"

export interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  title: string
  /** Rendered at the end of the header, for an action or a badge. */
  trailing?: ReactNode
}

export function CardHeader({
  title,
  trailing,
  className,
  ...rest
}: CardHeaderProps) {
  return (
    <div
      className={[styles.header, className].filter(Boolean).join(" ")}
      {...rest}
    >
      <h3 className={styles.title}>{title}</h3>
      {trailing}
    </div>
  )
}
