import type { Metadata } from "next"
import { Inter, Cinzel } from "next/font/google"
import "./styles/globals.css"
import "./styles/design-system.css"
import ClientLayout from "./ClientLayout"

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
})

const cinzel = Cinzel({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-cinzel",
})

export const metadata: Metadata = {
  title: "Level Up Dashboard",
  description: "A fantasy realm building game",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={`min-h-screen bg-black text-white ${inter.variable} ${cinzel.variable}`} suppressHydrationWarning>
        <ClientLayout>
          {children}
        </ClientLayout>
      </body>
    </html>
  )
}