"use client"

import { SignUp, useClerk } from "@clerk/nextjs";
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import logger from '@/lib/logger';

export default function Page() {
  const { user } = useClerk();
  const router = useRouter();

  // Redirect to kingdom when user is authenticated
  useEffect(() => {
    if (user) {
      logger.info('User detected, redirecting to kingdom...', 'Sign-Up');
      router.push('/kingdom');
    }
  }, [user, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#000428] to-[#004e92]">
      <SignUp
        fallbackRedirectUrl="/kingdom"
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
      />
    </div>
  );
} 