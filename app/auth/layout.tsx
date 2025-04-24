import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
      <div className="min-h-screen bg-background">
        <div className="pt-[calc(4rem+env(safe-area-inset-top))] pb-[env(safe-area-inset-bottom)]">
          {children}
        </div>
      </div>
      <Toaster />
    </ThemeProvider>
  )
} 