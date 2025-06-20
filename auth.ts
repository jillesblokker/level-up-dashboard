// auth.ts
import NextAuth from 'next-auth'
import GitHub from 'next-auth/providers/github'
import { serverEnv } from './lib/server-env'

export const {
  handlers: { GET, POST },
  auth,
} = NextAuth({
  providers: [
    GitHub({
      clientId: serverEnv.GITHUB_ID,
      clientSecret: serverEnv.GITHUB_SECRET,
    }),
  ],
})