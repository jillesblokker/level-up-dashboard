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
import { NavBar } from '@/components/nav-bar'
import { SeasonalHuntWrapper } from '@/components/seasonal-hunt-wrapper'
import { OnboardingProvider } from '@/components/onboarding-provider'


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
  maximumScale: 5,
  minimumScale: 0.5,
  userScalable: true,
  viewportFit: "cover",
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
      <html lang="en" suppressHydrationWarning className="h-full">
        <head>
          <meta name="mobile-web-app-capable" content="yes" />
          <meta name="apple-mobile-web-app-capable" content="yes" />
          <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
          <meta name="theme-color" content="#000000" />
          <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, minimum-scale=1, user-scalable=no, viewport-fit=cover" />
        </head>
        <body className={cn(
          "h-full font-sans antialiased bg-black text-white",
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
                <TitleEvolutionProvider>
                  <Providers>
                    {/* OnboardingProvider restored with disabled functionality */}
                    <OnboardingProvider>
                      <div className="flex flex-col h-full">
                        <AuthGate>
                          <NavBar session={null} />
                          <main className="flex-1 relative">
                            {children}
                          </main>
                          <SeasonalHuntWrapper />
                        </AuthGate>
                      </div>
                    </OnboardingProvider>
                  </Providers>
                </TitleEvolutionProvider>
              </GradientProvider>
            </ThemeProvider>
          </GlobalErrorBoundary>
        </body>
      </html>
    </ClerkProvider>
  )
}