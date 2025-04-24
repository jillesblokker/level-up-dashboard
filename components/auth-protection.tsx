"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Loader2 } from "lucide-react";

interface AuthProtectionProps {
  children: React.ReactNode;
  adminOnly?: boolean;
}

export function AuthProtection({ children, adminOnly = false }: AuthProtectionProps) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    if (status === "loading") return;

    if (status === "unauthenticated") {
      router.push("/auth/signin?callbackUrl=" + encodeURIComponent(window.location.pathname));
      return;
    }

    if (adminOnly && !session?.user?.isAdmin) {
      router.push("/kingdom");
      return;
    }

    setIsAuthorized(true);
  }, [status, session, router, adminOnly]);

  if (status === "loading" || !isAuthorized) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="flex flex-col items-center">
          <Loader2 className="h-10 w-10 text-amber-500 animate-spin mb-4" />
          <p className="text-amber-500 text-lg">Verifying your access...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
} 