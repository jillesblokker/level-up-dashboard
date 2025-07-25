import { Webhook } from 'svix'
import { headers } from 'next/headers'
import { WebhookEvent } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client';
// TODO: Implement Clerk webhook logic with Supabase client

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env['CLERK_WEBHOOK_SECRET']

  if (!WEBHOOK_SECRET) {
    throw new Error('Please add CLERK_WEBHOOK_SECRET from Clerk Dashboard to .env or .env.local')
  }

  const headerPayload = await headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Error occured -- no svix headers', {
      status: 400
    })
  }

  const payload = await req.json()
  const body = JSON.stringify(payload);

  const wh = new Webhook(WEBHOOK_SECRET);
  let evt: WebhookEvent

  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent
  } catch (err) {
    console.error('Error verifying webhook:', err);
    return new Response('Error occured', {
      status: 400
    })
  }

  const eventType = evt.type;

  if (eventType === 'user.created') {
    const { id, email_addresses } = evt.data;
    const email = email_addresses[0]?.email_address;

    try {
      // Insert user into Supabase 'users' table
      const { error } = await supabase
        .from('users')
        .insert([{ id, email }]);
      if (error) {
        console.error('Error inserting user into Supabase:', error);
        return NextResponse.json({ message: 'Error creating user in database', details: error.message }, { status: 500 });
      }
      return NextResponse.json({ message: 'User and default quests created' }, { status: 201 });
    } catch (error) {
        console.error('Error creating user or quests in database:', error);
        return NextResponse.json({ message: 'Error creating user or quests' }, { status: 500 });
    }
  }

  return new Response('', { status: 200 })
}
