import { PrismaClient } from '@prisma/client'

let prisma: PrismaClient | undefined

export default function getPrismaClient() {
  if (!prisma) {
    prisma = new PrismaClient()
  }
  return prisma
}
