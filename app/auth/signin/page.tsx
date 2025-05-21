"use client"

import '@/app/globals.css'
import { Button } from "@/components/ui/button"
import { useSearchParams, useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import Image from 'next/image'
import { skipAuth } from '@/app/actions/auth'
import { Scroll, Shield, AlertTriangle, Mail } from 'lucide-react'
import { toast } from "sonner"
import { createBrowserClient } from '@supabase/ssr'
import { EmailSignInForm } from '@/components/auth/email-signin-form'
import { EmailSignUpForm } from '@/components/auth/email-signup-form'

export default function SignIn() {
  const [isLoading, setIsLoading] = useState(false)
  const [authMethod, setAuthMethod] = useState<'github' | 'email' | 'anonymous'>('github')
  const [isEmailSignUp, setIsEmailSignUp] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectedFrom = searchParams?.get('redirectedFrom') || '/kingdom'

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''
  )

  const handleSignIn = async () => {
    try {
      setIsLoading(true)
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          scopes: 'read:user user:email'
        },
      })

      if (error) {
        throw error
      }
    } catch (error: any) {
      console.error('Sign in error:', error)
      toast.error(error.message || 'Failed to sign in')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAnonymousLogin = async () => {
    try {
      setIsLoading(true)
      document.cookie = 'skip-auth=true; path=/; max-age=31536000; SameSite=Lax'
      router.push(redirectedFrom)
    } catch (error: any) {
      console.error('Anonymous login error:', error)
      toast.error('Failed to proceed with anonymous session')
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

        <div className="mt-8 space-y-6">
          {authMethod === 'github' && (
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
          )}

          {authMethod === 'email' && (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-amber-500 text-center">
                {isEmailSignUp ? 'Create Email Account' : 'Sign in with Email'}
              </h3>
              {isEmailSignUp ? <EmailSignUpForm /> : <EmailSignInForm />}
              <div className="text-center text-sm">
                <button
                  type="button"
                  onClick={() => setIsEmailSignUp(!isEmailSignUp)}
                  className="text-amber-500 hover:text-amber-400 focus:outline-none"
                  aria-label={isEmailSignUp ? 'Switch to email sign in' : 'Switch to email sign up'}
                >
                  {isEmailSignUp
                    ? 'Already have an account? Sign in'
                    : "Don't have an account? Sign up"
                  }
                </button>
              </div>
            </div>
          )}

          {authMethod === 'anonymous' && (
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
          )}

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-amber-900/30" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-black/80 text-amber-200/60">Or choose another path</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <Button
              variant="outline"
              className={`flex items-center justify-center px-4 py-2 text-sm font-medium rounded-md text-amber-200 border-amber-900/50 ${
                authMethod === 'github' ? 'bg-amber-900/30' : 'bg-transparent hover:bg-amber-900/20'
              }`}
              onClick={() => setAuthMethod('github')}
              aria-label="Switch to GitHub authentication"
            >
              <Image
                src="/github.svg"
                alt="GitHub"
                width={16}
                height={16}
                className="mr-2"
              />
              GitHub
            </Button>
            <Button
              variant="outline"
              className={`flex items-center justify-center px-4 py-2 text-sm font-medium rounded-md text-amber-200 border-amber-900/50 ${
                authMethod === 'email' ? 'bg-amber-900/30' : 'bg-transparent hover:bg-amber-900/20'
              }`}
              onClick={() => setAuthMethod('email')}
              aria-label="Switch to email authentication"
            >
              <Mail className="h-4 w-4 mr-2" />
              Email
            </Button>
            <Button
              variant="outline"
              className={`flex items-center justify-center px-4 py-2 text-sm font-medium rounded-md text-amber-200 border-amber-900/50 ${
                authMethod === 'anonymous' ? 'bg-amber-900/30' : 'bg-transparent hover:bg-amber-900/20'
              }`}
              onClick={() => setAuthMethod('anonymous')}
              aria-label="Switch to anonymous mode"
            >
              <Scroll className="h-4 w-4 mr-2" />
              Guest
            </Button>
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
