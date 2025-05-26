import { NextResponse } from 'next/server'

export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      env: {
        NEXTAUTH_URL: process.env['NEXTAUTH_URL'],
        NEXTAUTH_SECRET: process.env['NEXTAUTH_SECRET'] ? "Exists" : "Missing",
        GITHUB_ID: process.env['GITHUB_ID'] ? "Exists" : "Missing",
        GITHUB_SECRET: process.env['GITHUB_SECRET'] ? "Exists" : "Missing",
        DATABASE_URL: process.env['DATABASE_URL'] ? "Exists" : "Missing",
        DIRECT_URL: process.env['DIRECT_URL'] ? "Exists" : "Missing",
        PORT: process.env['PORT'],
        NODE_ENV: process.env['NODE_ENV'],
      },
    }, { status: 200 })
  } catch (error) {
    console.error('Debug route error:', error)
    return NextResponse.json({
      success: false,
      error: String(error),
    }, { status: 500 })
  }
} 