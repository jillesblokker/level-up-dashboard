"use client"

import { ThemeProvider } from "next-themes"
import React, { useEffect, useState, createContext, useContext } from 'react'
import { useAuth as useClerkAuth } from '@clerk/nextjs';
import { TooltipProvider } from "@/components/ui/tooltip"

interface AuthContextType {
  isGuest: boolean;
  isLoading: boolean;
  userId?: string | undefined;
}

const AuthContext = createContext<AuthContextType>({
  isGuest: false,
  isLoading: true,
  userId: undefined,
});

import { setCurrentUserId } from "@/lib/user-scoped-storage"

function AuthProvider({ children }: { children: React.ReactNode }) {
  const { isLoaded, userId } = useClerkAuth();
  const [isGuest, setIsGuest] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const skipAuthCookie = document.cookie.split(';').find(c => c.trim().startsWith('skip-auth='));
    const isSkippingAuth = skipAuthCookie ? skipAuthCookie.split('=')[1] === 'true' : false;
    const isSkippingAuthLS = typeof window !== 'undefined' && localStorage.getItem('skip-auth') === 'true';
    if (isSkippingAuth || isSkippingAuthLS) {
      setIsGuest(true);
      setIsLoading(false);
      setCurrentUserId(null);
      return;
    }
    if (isLoaded) {
      setIsGuest(false);
      setIsLoading(false);
      if (userId) {
        setCurrentUserId(userId);
      } else {
        setCurrentUserId(null);
      }
    }
  }, [isLoaded, userId]);

  return (
    <AuthContext.Provider value={{ isGuest, isLoading, userId: isGuest ? undefined : (userId ?? undefined) }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  return useContext(AuthContext);
}

import { QuickAddProvider } from "@/components/quick-add-provider"
import { ReactQueryProvider } from "@/app/providers/react-query-provider"
import { GlobalSyncProvider } from "@/components/global-sync-provider"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ReactQueryProvider>
      <AuthProvider>
        <GlobalSyncProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <TooltipProvider>
              <QuickAddProvider>
                {children}
              </QuickAddProvider>
            </TooltipProvider>
          </ThemeProvider>
        </GlobalSyncProvider>
      </AuthProvider>
    </ReactQueryProvider>
  )
}

export { useAuthContext as useAuth } 