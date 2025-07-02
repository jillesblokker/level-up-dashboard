import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { writeFile, mkdir } from "fs/promises"
import { join } from "path"
import { v4 as uuidv4 } from "uuid"
// TODO: Replace Prisma logic with Supabase client logic

export async function POST(req: Request) {
  try {
    // Check authentication
    const session = await getServerSession()
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    // Get the form data
    const formData = await req.formData()
    const file = formData.get("file") as File
    if (!file) {
      return new NextResponse("No file uploaded", { status: 400 })
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      return new NextResponse("File must be an image", { status: 400 })
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      return new NextResponse("File size must be less than 5MB", { status: 400 })
    }

    // Create unique filename
    const ext = file.name.split(".").pop()
    const filename = `${uuidv4()}.${ext}`

    // Create uploads directory if it doesn't exist
    const uploadDir = join(process.cwd(), "public", "uploads")
    try {
      await mkdir(uploadDir, { recursive: true })
    } catch (error) {
      // Ignore error if directory already exists
    }

    // Save the file
    const bytes = await file.arrayBuffer()
    const buffer = new Uint8Array(bytes)
    await writeFile(join(uploadDir, filename), buffer)

    // Update user's avatar in database
    const imageUrl = `/uploads/${filename}`
    // TODO: Replace Prisma logic with Supabase client logic

    return NextResponse.json({ url: imageUrl })
  } catch (error) {
    console.error("Error handling avatar upload:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
} 