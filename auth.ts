import NextAuth, { NextAuthOptions } from "next-auth"
import GithubProvider from "next-auth/providers/github"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { PrismaClient } from "@prisma/client"
import type { DefaultSession } from "next-auth"
import { getServerSession } from "next-auth/next"
import type { Session } from "next-auth"
import type { JWT } from "next-auth/jwt"
import type { Adapter } from "next-auth/adapters"

// Extend the built-in session type
declare module "next-auth" {
  interface Session {
    user: {
      id: string
      isAdmin: boolean
    } & DefaultSession["user"]
  }
}

// Create a new prisma client
const prisma = new PrismaClient()

// Get base URL from environment with fallback
const baseUrl = process.env.NEXTAUTH_URL

if (!baseUrl) {
  throw new Error("NEXTAUTH_URL must be set")
}

// Custom logger for debugging auth issues
const logger = {
  error(code: string, ...message: any[]) {
    console.error(`[Auth Error][${code}]`, ...message)
  },
  warn(code: string, ...message: any[]) {
    console.warn(`[Auth Warning][${code}]`, ...message)
  },
  debug(code: string, ...message: any[]) {
    if (process.env.NEXTAUTH_DEBUG === "true") {
      console.log(`[Auth Debug][${code}]`, ...message)
    }
  }
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as Adapter,
  debug: process.env.NEXTAUTH_DEBUG === "true",
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_ID || "",
      clientSecret: process.env.GITHUB_SECRET || "",
      authorization: {
        params: { scope: "read:user user:email" }
      }
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      return true
    },
    async session({ session, token }: { session: Session; token: JWT }) {
      if (session?.user) {
        session.user.id = token.sub!
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: token.sub },
            select: { isAdmin: true }
          })
          session.user.isAdmin = !!dbUser?.isAdmin
        } catch (error) {
          console.error("[Auth Error][SESSION_ERROR]", "Error fetching isAdmin status:", error)
          session.user.isAdmin = false
        }
      }
      return session
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.sub = user.id
      }
      return token
    },
    async redirect({ url, baseUrl }) {
      // Always redirect to the kingdom page after successful sign in
      if (url.includes('/api/auth/callback')) {
        return `${baseUrl}/kingdom`
      }
      // Handle relative URLs
      if (url.startsWith("/")) {
        return `${baseUrl}${url}`
      }
      // Handle absolute URLs on same domain
      else if (new URL(url).origin === baseUrl) {
        return url
      }
      return baseUrl
    }
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60 // 30 days
  },
  useSecureCookies: process.env.NODE_ENV === "production",
  cookies: {
    sessionToken: {
      name: "next-auth.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production"
      }
    },
    callbackUrl: {
      name: "next-auth.callback-url",
      options: {
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production"
      }
    },
    csrfToken: {
      name: "next-auth.csrf-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production"
      }
    }
  }
}

// Export auth helper for server-side auth
export const auth = async () => await getServerSession(authOptions)
