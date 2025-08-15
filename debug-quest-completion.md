# Debug Quest Completion Data

## Step 1: Check what's in your quest_completion table
Run this in Supabase SQL Editor:

```sql
-- Check table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'quest_completion' 
ORDER BY ordinal_position;

-- Check if there's any data
SELECT COUNT(*) as total_records FROM quest_completion;

-- Check sample data
SELECT * FROM quest_completion LIMIT 5;

-- Check if there are any completed quests
SELECT * FROM quest_completion WHERE completed = true LIMIT 10;

-- Check user IDs in the system
SELECT DISTINCT user_id FROM quest_completion LIMIT 10;
```

## Step 2: Check your actual Clerk user ID
In your browser console, run:
```javascript
// This should show your Clerk user ID
console.log('Clerk user ID:', window.Clerk?.user?.id);
```

## Step 3: Check if quest completions are being created
1. Complete a quest in your app
2. Immediately run this query:
```sql
SELECT * FROM quest_completion ORDER BY created_at DESC LIMIT 5;
```

## Step 4: Check the API logs
Look at your server logs for the debugging output I added to see what data the API is finding.

## Expected Results:
- quest_completion table should have records
- user_id should match your Clerk user ID
- completed should be true for completed quests
- completed_at should have recent timestamps

## Common Issues:
1. **User ID mismatch**: Clerk user ID vs Supabase user ID format
2. **RLS policies**: Row Level Security blocking access
3. **Data not being inserted**: Quest completion not saving to database
4. **Field name mismatch**: API looking for wrong column names
