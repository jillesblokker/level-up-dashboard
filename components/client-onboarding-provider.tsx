'use client';

import { OnboardingProvider } from '@/hooks/use-onboarding';

interface ClientOnboardingProviderProps {
  children: React.ReactNode;
}

export function ClientOnboardingProvider({ children }: ClientOnboardingProviderProps) {
  // Always render OnboardingProvider. 
  // Internal hooks handling localStorage will safely do nothing during SSR.
  return (
    <OnboardingProvider>
      {children}
    </OnboardingProvider>
  );
}