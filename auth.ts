import NextAuth from "next-auth"
import GitHub from "next-auth/providers/github"
import prisma from "@/lib/prisma"

export const config = {
  providers: [
    GitHub({
      clientId: process.env['GITHUB_ID']!,
      clientSecret: process.env['GITHUB_SECRET']!,
    }),
  ],
  callbacks: {
    session: ({ session, user }: { session: any; user: any }) => ({
      ...session,
      user: {
        ...session.user,
        id: user.id,
      },
    }),
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
}

export const { handlers, auth, signIn, signOut } = NextAuth(config) 