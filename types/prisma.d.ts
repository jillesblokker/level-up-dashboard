import { PrismaClient } from '@prisma/client'

declare global {
  namespace PrismaClient {
    interface RealmMap {
      id: string
      userId: string
      grid: string
      lastSynced: Date
      createdAt: Date
      updatedAt: Date
    }
  }
}

export {}; 