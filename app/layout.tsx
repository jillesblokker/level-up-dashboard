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
import { BottomNav } from '@/components/bottom-nav'
import { SeasonalHuntWrapper } from '@/components/seasonal-hunt-wrapper'
import LocalStorageMigrator from '@/components/local-storage-migrator'
import { AudioProvider } from '@/components/audio-provider'
import { KingdomNotificationManager } from '@/components/kingdom-notification-manager'


import { DayNightCycle } from '@/components/day-night-cycle'

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
  title: "Level Up - Medieval Habit Tracker",
  description: "A medieval-themed habit tracking app with quests, kingdom building, and character progression",
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/icons/icon-152x152.png",
    other: {
      rel: "apple-touch-icon-precomposed",
      url: "/icons/icon-152x152.png",
    },
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Level Up",
  },
  other: {
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "black-translucent",
    "theme-color": "#f59e0b",
    "msapplication-TileColor": "#000000",
    "msapplication-config": "/browserconfig.xml"
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
      appearance={{
        elements: {
          rootBox: "mx-auto",
          card: "bg-black/80 backdrop-blur-sm border-amber-900/50 shadow-2xl",
          headerTitle: "text-amber-500",
          headerSubtitle: "text-amber-200/80",
          socialButtonsBlockButton: "bg-amber-900/20 hover:bg-amber-900/30 text-amber-200 border-amber-900/50",
          formButtonPrimary: "bg-amber-900/20 hover:bg-amber-900/30 text-amber-200 border-amber-900/50",
          footerActionLink: "text-amber-500 hover:text-amber-400",
          formFieldInput: "bg-black/50 border-amber-900/50 text-amber-200",
          formFieldLabel: "text-amber-200/80",
        },
      }}
    >
      <html lang="en" suppressHydrationWarning className="h-full">
        <head>
          <meta name="mobile-web-app-capable" content="yes" />
          <meta name="apple-mobile-web-app-capable" content="yes" />
          <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
          <meta name="theme-color" content="#f59e0b" />
          <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, minimum-scale=1, user-scalable=no, viewport-fit=cover" />
          <script
            dangerouslySetInnerHTML={{
              __html: `
                if ('serviceWorker' in navigator) {
                  window.addEventListener('load', function() {
                    navigator.serviceWorker.register('/sw.js')
                      .then(function(registration) {
                        console.log('SW registered: ', registration);
                      })
                      .catch(function(registrationError) {
                        console.log('SW registration failed: ', registrationError);
                      });
                  });
                }
              `,
            }}
          />
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
                  <AudioProvider>
                    <Providers>
                      <div className="flex flex-col h-full">
                        <AuthGate>
                          <NavBar session={null} />
                          <main className="flex-1 relative pb-24 lg:landscape:pb-0">
                            {children}
                          </main>
                          <BottomNav />
                          <SeasonalHuntWrapper />
                        </AuthGate>
                      </div>
                      <LocalStorageMigrator />
                      <KingdomNotificationManager />
                      <DayNightCycle />
                      <Toaster />
                    </Providers>
                  </AudioProvider>
                </TitleEvolutionProvider>
              </GradientProvider>
            </ThemeProvider>
          </GlobalErrorBoundary>
        </body>
      </html>
    </ClerkProvider>
  )
}