import { cn } from "@/lib/utils"

interface PageTitleProps {
  children: React.ReactNode
  className?: string
}

export function PageTitle({ children, className }: PageTitleProps) {
  return (
    <h1 className={cn(
      "text-2xl font-bold text-yellow-500 text-center mb-6",
      className
    )}>
      {children}
    </h1>
  )
} 