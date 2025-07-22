# Supabase AI Prompt: Quest Favorites System

## Context
I'm building a gamified quest system where users can favorite quests and have them persist across sessions. The system uses Clerk for authentication and needs to save quest favorites to Supabase.

## Current Setup
- **Authentication**: Clerk (user IDs are TEXT strings, not UUIDs)
- **Database**: Supabase with Row Level Security (RLS) enabled
- **Frontend**: Next.js with TypeScript
- **API**: REST endpoints for quest management

## Requirements

### 1. Database Schema
I need a `quest_favorites` table with the following structure:
```sql
CREATE TABLE quest_favorites (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL,
    quest_id TEXT NOT NULL,
    favorited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, quest_id)
);
```

### 2. Row Level Security (RLS)
- Enable RLS on the `quest_favorites` table
- Users can only see and modify their own favorites
- Policy: `user_id = auth.uid()`

### 3. API Endpoints
I need three endpoints:

#### GET /api/quests/favorites
- Fetch all favorited quest IDs for the authenticated user
- Return: `{ favorites: string[] }`

#### POST /api/quests/favorites
- Add a quest to favorites
- Body: `{ questId: string }`
- Return: `{ success: true, data: {...} }`

#### DELETE /api/quests/favorites
- Remove a quest from favorites
- Body: `{ questId: string }`
- Return: `{ success: true }`

### 4. Frontend Integration
The frontend needs to:
- Load favorites when the quests page loads
- Toggle favorites with immediate feedback
- Show visual indicators for favorited quests
- Handle errors gracefully with toast notifications

### 5. Error Handling
- Handle duplicate favorites (unique constraint)
- Handle authentication errors
- Handle network errors
- Provide user-friendly error messages

## Questions for Supabase AI

1. **Database Design**: Is the `quest_favorites` table structure optimal for this use case? Should I add any additional indexes or constraints?

2. **RLS Policies**: Are the RLS policies sufficient for security? Should I add any additional policies for different operations (INSERT, UPDATE, DELETE)?

3. **Performance**: How can I optimize queries for users with many favorited quests? Should I implement pagination?

4. **Real-time Updates**: Should I implement real-time subscriptions for favorites so they sync across multiple browser tabs?

5. **Data Consistency**: How can I ensure data consistency if a user favorites a quest that gets deleted? Should I implement foreign key constraints?

6. **Caching**: What's the best approach for caching favorites to reduce database queries?

7. **Analytics**: Should I track when users favorite/unfavorite quests for analytics purposes?

8. **Bulk Operations**: Should I support bulk operations (favorite/unfavorite multiple quests at once)?

## Current Implementation Issues

1. **Type Safety**: The frontend uses TypeScript - how can I ensure type safety between the API and frontend?

2. **Error Recovery**: If the API call fails, how should the frontend handle the UI state?

3. **Offline Support**: Should I implement offline support for favorites using localStorage as a fallback?

4. **Rate Limiting**: Should I implement rate limiting for favorite/unfavorite operations?

## Testing Considerations

1. **Unit Tests**: What should I test for the favorites functionality?
2. **Integration Tests**: How should I test the API endpoints?
3. **E2E Tests**: What user flows should I test for favorites?

## Security Considerations

1. **Input Validation**: What validation should I implement for quest IDs?
2. **Authorization**: How can I ensure users can only favorite quests they have access to?
3. **SQL Injection**: Are the current queries safe from SQL injection?

## Performance Considerations

1. **Query Optimization**: How can I optimize the queries for better performance?
2. **Indexing**: What indexes should I add for optimal performance?
3. **Connection Pooling**: Should I implement connection pooling for the database?

## Monitoring and Logging

1. **Error Tracking**: How should I track and monitor errors in the favorites system?
2. **Usage Analytics**: What metrics should I track for the favorites feature?
3. **Performance Monitoring**: How should I monitor the performance of favorites operations?

## Future Enhancements

1. **Favorite Categories**: Should I support organizing favorites into categories?
2. **Favorite Notes**: Should users be able to add notes to their favorites?
3. **Favorite Sharing**: Should users be able to share their favorite quests?
4. **Favorite Recommendations**: Should I implement a recommendation system based on favorites?

## Code Examples Needed

1. **API Implementation**: Complete implementation of the three API endpoints
2. **Frontend Integration**: How to integrate favorites into the existing quests page
3. **Error Handling**: Best practices for error handling in both frontend and backend
4. **TypeScript Types**: Type definitions for the favorites system
5. **Testing Examples**: Example tests for the favorites functionality

## Integration with Existing System

The favorites system needs to integrate with:
- Existing quest completion system
- User authentication (Clerk)
- Existing toast notification system
- Existing error handling patterns
- Existing loading states and UI patterns

Please provide guidance on all these aspects and help me implement a robust, secure, and performant quest favorites system. 