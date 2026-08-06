import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    return NextResponse.json({ success: true, logged: true });
  } catch (error) {
    return NextResponse.json({ success: true, logged: false });
  }
}