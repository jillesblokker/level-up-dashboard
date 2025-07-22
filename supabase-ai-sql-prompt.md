# Supabase AI SQL Generation Prompt: Quest Favorites System

## Task
Create a complete SQL script to set up a quest favorites system in Supabase for a gamified quest application.

## Requirements

### Database Table
Create a `quest_favorites` table with these specifications:
- **Primary key**: UUID with auto-generation
- **user_id**: TEXT (for Clerk authentication)
- **quest_id**: TEXT (quest identifier)
- **favorited_at**: Timestamp when favorited
- **created_at/updated_at**: Standard timestamp fields
- **Unique constraint**: Prevent duplicate favorites per user

### Security
- Enable Row Level Security (RLS)
- Create policy: users can only access their own favorites
- Use `auth.uid()` for user identification

### Performance
- Add appropriate indexes for user_id and quest_id
- Optimize for queries by user_id

### Integration
- This table should work with existing tables in the schema
- Use TEXT for user_id to match Clerk authentication
- Follow Supabase best practices

## Expected Output
Provide a complete SQL script that:
1. Creates the quest_favorites table
2. Enables RLS
3. Creates the security policy
4. Adds performance indexes
5. Grants necessary permissions

## Context
- Using Clerk for authentication (user IDs are TEXT strings)
- Next.js frontend with TypeScript
- REST API endpoints for quest management
- Existing quest system already in place

## Example Usage
The table will be used by these API operations:
- GET: Fetch all favorited quest IDs for a user
- POST: Add a quest to favorites
- DELETE: Remove a quest from favorites

Please generate the complete SQL script with proper error handling and security measures. 