import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-all duration-150 active:scale-95 active:brightness-90 touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 select-none",
  {
    variants: {
      variant: {
        default: "bg-gradient-to-b from-[#1f6834] via-[#134e24] to-[#0a2d14] hover:from-[#277c40] hover:via-[#18602d] hover:to-[#0d3819] text-[#fef9c3] hover:text-white border border-[#b45309] hover:border-[#f59e0b] shadow-[0_3px_10px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(254,240,138,0.45),inset_0_-2px_4px_rgba(0,0,0,0.6),0_0_12px_rgba(34,197,94,0.25)] hover:shadow-[0_4px_14px_rgba(0,0,0,0.8),inset_0_1px_2px_rgba(254,240,138,0.65),inset_0_-2px_4px_rgba(0,0,0,0.6),0_0_20px_rgba(34,197,94,0.45)] font-serif font-bold disabled:opacity-50 disabled:grayscale",
        destructive: "bg-gradient-to-b from-[#881337] via-[#4c0519] to-[#20020b] hover:from-[#9f1239] hover:via-[#5c0720] hover:to-[#2b030e] text-[#fecdd3] hover:text-white border border-[#991b1b] hover:border-[#ef4444] shadow-[0_3px_10px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(254,205,211,0.35),inset_0_-2px_4px_rgba(0,0,0,0.6)] font-serif font-bold disabled:opacity-50 disabled:grayscale",
        outline: "border border-amber-500/40 bg-zinc-950/60 text-amber-300 hover:bg-amber-950/40 hover:text-amber-100 hover:border-amber-400 font-serif font-medium shadow-xs",
        secondary: "bg-gradient-to-b from-[#1d4b8f] via-[#113264] to-[#091d3e] hover:from-[#255cb0] hover:via-[#163f7c] hover:to-[#0d2854] text-[#e0f2fe] hover:text-white border border-[#b45309] hover:border-[#f59e0b] shadow-[0_3px_10px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(191,219,254,0.45),inset_0_-2px_4px_rgba(0,0,0,0.6),0_0_12px_rgba(59,130,246,0.25)] hover:shadow-[0_4px_14px_rgba(0,0,0,0.8),inset_0_1px_2px_rgba(191,219,254,0.65),inset_0_-2px_4px_rgba(0,0,0,0.6),0_0_20px_rgba(59,130,246,0.45)] font-serif font-bold disabled:opacity-50 disabled:grayscale",
        ghost: "text-amber-300/80 hover:text-amber-100 hover:bg-amber-950/30 active:bg-amber-950/50 font-serif",
        link: "text-amber-400 underline-offset-4 hover:underline hover:text-amber-300 font-serif",
        gold: "bg-gradient-to-b from-[#b45309] via-[#78350f] to-[#451a03] hover:from-[#d97706] hover:via-[#92400e] hover:to-[#572204] text-[#fef3c7] border border-[#f59e0b] font-serif font-bold shadow-[0_2px_10px_rgba(245,158,11,0.25),inset_0_1px_1px_rgba(254,240,138,0.45)] uppercase tracking-wider",
        medieval: "bg-zinc-950/80 border border-amber-900/60 text-amber-200 hover:border-amber-500/60 hover:bg-amber-950/30 active:bg-amber-950/60 shadow-md font-serif",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

interface ButtonVariantProps extends VariantProps<typeof buttonVariants> {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link" | "gold" | "medieval"
  size?: "default" | "sm" | "lg" | "icon"
}

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    ButtonVariantProps {
  asChild?: boolean
  isLoading?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, isLoading = false, children, disabled, ...props }, ref) => {
    if (asChild) {
      return (
        <Slot
          className={cn(buttonVariants({ variant, size, className }))}
          ref={ref}
          {...props}
        >
          {children}
        </Slot>
      )
    }

    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin shrink-0 mx-auto" />
        ) : (
          children
        )}
      </button>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
