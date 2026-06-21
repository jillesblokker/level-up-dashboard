"use client";
import { useUser } from "@clerk/nextjs";
import RequireSignIn from "@/app/auth/require-signin";

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, isLoaded } = useUser();
  if (isLoaded && !user) {
    return <RequireSignIn />;
  }
  return <>{children}</>;
} 