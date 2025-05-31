"use client"

import { ThemeProvider } from "next-themes"
import React, { useEffect, useState, createContext, useContext } from 'react'
import { ClerkProvider, useAuth as useClerkAuth } from '@clerk/nextjs';

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

function AuthProvider({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn, userId } = useClerkAuth();
  const [isGuest, setIsGuest] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const skipAuthCookie = document.cookie.split(';').find(c => c.trim().startsWith('skip-auth='));
    const isSkippingAuth = skipAuthCookie ? skipAuthCookie.split('=')[1] === 'true' : false;
    const isSkippingAuthLS = typeof window !== 'undefined' && localStorage.getItem('skip-auth') === 'true';
    if (isSkippingAuth || isSkippingAuthLS) {
      setIsGuest(true);
      setIsLoading(false);
      return;
    }
    if (isLoaded) {
      setIsGuest(false);
      setIsLoading(false);
    }
  }, [isLoaded]);

  return (
    <AuthContext.Provider value={{ isGuest, isLoading, userId: isGuest ? undefined : (userId ?? undefined) }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  return useContext(AuthContext);
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider
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
      <AuthProvider>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </AuthProvider>
    </ClerkProvider>
  )
} 