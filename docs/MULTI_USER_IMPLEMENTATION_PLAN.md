# Multi-User Quest/Challenge/Milestone Support Implementation

## Problem
Currently, all users see the same quests, challenges, and milestones because these are stored in global tables without user_id filtering. When you create custom content, new users also see it.

## Solution Overview
Add `user_id` columns to the `quests`, `challenges`, and `milestones` tables, then update the API to filter by user.

## Implementation Steps

### 1. Database Migration (SQL)
Run these scripts in your Supabase SQL Editor **in this order**:

#### Step 1a: Add user_id columns and update RLS policies
File: `migrations/add-user-id-to-content-tables.sql`

This will:
- Add `user_id TEXT` column to `quests`, `challenges`, and `milestones` tables
- Create indexes for performance
- Update RLS policies to filter by user
- Existing data will have `user_id = NULL` (unassigned)

#### Step 1b: Assign your existing content to your user ID
File: `migrations/assign-content-to-user.sql`

This will:
- Help you find your Clerk user ID
- Assign all existing quests/challenges/milestones to YOUR user ID
- Verify the assignment worked

**IMPORTANT**: You need to replace `'YOUR_CLERK_USER_ID_HERE'` in the script with your actual Clerk user ID.

To find your user ID:
1. Log into your app
2. Open browser console
3. Run: `console.log(window.Clerk?.user?.id)`
4. Copy the ID (starts with `user_`)

### 2. API Code Updates
Update the following API routes to filter by `user_id`:

#### `/app/api/quests/route.ts` (GET method, line 126)
**Change from:**
```typescript
const { data: quests, error: questsError } = await supabase
  .from('quests')
  .select('*');
```

**Change to:**
```typescript
const { data: quests, error: questsError } = await supabase
  .from('quests')
  .select('*')
  .or(`user_id.is.null,user_id.eq.${userId}`);
```

This will return:
- Quests with `user_id = NULL` (global/default quests)
- Quests with `user_id = YOUR_ID` (your personal quests)

#### Similar changes needed for:
- `/app/api/challenges-ultra-simple/route.ts` (challenges endpoint)
- `/app/api/milestones/route.ts` (milestones endpoint, if it exists)

#### When creating new content:
Update POST/PUT operations to automatically set `user_id`:

```typescript
const { data, error } = await supabase
  .from('quests')
  .insert({
    ...questData,
    user_id: userId  // <-- Add this
  });
```

### 3. Testing Plan
After applying the changes:

1. **Test with your account (jillesblokker@gmail.com)**:
   - Log in
   - Verify you see ALL your existing quests/challenges/milestones
   - Create a new quest
   - Verify it has your `user_id` in the database

2. **Test with a new account**:
   - Create a test account
   - Log in
   - Verify you see ONLY:
     - Global content (`user_id = NULL`), if any
     - Content created by this test user
   - Verify you DON'T see your personal quests

3. **Database verification**:
   ```sql
   -- Check quest distribution
   SELECT user_id, COUNT(*) as count FROM quests GROUP BY user_id;
   
   -- Should show:
   -- user_YOUR_ID | <number of your quests>
   -- (potentially NULL | <number of global quests>)
   ```

## Expected Behavior After Implementation

- **Your account**: Sees all your existing + newly created content
- **New users**: Start with empty lists (or global defaults if you create any with `user_id = NULL`)
- **Security**: Users can only see their own content + global content
-  **Backward compatibility**: Existing completion data (`quest_completion`, `challenge_completion`) is already user-scoped, so it won't be affected

## Rollback Plan
If something goes wrong:

```sql
-- Remove user_id filtering (rollback to global mode)
ALTER TABLE quests DROP COLUMN IF EXISTS user_id;
ALTER TABLE challenges DROP COLUMN IF EXISTS user_id;
ALTER TABLE milestones DROP COLUMN IF EXISTS user_id;

-- Restore old RLS policies (from create-missing-tables.sql)
```

## Next Steps
1. Review this plan
2. Find your Clerk user ID
3. Run the SQL migrations (Step 1a, then 1b with your ID)
4. Update the API code (Step 2)
5. Test thoroughly (Step 3)
