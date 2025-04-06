import { PrismaClient } from '@prisma/client'
import { PrismaSqliteAdapter } from '@prisma/adapter-sqlite'
import { createClient } from '@libsql/client'

declare global {
  var prisma: PrismaClient | undefined
}

const libsql = createClient({
  url: `file:${process.cwd()}/prisma/dev.db`,
})

export const prisma = globalThis.prisma || new PrismaClient({
  adapter: new PrismaSqliteAdapter({ client: libsql }),
})

if (process.env.NODE_ENV !== 'production') globalThis.prisma = prisma 