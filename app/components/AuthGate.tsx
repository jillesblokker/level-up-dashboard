"use client";
import { useUser } from "@clerk/nextjs";
import RequireSignIn from "@/app/auth/require-signin";
import { LoadingScreen } from "@/components/loading-screen";

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, isLoaded } = useUser();
  
  if (!isLoaded) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center z-[9999]">
        <div className="text-amber-500 font-medieval text-2xl animate-pulse">
          Unlocking the Kingdom...
        </div>
      </div>
    );
  }
  
  if (!user) {
    return <RequireSignIn />;
  }
  
  return <>{children}</>;
} 