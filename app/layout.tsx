import "./globals.css"
import "@/styles/medieval-theme.css"
import { Inter as FontSans } from "next/font/google"
import type { Metadata, Viewport } from "next"
import ClientLayout from "./ClientLayout"

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
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className={fontSans.variable + " min-h-screen bg-background font-sans antialiased"}>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  )
}