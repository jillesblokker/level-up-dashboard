interface PageTitleProps {
  children: React.ReactNode
  className?: string
}

export function PageTitle({ children, className = "" }: PageTitleProps) {
  return (
    <h1 className={`text-3xl font-bold tracking-tight text-center ${className}`}>
      {children}
    </h1>
  )
} 