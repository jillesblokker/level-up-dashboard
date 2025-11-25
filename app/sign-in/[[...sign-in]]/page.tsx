"use client"

import { SignIn } from "@clerk/nextjs";
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';

export default function Page() {
  const searchParams = useSearchParams();
  const { isSignedIn } = useAuth();
  const redirectUrl = searchParams?.get('redirect_url') || '/kingdom';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#000428] to-[#004e92]">
      <SignIn
        forceRedirectUrl="/kingdom"
        fallbackRedirectUrl={redirectUrl}
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