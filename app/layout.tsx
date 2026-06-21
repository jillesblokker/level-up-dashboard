import { logger } from "@/lib/logger";
import "./globals.css"
import "@/styles/medieval-theme.css"
import "@/app/styles/globals.css"
import "./scrollbar-styles.css"
import { Inter as FontSans } from "next/font/google"
import { Gloock } from "next/font/google"
import { Libre_Baskerville } from "next/font/google"
import { Providers } from "../components/providers"
import { Toaster } from "@/components/ui/toaster"
import { cn } from "@/lib/utils"
import type { Metadata, Viewport } from "next"
import { GradientProvider } from './providers/gradient-provider'
import { AuthContent } from '@/components/auth-content'
import AuthGate from "@/app/components/AuthGate"
import { ClerkProvider } from '@clerk/nextjs'
import { MedievalErrorBoundary as GlobalErrorBoundary } from '@/components/medieval-error-boundary'
import { TitleEvolutionProvider } from '@/components/title-evolution-provider'
import { NavBar } from '@/components/nav-bar'
import { BottomNav } from '@/components/bottom-nav'
import { SeasonalHuntWrapper } from '@/components/seasonal-hunt-wrapper'
import { GameSystemsProvider } from '@/components/game-systems-provider'
import { AudioProvider } from '@/components/audio-provider'
import { ClientOnboardingProvider } from '@/components/client-onboarding-provider'
import { GameStoreProvider } from '@/components/providers/game-store-provider'

// Background systems moved to GameSystemsProvider
// - QuickAddProvider, KeyboardShortcutsProvider, ParticleProvider
// - LocalStorageMigrator, KingdomNotificationManager, DayNightCycle
// - InstallPrompt, PerformanceMonitor, UserStorageInitializer


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
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/favicon.ico", type: "image/x-icon" },
      { url: "/favicon.png", type: "image/png" },
      { url: "/icons/icon-192x192.png", type: "image/png", sizes: "192x192" },
      { url: "/icons/icon-512x512.png", type: "image/png", sizes: "512x512" }
    ],
    shortcut: "/favicon.ico",
    apple: [
      { url: "/apple-touch-icon.png" },
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
      { url: "/icons/icon-152x152.png", sizes: "152x152", type: "image/png" }
    ],
    other: {
      rel: "apple-touch-icon-precomposed",
      url: "/apple-touch-icon-precomposed.png",
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
          card: "bg-zinc-950  border-amber-900/50 shadow-2xl",
          headerTitle: "text-amber-500",
          headerSubtitle: "text-amber-200/80",
          socialButtonsBlockButton: "bg-amber-900/20 hover:bg-amber-900/30 text-amber-200 border-amber-900/50",
          formButtonPrimary: "bg-amber-900/20 hover:bg-amber-900/30 text-amber-200 border-amber-900/50",
          footerActionLink: "text-amber-500 hover:text-amber-400",
          formFieldInput: "bg-zinc-950 border-amber-900/50 text-amber-200",
          formFieldLabel: "text-amber-200/80",
        },
      }}
    >
      <html lang="en" suppressHydrationWarning className="min-h-screen">
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
          <script
            dangerouslySetInnerHTML={{
              __html: `
                (function() {
                  function isChunkError(msg) {
                    return msg && (
                      msg.indexOf('ChunkLoadError') !== -1 ||
                      msg.indexOf('Loading chunk') !== -1 ||
                      msg.indexOf('Failed to fetch dynamically imported module') !== -1 ||
                      msg.indexOf('Importing a module script failed') !== -1
                    );
                  }
                  function safeReload() {
                    var key = 'chunk_error_ts';
                    var last = sessionStorage.getItem(key);
                    var now = Date.now();
                    if (!last || now - Number(last) > 10000) {
                      sessionStorage.setItem(key, String(now));
                      window.location.reload();
                    }
                  }
                  window.addEventListener('unhandledrejection', function(e) {
                    var reason = e.reason;
                    if (!reason) return;
                    var msg = (reason.name || '') + ' ' + (reason.message || '');
                    if (isChunkError(msg)) {
                      e.preventDefault();
                      safeReload();
                    }
                  });
                  window.addEventListener('error', function(e) {
                    var msg = e && e.message ? e.message : '';
                    if (isChunkError(msg)) {
                      safeReload();
                    }
                  });
                })();
              `,
            }}
          />
        </head>
        <body className={cn(
          "min-h-screen font-sans antialiased bg-black text-white",
          fontSans.variable,
          fontGloock.variable,
          fontLibreBaskerville.variable
        )}>
          <GlobalErrorBoundary>
            <Providers>
              <GradientProvider>
                <TitleEvolutionProvider>
                  <AudioProvider>
                    <ClientOnboardingProvider>
                      <AuthGate>
                        <GameSystemsProvider>
                          <GameStoreProvider />
                          <NavBar session={null} />
                          <main className="flex-1 relative pb-24 lg:landscape:pb-0">
                            {children}
                          </main>
                          <BottomNav />
                        </GameSystemsProvider>
                      </AuthGate>
                    </ClientOnboardingProvider>
                  </AudioProvider>
                </TitleEvolutionProvider>
              </GradientProvider>
            </Providers>
          </GlobalErrorBoundary>
        </body>
      </html>
    </ClerkProvider>
  )
}