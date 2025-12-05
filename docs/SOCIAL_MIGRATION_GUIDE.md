# Social Features Migration Guide

## Problem
You're getting 500 errors when trying to use the Allies page because the required database tables don't exist yet.

## Solution
Run the social features migration in your Supabase database.

## Steps to Fix

### Option 1: Using Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard: https://supabase.com/dashboard
2. Navigate to **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy the entire contents of `migrations/add-social-features.sql`
5. Paste it into the SQL editor
6. Click **Run** or press `Cmd/Ctrl + Enter`
7. Verify the tables were created by going to **Table Editor**

### Option 2: Using psql Command Line

```bash
# Replace with your Supabase connection details
psql "postgresql://postgres:[YOUR-PASSWORD]@[YOUR-PROJECT-REF].supabase.co:5432/postgres" \
  -f migrations/add-social-features.sql
```

### Option 3: Using the Migration Script (Node.js)

If you have your `DATABASE_URL` in `.env.local`, you can run:

```bash
node scripts/migrate-social.js
```

## What This Migration Creates

1. **`friends` table** - Stores friend relationships
2. **`notifications` table** - Stores user notifications
3. **Columns added to `quests` table**:
   - `is_friend_quest` - Boolean flag
   - `sender_id` - User who sent the quest
   - `recipient_id` - User who received the quest
4. **Indexes** for better query performance
5. **Row Level Security (RLS) policies** for data protection

## Verification

After running the migration, check the browser console. The errors should be gone and you should see:
- Successful API calls to `/api/friends`
- Ability to search for users
- Ability to send friend requests

## Troubleshooting

If you still see errors after running the migration:

1. Check the browser console for the specific error message (it will now show more details)
2. Verify the tables exist in Supabase Table Editor
3. Check that RLS is enabled on the tables
4. Ensure your Supabase service role key is set in `.env.local`

## Need Help?

The error details are now logged in the browser console. Look for:
- `error.message` - What went wrong
- `error.code` - PostgreSQL error code
- `error.hint` - Suggestion for fixing it
