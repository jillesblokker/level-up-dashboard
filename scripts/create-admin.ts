import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const email = process.env.ADMIN_EMAIL
  const password = process.env.ADMIN_PASSWORD

  if (!email || !password) {
    console.error('Please provide ADMIN_EMAIL and ADMIN_PASSWORD environment variables')
    process.exit(1)
  }

  const hashedPassword = await bcrypt.hash(password, 10)

  try {
    const user = await prisma.user.upsert({
      where: { email },
      update: {
        password: hashedPassword,
        isAdmin: true,
      },
      create: {
        email,
        password: hashedPassword,
        isAdmin: true,
        name: 'Admin',
      },
    })

    console.log(`Admin user created/updated: ${user.email}`)
  } catch (error) {
    console.error('Error creating admin user:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main() 