"use client";
import { useUser } from "@clerk/nextjs";
import RequireSignIn from "@/app/auth/require-signin";
import { LoadingScreen } from "@/components/loading-screen";

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, isLoaded } = useUser();
  
  if (!isLoaded) {
    return <LoadingScreen message="Unlocking the Kingdom..." />;
  }
  
  if (!user) {
    return <RequireSignIn />;
  }
  
  return <>{children}</>;
} 