#!/bin/bash

echo "Starting auth fix..."

# Update auth configuration
cat > auth.ts << EOL
import NextAuth from "next-auth"
import GithubProvider from "next-auth/providers/github"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_ID || "",
      clientSecret: process.env.GITHUB_SECRET || "",
      profile(profile) {
        return {
          id: profile.id.toString(),
          name: profile.name || profile.login,
          email: profile.email,
          image: profile.avatar_url,
          isAdmin: false,
        }
      },
    }),
  ],
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  callbacks: {
    async session({ session, user }) {
      return {
        ...session,
        user: {
          ...session.user,
          id: user.id,
          isAdmin: user.isAdmin || false,
        },
      }
    },
  },
})
EOL

# Update auth route
mkdir -p app/api/auth/\[...nextauth\]
cat > app/api/auth/\[...nextauth\]/route.ts << EOL
import { handlers } from "@/auth"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export const GET = handlers
export const POST = handlers
EOL

# Update sign-in page
mkdir -p app/auth/signin
cat > app/auth/signin/page.tsx << EOL
"use client"

import { useEffect } from "react"
import { signIn } from "next-auth/react"
import { useSearchParams } from "next/navigation"

export default function SignIn() {
  const searchParams = useSearchParams()
  const callbackUrl = searchParams?.get("callbackUrl") || "/"

  useEffect(() => {
    signIn("github", { callbackUrl })
  }, [callbackUrl])

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Redirecting to GitHub...</h1>
        <p>Please wait while we redirect you to GitHub for authentication.</p>
      </div>
    </div>
  )
}
EOL

# Update error page
mkdir -p app/auth/error
cat > app/auth/error/page.tsx << EOL
"use client"

import { useSearchParams } from "next/navigation"
import Link from "next/link"

export default function ErrorPage() {
  const searchParams = useSearchParams()
  const error = searchParams?.get("error")

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Authentication Error</h1>
        <p className="mb-4">
          {error === "Configuration"
            ? "There is a problem with the server configuration."
            : error === "AccessDenied"
            ? "You do not have permission to sign in."
            : "An error occurred during authentication."}
        </p>
        <div className="space-x-4">
          <Link
            href="/"
            className="text-blue-500 hover:text-blue-700 underline"
          >
            Go Home
          </Link>
          <Link
            href="/auth/signin"
            className="text-blue-500 hover:text-blue-700 underline"
          >
            Try Again
          </Link>
        </div>
      </div>
    </div>
  )
}
EOL

echo "Auth configuration updated!" 