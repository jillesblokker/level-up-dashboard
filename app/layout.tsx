import "./globals.css"
import "@/styles/medieval-theme.css"
import { Inter as FontSans } from "next/font/google"
import { Gloock } from "next/font/google"
import { Libre_Baskerville } from "next/font/google"
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
import { GlobalErrorBoundary } from '@/components/global-error-boundary'

const fontSans = FontSans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
  preload: true,
})

const fontGloock = Gloock({
  subsets: ["latin"],
  variable: "--font-gloock",
  display: "swap",
  preload: true,
  weight: "400",
})

const fontLibreBaskerville = Libre_Baskerville({
  subsets: ["latin"],
  variable: "--font-libre-baskerville",
  display: "swap",
  preload: true,
  weight: ["400", "700"],
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
      <html lang="en" suppressHydrationWarning style={{
        backgroundImage: "url('/images/backgroundi.png'), linear-gradient(135deg, #000428, #004e92)",
        backgroundSize: "cover, cover",
        backgroundPosition: "center, center",
        backgroundRepeat: "no-repeat, no-repeat",
        backgroundAttachment: "fixed, fixed",
        minHeight: "100vh"
      }}>
        <head>
          <meta name="mobile-web-app-capable" content="yes" />
          <meta name="apple-mobile-web-app-capable" content="yes" />
          <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        </head>
        <body className={cn(
          "min-h-screen font-sans antialiased",
          fontSans.variable,
          fontGloock.variable,
          fontLibreBaskerville.variable
        )}>
          <GlobalErrorBoundary>
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
          </GlobalErrorBoundary>
        </body>
      </html>
    </ClerkProvider>
  )
}