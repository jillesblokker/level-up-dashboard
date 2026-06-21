import type * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-amber-500 text-white hover:bg-amber-600",
        secondary: "border-transparent bg-gray-900/50 text-white border border-amber-800/20 hover:bg-gray-800/50",
        destructive: "border-transparent bg-red-600 text-white hover:bg-red-700",
        outline: "text-white border border-amber-800/20 hover:bg-amber-900/20",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
)

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }

