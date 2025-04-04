import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import "./styles/design-system.css"
import "./styles/base.css"
import ClientLayout from "./ClientLayout"
import { Toaster } from "@/components/ui/toaster"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Level Up Dashboard",
  description: "A game management dashboard",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <ClientLayout>
          {children}
        </ClientLayout>
        <Toaster />
      </body>
    </html>
  )
}