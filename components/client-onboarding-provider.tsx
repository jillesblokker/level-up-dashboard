'use client';

import { useEffect, useState } from 'react';
import { OnboardingProvider } from './onboarding-provider';

interface ClientOnboardingProviderProps {
  children: React.ReactNode;
}

export function ClientOnboardingProvider({ children }: ClientOnboardingProviderProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Only render OnboardingProvider on the client side
  if (!isClient) {
    return <>{children}</>;
  }

  return (
    <OnboardingProvider>
      {children}
    </OnboardingProvider>
  );
} 