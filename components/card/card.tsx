import type { HTMLAttributes, ReactNode } from "react"

import { CardHeader } from "./card-header"
import styles from "./card.module.css"

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  padding?: "default" | "none"
}

export function Card({
  children,
  padding = "default",
  className,
  ...rest
}: CardProps) {
  return (
    <div
      className={[
        styles.card,
        padding === "none" && styles.paddingNone,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...rest}
    >
      {children}
    </div>
  )
}

Card.Header = CardHeader
