import { prisma } from '../lib/prisma'

async function main() {
  const email = process.env['ADMIN_EMAIL']

  if (!email) {
    console.error('Please provide ADMIN_EMAIL environment variable')
    process.exit(1)
  }

  try {
    const updatedUser = await prisma.user.update({
      where: { email: email },
      data: {
        isAdmin: true,
      },
    })
    console.log(`User ${updatedUser.email} has been granted admin privileges.`)
  } catch (error: any) {
    if (error.code === 'P2025') {
      console.error(`Error: User with email "${email}" not found. Please ensure the user exists before running this script.`);
    } else {
      console.error('Error updating admin user:', error)
    }
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()