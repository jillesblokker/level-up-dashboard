import React from 'react'
import { cn } from '@/lib/utils'

interface TouchTargetProps {
  children: React.ReactNode
  className?: string
  as?: 'button' | 'div' | 'a'
  href?: string
  onClick?: () => void
  disabled?: boolean
  'aria-label'?: string
  'aria-describedby'?: string
}

/**
 * TouchTarget component ensures all interactive elements meet minimum 44px touch target requirements
 * for mobile accessibility compliance.
 */
export function TouchTarget({
  children,
  className,
  as: Component = 'div',
  href,
  onClick,
  disabled,
  'aria-label': ariaLabel,
  'aria-describedby': ariaDescribedby,
  ...props
}: TouchTargetProps) {
  const baseClasses = "min-h-[44px] min-w-[44px] flex items-center justify-center"
  
  if (Component === 'a' && href) {
    return (
      <a
        href={href}
        className={cn(baseClasses, className)}
        aria-label={ariaLabel}
        aria-describedby={ariaDescribedby}
        {...props}
      >
        {children}
      </a>
    )
  }
  
  if (Component === 'button' || onClick) {
    return (
      <button
        onClick={onClick}
        disabled={disabled}
        className={cn(baseClasses, className)}
        aria-label={ariaLabel}
        aria-describedby={ariaDescribedby}
        {...props}
      >
        {children}
      </button>
    )
  }
  
  return (
    <div
      className={cn(baseClasses, className)}
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedby}
      {...props}
    >
      {children}
    </div>
  )
} 