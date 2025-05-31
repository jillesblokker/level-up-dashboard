# Database Schema Documentation

## Overview
This document outlines the database schema, security policies, and best practices for our Supabase application.

## Tables

### users
Primary table for user management and Clerk-Supabase mapping.

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clerk_id TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Indexes:**
- `clerk_id_idx` (UNIQUE) on `clerk_id`
- `email_idx` (UNIQUE) on `email`

**RLS Policies:**
```sql
-- Users can only read their own data
CREATE POLICY "Users can view own data"
  ON users FOR SELECT
  USING (clerk_id = auth.jwt()->>'sub');

-- Users can only update their own data
CREATE POLICY "Users can update own data"
  ON users FOR UPDATE
  USING (clerk_id = auth.jwt()->>'sub');
```

### QuestCompletionLog
Tracks user quest completions.

```sql
CREATE TABLE "QuestCompletionLog" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  quest_id TEXT NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB
);
```

**Indexes:**
- `user_id_idx` on `user_id`
- `quest_id_idx` on `quest_id`

**RLS Policies:**
```sql
-- Users can only view their own quest logs
CREATE POLICY "Users can view own quest logs"
  ON "QuestCompletionLog" FOR SELECT
  USING (user_id IN (
    SELECT id FROM users WHERE clerk_id = auth.jwt()->>'sub'
  ));

-- Users can only insert their own quest logs
CREATE POLICY "Users can insert own quest logs"
  ON "QuestCompletionLog" FOR INSERT
  WITH CHECK (user_id IN (
    SELECT id FROM users WHERE clerk_id = auth.jwt()->>'sub'
  ));
```

### realm_grids
Stores user realm grid data.

```sql
CREATE TABLE realm_grids (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  grid JSONB NOT NULL,
  version INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Indexes:**
- `user_id_idx` on `user_id`
- `version_idx` on `version`

**RLS Policies:**
```sql
-- Users can only view their own grids
CREATE POLICY "Users can view own grids"
  ON realm_grids FOR SELECT
  USING (user_id IN (
    SELECT id FROM users WHERE clerk_id = auth.jwt()->>'sub'
  ));

-- Users can only update their own grids
CREATE POLICY "Users can update own grids"
  ON realm_grids FOR UPDATE
  USING (user_id IN (
    SELECT id FROM users WHERE clerk_id = auth.jwt()->>'sub'
  ));
```

## Security Best Practices

1. **Row Level Security (RLS)**
   - All tables have RLS enabled
   - Policies use Clerk JWT subject for authentication
   - Policies are tested regularly

2. **Indexing Strategy**
   - Indexes on all foreign keys
   - Indexes on frequently queried columns
   - Regular index maintenance

3. **Data Validation**
   - Input validation at application level
   - Type checking in database
   - JSON schema validation for JSONB columns

4. **Monitoring**
   - Performance metrics tracking
   - Security event logging
   - Regular policy violation checks

## Performance Optimization

1. **Query Optimization**
   - Use appropriate indexes
   - Implement pagination for large result sets
   - Cache frequently accessed data

2. **Connection Management**
   - Use connection pooling
   - Implement proper error handling
   - Monitor connection usage

3. **Data Access Patterns**
   - Batch operations when possible
   - Use transactions for related operations
   - Implement proper error handling

## Maintenance Procedures

1. **Regular Tasks**
   - Monitor index usage
   - Check for policy violations
   - Review performance metrics
   - Update security policies

2. **Backup Strategy**
   - Daily automated backups
   - Point-in-time recovery
   - Regular backup testing

3. **Monitoring**
   - Track query performance
   - Monitor security events
   - Alert on policy violations

## API Documentation

### Quest Completion Log

```typescript
interface QuestCompletionLog {
  id: string;
  userId: string;
  questId: string;
  completedAt: Date;
  metadata?: Record<string, any>;
}
```

### Realm Grid

```typescript
interface RealmGrid {
  id: string;
  userId: string;
  grid: number[][];
  version: number;
  createdAt: Date;
  updatedAt: Date;
}
```

## Error Handling

1. **Database Errors**
   - Log all database errors
   - Implement proper error recovery
   - User-friendly error messages

2. **Policy Violations**
   - Log all policy violations
   - Alert on suspicious activity
   - Regular policy review

## Testing

1. **Unit Tests**
   - Test all RLS policies
   - Verify data access patterns
   - Check error handling

2. **Integration Tests**
   - Test complete workflows
   - Verify security measures
   - Check performance

## Deployment

1. **Migration Strategy**
   - Use versioned migrations
   - Test migrations thoroughly
   - Implement rollback procedures

2. **Monitoring**
   - Track deployment metrics
   - Monitor for errors
   - Alert on issues 