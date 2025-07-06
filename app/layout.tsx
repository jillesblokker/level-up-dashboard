import "./globals.css"
import "@/styles/medieval-theme.css"
import { Inter as FontSans } from "next/font/google"
import { Providers } from "../components/providers"
import { Toaster } from "@/components/ui/toaster"
import { cn } from "@/lib/utils"
import type { Metadata, Viewport } from "next"
import { Toaster as SonnerToaster } from "sonner"
import { GradientProvider } from './providers/gradient-provider'
import { AuthContent } from '@/components/auth-content'
import AuthGate from "@/app/components/AuthGate"
import { ClerkProvider } from '@clerk/nextjs'
import { ThemeProvider } from '@/components/theme-provider'
import { ErrorBoundary } from '@/components/error-boundary'

const fontSans = FontSans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
  preload: true,
})

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export const metadata: Metadata = {
  title: "Thrivehaven",
  description: "Your personal growth and development companion",
  manifest: "/manifest.json",
  icons: {
    icon: "/icons/thrivehaven_fav_optimized.png",
    apple: "/icons/thrivehaven_fav.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Thrivehaven",
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider
      signInFallbackRedirectUrl="/kingdom"
      signUpFallbackRedirectUrl="/kingdom"
    >
      <html lang="en" suppressHydrationWarning>
        <head>
          <meta name="mobile-web-app-capable" content="yes" />
          <meta name="apple-mobile-web-app-capable" content="yes" />
          <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        </head>
        <body className={cn(
          "min-h-screen bg-background font-sans antialiased",
          fontSans.variable
        )}>
          <ErrorBoundary>
            <ThemeProvider
              attribute="class"
              defaultTheme="dark"
              enableSystem
            >
              <GradientProvider>
                <Providers>
                  <AuthContent>
                    <AuthGate>
                      {children}
                    </AuthGate>
                  </AuthContent>
                  <Toaster />
                  <SonnerToaster 
                    position="top-center"
                    toastOptions={{
                      style: {
                        background: 'rgba(0, 0, 0, 0.9)',
                        color: '#fbbf24',
                        border: '1px solid rgba(146, 64, 14, 0.5)',
                        backdropFilter: 'blur(8px)',
                      },
                      className: 'border border-amber-900/50 bg-black/80 text-amber-400',
                    }}
                  />
                </Providers>
              </GradientProvider>
            </ThemeProvider>
          </ErrorBoundary>
        </body>
      </html>
    </ClerkProvider>
  )
}