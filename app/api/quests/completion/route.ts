import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import getPrismaClient from '@/lib/prisma';
import { env } from '@/lib/env';

// Create a new quest completion
export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
        env.NEXT_PUBLIC_SUPABASE_URL,
        env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
        },
      }
    );
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    const { category, questName } = data;

    const prisma = getPrismaClient();

    const questCompletion = await prisma.questCompletion.create({
      data: {
        userId: session.user.id,
        category,
        questName,
        date: new Date()
      }
    });

    return NextResponse.json(questCompletion);
  } catch (error) {
    console.error('Error creating quest completion:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Get quest completions for the current user
export async function GET() {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
        env.NEXT_PUBLIC_SUPABASE_URL,
        env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
        },
      }
    );
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const prisma = getPrismaClient();

    const questCompletions = await prisma.questCompletion.findMany({
      where: {
        userId: session.user.id
      },
      orderBy: {
        date: 'desc'
      }
    });

    return NextResponse.json(questCompletions);
  } catch (error) {
    console.error('Error fetching quest completions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 