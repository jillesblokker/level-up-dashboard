import "./globals.css"
import "@/styles/medieval-theme.css"
import "@/app/styles/globals.css"
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
import { TitleEvolutionProvider } from '@/components/title-evolution-provider'

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
        backgroundImage: "url('/images/backgroundi.png'), linear-gradient(135deg, #000000, #000000)",
        backgroundSize: "cover, cover",
        backgroundPosition: "center, center",
        backgroundRepeat: "no-repeat, no-repeat",
        backgroundAttachment: "fixed, fixed",
        minHeight: "100vh"
      }}>
        <head>
          <meta name="mobile-web-app-capable" content="yes" />
          <meta name="apple-mobile-web-app-capable" content="yes" />
          <meta name="apple-mobile-web-app-status-bar-style" content="black" />
          <meta name="theme-color" content="#000000" />
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
                      <TitleEvolutionProvider>
                        <div className="main-content-wrapper" style={{ overscrollBehavior: 'none' }}>
                          {children}
                        </div>
                      </TitleEvolutionProvider>
                    </AuthGate>
                    <Toaster />
                    <SonnerToaster 
                      position="bottom-center"
                      toastOptions={{
                        style: {
                          background: '#000000',
                          color: '#fbbf24',
                          border: '1px solid #92400e',
                          marginBottom: 'env(safe-area-inset-bottom, 20px)',
                        },
                        className: 'border border-amber-900 bg-black text-amber-400',
                      }}
                    />
                  </AuthContent>
                </Providers>
              </GradientProvider>
            </ThemeProvider>
          </GlobalErrorBoundary>
        </body>
      </html>
    </ClerkProvider>
  )
}