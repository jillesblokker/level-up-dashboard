"use client"

import * as React from "react"
import type { ChartConfig, ChartContextValue } from "@/components/ui/chart-context"

const ChartContext = React.createContext<ChartContextValue | null>(null)

export function useChartContext() {
  const context = React.useContext(ChartContext)
  if (!context) {
    throw new Error("useChartContext must be used within a ChartProvider")
  }
  return context
}

interface ChartContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  config: ChartConfig
  children: React.ReactNode
}

export function ChartContainer({ config, children, className, ...props }: ChartContainerProps) {
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  // Create CSS variables for each color
  const style = React.useMemo(() => {
    return Object.entries(config).reduce(
      (acc, [key, value]) => {
        acc[`--color-${key}`] = value.color
        return acc
      },
      {} as Record<string, string>,
    )
  }, [config])

  return (
    <ChartContext.Provider value={{ config }}>
      <div className={className} style={style} {...props}>
        {mounted && children}
      </div>
    </ChartContext.Provider>
  )
}

interface ChartTooltipProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'content'> {
  children?: React.ReactNode
  className?: string
  content?: React.ReactNode
  cursor?: boolean
  offset?: number
  defaultIndex?: number
}

export function ChartTooltip({
  children,
  className,
  content,
  cursor = true,
  offset = 10,
  defaultIndex,
  ...props
}: ChartTooltipProps) {
  return (
    <div className={className} {...props}>
      {children}
    </div>
  )
}

interface ChartTooltipContentProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string
  indicator?: "dot" | "line"
  hideLabel?: boolean
  active?: boolean
  payload?: Array<{
    value: number
    dataKey: string
    name: string
  }>
  label?: string
}

export function ChartTooltipContent({
  className,
  indicator = "dot",
  hideLabel = false,
  active,
  payload,
  label,
  ...props
}: ChartTooltipContentProps) {
  const { config } = useChartContext()

  if (!active || !payload?.length) {
    return null
  }

  return (
    <div className="rounded-lg border bg-background p-2 shadow-md" {...props}>
      <div className="grid gap-2">
        {!hideLabel && <div className="text-xs font-medium">{label}</div>}
        <div className="grid gap-1">
          {payload.map((item, index) => {
            const color = config[item.dataKey]?.color
            const formattedValue = typeof item.value === "number" ? item.value.toLocaleString() : item.value

            return (
              <div key={index} className="flex items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-1">
                  {indicator === "dot" && (
                    <div className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
                  )}
                  {indicator === "line" && <div className="h-1 w-3" style={{ backgroundColor: color }} />}
                  <span>{config[item.dataKey]?.label ?? item.name}</span>
                </div>
                <span className="font-medium tabular-nums">{formattedValue}</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

interface TooltipProps {
  active: boolean
  payload: Array<{
    value: number
    dataKey: string
    name: string
  }>
  label: string
}

function CustomTooltip({ active, payload, label }: TooltipProps) {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border bg-background p-2 shadow-sm">
        <div className="grid grid-cols-2 gap-2">
          <div className="flex flex-col">
            <span className="text-[0.70rem] uppercase text-muted-foreground">
              {label}
            </span>
            <span className="font-bold">
              {payload[0]?.value || 0}
            </span>
          </div>
        </div>
      </div>
    )
  }

  return null
}

