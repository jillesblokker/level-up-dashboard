"use client"

import { useEffect } from "react"
import type React from "react"
import { Providers } from "../components/providers"
import { Toaster } from "@/components/ui/toaster"
import { Toaster as SonnerToaster } from "sonner"
import { GradientProvider } from './providers/gradient-provider'
import { AuthContent } from '@/components/auth-content'
import AuthGate from "@/app/components/AuthGate"
import { ThemeProvider } from '@/components/theme-provider'
import { ErrorBoundary } from '@/components/error-boundary'
import { registerServiceWorker } from "./utils/registerSW"

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  useEffect(() => {
    registerServiceWorker();
  }, []);

  return (
    <ErrorBoundary>
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
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
    </ErrorBoundary>
  )
}

