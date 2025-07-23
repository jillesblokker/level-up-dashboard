import * as React from "react"
import { cn } from "@/lib/utils"
import { inputStyles } from "@/lib/design-tokens"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          `${inputStyles.base} ${inputStyles.focus}`,
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
