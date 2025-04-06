import type { Metadata, Viewport } from "next"
import { Inter, Cardo } from "next/font/google"
import "./styles/globals.css"
import "./styles/design-system.css"
import "./styles/base.css"
import ClientLayout from "./ClientLayout"
import { Toaster } from "@/components/ui/toaster"

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
})

const cardo = Cardo({
  weight: ['400', '700'],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-cardo",
})

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
}

export const metadata: Metadata = {
  title: "Level Up Kingdom",
  description: "Build and manage your kingdom in this strategic tile-based game",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: "Level Up Kingdom",
    startupImage: [
      {
        url: "/icons/thrivehaven_fav.png",
        media: "(device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2)",
      }
    ],
  },
  applicationName: "Level Up Kingdom",
  formatDetection: {
    telephone: false,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="apple-touch-icon" href="/icons/thrivehaven_fav.png" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#000000" />
      </head>
      <body className={`min-h-screen bg-black text-white font-cardo ${inter.variable} ${cardo.variable}`} suppressHydrationWarning>
        <ClientLayout>
          {children}
        </ClientLayout>
        <Toaster />
      </body>
    </html>
  )
}