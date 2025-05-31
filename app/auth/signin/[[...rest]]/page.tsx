"use client"

import '@/app/globals.css'
import { useRouter, useSearchParams } from "next/navigation"
import { useState, useEffect } from "react"
import Image from 'next/image'
import { Shield, User } from 'lucide-react'
import { toast } from "sonner"
import { SignIn, useUser } from "@clerk/nextjs"

export default function SignInPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const rawRedirectedFrom = searchParams?.get("redirectedFrom") || "/kingdom";
  const redirectedFrom = rawRedirectedFrom.startsWith("/auth/signin") ? "/kingdom" : rawRedirectedFrom;
  const { isSignedIn, isLoaded } = useUser()
  const [checkedGuest, setCheckedGuest] = useState(false)
  const [isGuest, setIsGuest] = useState(false)
  const [showClerkModal, setShowClerkModal] = useState(false)

  useEffect(() => {
    // Check for guest mode in both localStorage and cookies
    const skipAuth =
      (typeof window !== "undefined" && localStorage.getItem("skip-auth") === "true") ||
      (typeof document !== "undefined" && document.cookie.split(';').find(c => c.trim().startsWith('skip-auth='))?.split('=')[1] === 'true')
    if (skipAuth) {
      setIsGuest(true)
      router.replace("/kingdom")
    } else {
      setCheckedGuest(true)
    }
  }, [router])

  // If Clerk is loaded and user is signed in, redirect
  useEffect(() => {
    if (isLoaded && isSignedIn && !isGuest) {
      console.log("[SignInPage] Clerk user is signed in, redirecting to:", redirectedFrom);
      window.location.href = redirectedFrom;
    }
  }, [isLoaded, isSignedIn, isGuest, redirectedFrom]);

  if (!checkedGuest) return null // Wait for guest check

  // Show Clerk modal if requested
  if (showClerkModal) {
    return <SignIn fallbackRedirectUrl={redirectedFrom} />
  }

  // Show custom sign-in UI
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#000428] to-[#004e92]">
      <div className="w-full max-w-md p-8 bg-black/80 rounded-lg shadow-2xl border border-amber-900/50">
        <h2 className="text-2xl font-bold text-amber-500 mb-6 text-center">Sign In</h2>
        <div className="space-y-4">
          <button
            onClick={() => setShowClerkModal(true)}
            className="w-full flex items-center justify-center px-4 py-3 border border-amber-900/50 text-sm font-medium rounded-md text-amber-200 bg-amber-900/10 hover:bg-amber-900/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition-colors"
            aria-label="Sign in with Clerk"
          >
            Sign in with Clerk
          </button>
          <button
            onClick={() => {
              try {
                localStorage.setItem('skip-auth', 'true')
                document.cookie = 'skip-auth=true; path=/'
                router.push(redirectedFrom)
              } catch (error) {
                toast.error('Failed to enter guest mode')
              }
            }}
            className="w-full flex items-center justify-center px-4 py-3 border border-amber-900/50 text-sm font-medium rounded-md text-amber-200 bg-amber-900/10 hover:bg-amber-900/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition-colors"
            aria-label="Continue as Guest (offline mode)"
          >
            Continue as Guest
          </button>
        </div>
      </div>
    </div>
  )
}
