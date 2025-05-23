"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"

export function SignInButton({ className = "" }: { className?: string }) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const handleSignIn = () => {
    setIsLoading(true)
    // Use direct navigation instead of signIn() to avoid client-side errors
    router.push("/auth/signin")
  }

  return (
    <Button 
      onClick={handleSignIn} 
      className={`bg-gradient-to-r from-amber-600 to-amber-800 hover:from-amber-700 hover:to-amber-900 text-white ${className}`}
      disabled={isLoading}
    >
      {isLoading ? "Redirecting..." : "Sign in with GitHub"}
    </Button>
  )
} 