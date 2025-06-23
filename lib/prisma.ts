import { PrismaClient } from '@prisma/client'

// PrismaClient is attached to the `global` object in development to prevent
// exhausting your database connection limit.
//
// Learn more: https://pris.ly/d/help/next-js-best-practices

const globalForPrisma = globalThis as unknown as { _prisma?: PrismaClient }

const prisma =
  globalForPrisma._prisma ||
  new PrismaClient({
    log: ['query'],
  })

if (process.env['NODE_ENV'] !== 'production') globalForPrisma._prisma = prisma

export default prisma
