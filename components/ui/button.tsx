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
        default: "bg-amber-500 text-zinc-950 font-bold hover:bg-amber-600 active:bg-amber-700 disabled:bg-amber-800/50",
        destructive: "bg-red-600 text-white hover:bg-red-700 active:bg-red-800",
        outline: "border border-amber-500 bg-transparent text-amber-500 hover:bg-amber-500 hover:text-white active:bg-amber-600 active:text-white",
        secondary: "bg-amber-900/20 text-amber-400 hover:bg-amber-800/30 active:bg-amber-800/50",
        ghost: "text-amber-500 hover:bg-amber-900/20 active:bg-amber-900/40",
        link: "text-amber-500 underline-offset-4 hover:underline hover:text-amber-400",
        gold: "bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 hover:from-amber-500 hover:to-amber-400 text-amber-950 font-bold uppercase tracking-wider shadow-[0_0_20px_rgba(245,158,11,0.4)] hover:shadow-[0_0_30px_rgba(245,158,11,0.6)] active:scale-95",
        medieval: "bg-zinc-950 border border-amber-900/50 text-amber-200 hover:border-amber-500/50 hover:bg-amber-950/30 active:bg-amber-950/60 shadow-md",
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
