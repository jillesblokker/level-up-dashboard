import "./globals.css"
import { Inter as FontSans } from "next/font/google"
import { Providers } from "@/components/providers"
import { NavBar } from "@/components/nav-bar"
import { Toaster } from "@/components/ui/toaster"
import { cn } from "@/lib/utils"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { Toaster as SonnerToaster } from "sonner"
import { GradientProvider } from './providers/gradient-provider'

const fontSans = FontSans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
  preload: true,
})

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Thrivehaven",
  description: "Your personal growth and achievement tracking dashboard",
  manifest: "/manifest.json",
  icons: {
    icon: "/icons/thrivehaven_fav.png",
    apple: "/icons/thrivehaven_fav.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Thrivehaven",
  },
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="apple-touch-icon" href="/icons/thrivehaven_fav.png" />
      </head>
      <body className={cn(
        "min-h-screen bg-background font-sans antialiased",
        fontSans.variable
      )}>
        <GradientProvider>
          <Providers>
            <NavBar />
            <main className="flex-1">{children}</main>
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
      </body>
    </html>
  )
}