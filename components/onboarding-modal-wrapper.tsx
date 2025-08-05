"use client"

import { useEffect, useRef, useState } from 'react'
import { OnboardingModal } from './onboarding/OnboardingModal'

export function OnboardingModalWrapper() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Don't render until client-side
  if (!isClient) {
    return null;
  }

  // Temporarily disabled onboarding functionality
  return null;
} 