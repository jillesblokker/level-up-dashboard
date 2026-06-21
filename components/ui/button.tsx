import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-amber-500 text-white hover:bg-amber-600 disabled:bg-amber-800/50",
        destructive: "bg-red-600 text-white hover:bg-red-700",
        outline: "border border-amber-500 bg-transparent text-amber-500 hover:bg-amber-500 hover:text-white",
        secondary: "bg-amber-900/20 text-amber-400 hover:bg-amber-800/30",
        ghost: "text-amber-500 hover:bg-amber-900/20",
        link: "text-amber-500 underline-offset-4 hover:underline hover:text-amber-400",
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
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
  size?: "default" | "sm" | "lg" | "icon"
}

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    ButtonVariantProps {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
        aria-label={props["aria-label"] || props.title || "button"}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
