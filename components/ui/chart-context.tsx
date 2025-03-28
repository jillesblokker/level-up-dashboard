import type React from "react"
export interface ChartConfig {
  [key: string]: {
    label: string
    color: string
    icon?: React.ComponentType<{ className?: string }>
  }
}

export interface ChartContextValue {
  config: ChartConfig
}

