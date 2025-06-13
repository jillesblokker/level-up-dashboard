import { z } from "zod"

const envSchema = z.object({
  GITHUB_CLIENT_ID: z.string(),
  GITHUB_CLIENT_SECRET: z.string(),
  GITHUB_CALLBACK_URL: z.string().url(),
  NEXTAUTH_URL: z.string().url(),
  NEXTAUTH_SECRET: z.string(),
  DATABASE_URL: z.string(),
})

export const env = {
  GITHUB_CLIENT_ID: process.env['GITHUB_ID'],
  GITHUB_CLIENT_SECRET: process.env['GITHUB_SECRET'],
  GITHUB_CALLBACK_URL: process.env['GITHUB_CALLBACK_URL'],
  DATABASE_URL: process.env['DATABASE_URL'],
} as const; 