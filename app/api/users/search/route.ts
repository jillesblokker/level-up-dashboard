import { NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';

export async function GET(request: Request) {
    const { userId } = await auth();
    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query');

    if (!query || query.length < 3) {
        return NextResponse.json({ users: [] });
    }

    try {
        const clerk = await clerkClient();
        // Search for users matching the query
        const users = await clerk.users.getUserList({
            query,
            limit: 10,
        });

        // Map to safe public data
        const safeUsers = users.data
            .filter(user => user.id !== userId) // Exclude self
            .map(user => ({
                id: user.id,
                username: user.username || user.firstName || user.emailAddresses[0]?.emailAddress?.split('@')[0] || 'Unknown',
                imageUrl: user.imageUrl,
            }));

        return NextResponse.json({ users: safeUsers });
    } catch (error) {
        console.error('Error searching users:', error);
        return NextResponse.json({ error: 'Failed to search users' }, { status: 500 });
    }
}
