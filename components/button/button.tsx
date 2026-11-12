import type { ButtonHTMLAttributes, ReactNode } from "react"

import styles from "./button.module.css"

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: string
  size?: "sm" | "md" | "lg"
  variant?: "default" | "outline"
  /** Rendered before the label; any icon node. */
  iconBefore?: ReactNode
}

export function Button({
  children,
  size = "md",
  variant = "default",
  iconBefore,
  className,
  ...rest
}: ButtonProps) {
  return (
    <button
      type="button"
      className={[styles.button, styles[size], styles[variant], className]
        .filter(Boolean)
        .join(" ")}
      {...rest}
    >
      {iconBefore}
      {children}
    </button>
  )
}
