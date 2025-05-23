"use client"

import '@/app/globals.css'
import { Button } from "@/components/ui/button"
import { signIn } from "next-auth/react"
import { useSearchParams, useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import Image from 'next/image'
import { skipAuth } from '@/app/actions/auth'
import { Scroll, Shield, AlertTriangle } from 'lucide-react'
import { toast } from "sonner"

export default function SignIn() {
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  // Handle error from URL params
  useEffect(() => {
    const error = searchParams.get("error")
    if (error) {
      let errorMessage = "An error occurred during sign in"
      
      // Map error codes to user-friendly messages
      switch (error) {
        case "OAuthCallback":
          errorMessage = "Unable to connect to GitHub. Please try again."
          break
        case "OAuthSignin":
          errorMessage = "Could not start the sign in process. Please try again."
          break
        case "Callback":
          errorMessage = "Authentication callback failed. Please try again."
          break
        case "AccessDenied":
          errorMessage = "Access was denied. Please try again."
          break
        case "Configuration":
          errorMessage = "There is a problem with the server configuration."
          break
        case "Default":
          errorMessage = "An unexpected error occurred. Please try again."
          break
      }
      
      setError(errorMessage)
      toast.error(errorMessage)
    }
  }, [searchParams])

  const handleSignIn = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const result = await signIn("github", {
        redirect: true,
        callbackUrl: "/kingdom"
      })
    } catch (error) {
      console.error("Sign in error:", error)
      setError("An unexpected error occurred. Please try again.")
      toast.error("An unexpected error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleAnonymousLogin = async () => {
    try {
      setIsLoading(true)
      await skipAuth()
      router.push("/kingdom")
    } catch (error) {
      console.error("Anonymous login error:", error)
      toast.error("Failed to login anonymously. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#000428] to-[#004e92]">
      <div className="max-w-md w-full space-y-8 p-8 bg-black/80 backdrop-blur-sm rounded-xl border border-amber-900/50 shadow-2xl">
        <div className="text-center">
          <Shield className="mx-auto h-12 w-12 text-amber-500" />
          <h2 className="mt-6 text-3xl font-bold text-amber-500">
            Begin Your Quest
          </h2>
          <p className="mt-2 text-sm text-amber-200/80">
            Choose your path to adventure
          </p>
        </div>

        {error && (
          <div className="p-4 rounded-lg bg-red-900/20 border border-red-900/50">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-red-400" />
              <p className="text-sm text-red-400">{error}</p>
            </div>
          </div>
        )}

        <div className="mt-8 space-y-6">
          <div>
            <button
              onClick={handleSignIn}
              disabled={isLoading}
              className="w-full flex items-center justify-center px-4 py-3 border border-amber-900/50 text-sm font-medium rounded-md text-amber-200 bg-amber-900/20 hover:bg-amber-900/30 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Sign in with GitHub"
            >
              {isLoading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-amber-200" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Summoning Portal...
                </span>
              ) : (
                <>
                  <Image
                    src="/github.svg"
                    alt="GitHub Sigil"
                    width={20}
                    height={20}
                    className="mr-2"
                    priority
                  />
                  Sign in with GitHub Sigil
                </>
              )}
            </button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-amber-900/30" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-black/80 text-amber-200/60">Or venture forth as</span>
            </div>
          </div>

          <div>
            <button
              onClick={handleAnonymousLogin}
              className="w-full flex items-center justify-center px-4 py-3 border border-amber-900/50 text-sm font-medium rounded-md text-amber-200 bg-transparent hover:bg-amber-900/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition-colors"
              aria-label="Continue as anonymous adventurer"
            >
              <Scroll className="h-4 w-4 mr-2" />
              Anonymous Adventurer
            </button>
          </div>
        </div>

        <div className="mt-4 text-center text-xs text-amber-200/60">
          <p>
            By entering, you agree to our{' '}
            <a href="#" className="text-amber-500 hover:text-amber-400">
              Adventurer&apos;s Code
            </a>{' '}
            and{' '}
            <a href="#" className="text-amber-500 hover:text-amber-400">
              Realm Laws
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
