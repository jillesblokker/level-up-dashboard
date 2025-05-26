"use client"

import { ThemeProvider } from "next-themes"
import { createBrowserClient } from '@supabase/ssr'
import React, { useEffect, useState, createContext, useContext } from 'react'
// import { SessionProvider } from "next-auth/react"
import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';

interface AuthContextType {
  session: any; // Or a more specific session type if you have one
  isLoading: boolean;
  goldBalance: number; // Placeholder for now
  supabase: SupabaseClient<Database>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Create the Supabase client instance once at the module level
const supabase = createBrowserClient<Database>(
  process.env['NEXT_PUBLIC_SUPABASE_URL']!,
  process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY']!
);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [goldBalance, setGoldBalance] = useState<number>(0); // Initialize gold balance state

  useEffect(() => {
    const checkAuth = async () => {
      // Check for the skip-auth cookie
      const skipAuthCookie = document.cookie.split(';').find(c => c.trim().startsWith('skip-auth='));
      const isSkippingAuth = skipAuthCookie ? skipAuthCookie.split('=')[1] === 'true' : false;

      if (process.env['NEXT_PUBLIC_SKIP_AUTH'] === 'true' || isSkippingAuth) {
        // Simulate an anonymous session
        setSession({ user: { id: 'anonymous', email: 'guest@localhost' } });
        // For anonymous users, you might load gold from local storage or use a default
        const savedGold = localStorage.getItem('goldBalance'); // Assuming goldBalance is stored in local storage
        setGoldBalance(savedGold ? parseInt(savedGold) : 0); // Use default or parsed value
        setIsLoading(false);
        return;
      }

      // If not skipping auth, check Supabase session
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) {
        console.error('Supabase session error:', error);
        setSession(null);
        setGoldBalance(0); // Reset gold if session fails
      } else {
        setSession(session);
        // Fetch user-specific gold balance from Supabase if needed
        // For now, setting a default or fetching logic can be added here later
         setGoldBalance(0); // Placeholder or fetch logic
      }
      setIsLoading(false);
    };

    checkAuth();

    // Optional: Listen for auth state changes if needed
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
       setSession(session);
       // Update gold balance here if it's tied to auth state changes
         setGoldBalance(0); // Placeholder or update logic
    });

    return () => { subscription.unsubscribe() };
  }, [supabase.auth]);

  return (
    // <SessionProvider>
      <AuthContext.Provider value={{ session, isLoading, goldBalance, supabase }}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </AuthContext.Provider>
    // </SessionProvider>
  )
} 