"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createBrowserClient } from '@supabase/ssr'
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Mail, Lock, Loader2 } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"

export function EmailSignInForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const router = useRouter()

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        throw error
      }

      // Optionally handle rememberMe here if your Supabase setup allows custom session duration
      // For now, we rely on default Supabase session behavior

      router.push("/kingdom")
    } catch (error: any) {
      console.error("Auth error:", error)
      toast.error(error.message || "Failed to sign in")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email" className="text-amber-200/80">
          Email
        </Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-amber-200/60" />
          <Input
            id="email"
            type="email"
            placeholder="your@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="pl-10 bg-black/40 border-amber-900/50 text-amber-200 placeholder:text-amber-200/40"
            required
            aria-label="Email address"
            aria-describedby="email-description"
          />
        </div>
        <p id="email-description" className="text-xs text-amber-200/60">
          We'll never share your email with anyone else.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="password" className="text-amber-200/80">
          Password
        </Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-amber-200/60" />
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="pl-10 bg-black/40 border-amber-900/50 text-amber-200 placeholder:text-amber-200/40"
            required
            minLength={6}
            aria-label="Password"
            aria-describedby="password-description"
          />
        </div>
        <p id="password-description" className="text-xs text-amber-200/60">
          Must be at least 6 characters long.
        </p>
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="remember-me"
          checked={rememberMe}
          onCheckedChange={(checked) => setRememberMe(!!checked)}
          aria-label="Stay logged in"
        />
        <Label htmlFor="remember-me" className="text-sm font-medium leading-none text-amber-200/80">
          Stay logged in
        </Label>
      </div>

      <Button
        type="submit"
        className="w-full bg-amber-900/20 hover:bg-amber-900/30 text-amber-200 border border-amber-900/50"
        disabled={isLoading}
        aria-label="Sign in with email"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Logging In...
          </>
        ) : (
          "Enter the Kingdom"
        )}
      </Button>
    </form>
  )
} 