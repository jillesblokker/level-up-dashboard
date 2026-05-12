"use client";
import { useUser } from "@clerk/nextjs";
import RequireSignIn from "@/app/auth/require-signin";
import { LoadingScreen } from "@/components/loading-screen";

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, isLoaded } = useUser();
  
  if (!isLoaded) {
    return (
      <LoadingScreen 
        title="Unlocking the Kingdom..." 
        content="The guards are verifying your credentials. Please wait by the gate."
        variant="blue"
      />
    );
  }
  
  if (!user) {
    return <RequireSignIn />;
  }
  
  return <>{children}</>;
} 