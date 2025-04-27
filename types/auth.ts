import { DefaultSession, DefaultUser } from "next-auth"

declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string
      isAdmin: boolean
    } & DefaultSession["user"]
  }

  interface User extends DefaultUser {
    id: string
    isAdmin: boolean
  }
} 