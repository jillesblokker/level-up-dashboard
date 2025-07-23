import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { buttonStyles, focus } from "@/lib/design-tokens"

const buttonVariants = cva(
  `${buttonStyles.base} ${focus.default}`,
  {
    variants: {
      variant: {
        default: buttonStyles.variants.primary,
        destructive: buttonStyles.variants.destructive,
        outline: buttonStyles.variants.outline,
        secondary: buttonStyles.variants.secondary,
        ghost: buttonStyles.variants.ghost,
        link: "text-amber-400 underline-offset-4 hover:underline hover:text-amber-300",
      },
      size: {
        default: buttonStyles.sizes.default,
        sm: buttonStyles.sizes.sm,
        lg: buttonStyles.sizes.lg,
        icon: buttonStyles.sizes.icon,
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
