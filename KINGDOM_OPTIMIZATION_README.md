# Kingdom Stats and Gains Optimization

## Overview
This optimization creates a comprehensive and performant database structure for tracking kingdom statistics, gains, and achievements. The new structure replaces the previous scattered approach with a unified, indexed system.

## 🚀 Key Improvements

### 1. **Unified Data Structure**
- **`kingdom_stats`**: Central table for all kingdom metrics
- **`kingdom_gains`**: Comprehensive tracking of all gains and rewards
- **`kingdom_daily_stats`**: Daily aggregated statistics for performance
- **`kingdom_achievements`**: Achievement system with rewards tracking

### 2. **Performance Optimizations**
- **Strategic Indexing**: 15+ indexes for common query patterns
- **Composite Indexes**: Multi-column indexes for complex queries
- **Materialized Views**: Pre-computed summaries for fast access
- **Partitioning Ready**: Structure supports future table partitioning

### 3. **Data Integrity**
- **Check Constraints**: Validates data ranges (e.g., happiness 0-100)
- **Foreign Key Relationships**: Proper referential integrity
- **Unique Constraints**: Prevents duplicate data
- **Default Values**: Sensible defaults for all fields

### 4. **Scalability Features**
- **Row Level Security**: User data isolation
- **Automatic Triggers**: Real-time data updates
- **Batch Processing**: Efficient bulk operations
- **Caching Strategy**: Materialized views for expensive queries

## 📊 Table Structure

### Kingdom Stats Table
```sql
kingdom_stats (
    -- Core metrics: population, happiness, prestige, influence
    -- Resources: gold, experience, level, build_tokens
    -- Building counts: houses, farms, markets, mines, etc.
    -- Military counts: soldiers, archers, cavalry, siege
    -- Timestamps and constraints
)
```

### Kingdom Gains Table
```sql
kingdom_gains (
    -- Gain types: quest, challenge, milestone, building, etc.
    -- Quantities: gold, experience, population, happiness, etc.
    -- Metadata: category, rarity, multiplier, description
    -- Timestamps and source tracking
)
```

### Daily Stats Table
```sql
kingdom_daily_stats (
    -- Daily totals for all gain types
    -- Daily counts for activities
    -- Daily averages for key metrics
    -- Date-based partitioning ready
)
```

### Achievements Table
```sql
kingdom_achievements (
    -- Achievement details and categories
    -- Reward tracking for all resource types
    -- Progress tracking and unlock conditions
    -- Rarity and difficulty classification
)
```

## 🔧 Performance Features

### Indexes
- **Single Column**: `user_id`, `gain_type`, `category`, `rarity`
- **Composite**: `(user_id, gain_type, date)`, `(user_id, category, date)`
- **Specialized**: Date ranges, achievement status, difficulty levels

### Materialized Views
- **`kingdom_summary`**: Pre-computed user summaries
- **Auto-refresh**: Functions to update views efficiently
- **Concurrent Updates**: Non-blocking view refreshes

### Triggers
- **Automatic Daily Stats**: Updates daily aggregations
- **Real-time Sync**: Keeps related tables in sync
- **Performance Optimized**: Minimal overhead

## 🛡️ Security Features

### Row Level Security (RLS)
- **User Isolation**: Users can only access their own data
- **Policy-based Access**: Granular control over operations
- **JWT Integration**: Secure user identification

### Data Validation
- **Input Sanitization**: Prevents invalid data insertion
- **Range Checks**: Ensures values are within valid bounds
- **Type Safety**: Strong typing for all fields

## 📈 Query Performance

### Fast Queries
```sql
-- User's weekly gains (uses composite index)
SELECT * FROM kingdom_gains 
WHERE user_id = 'user123' 
  AND gained_at >= CURRENT_DATE - INTERVAL '7 days'
  AND gain_type = 'quest';

-- Daily statistics (uses date index)
SELECT * FROM kingdom_daily_stats 
WHERE user_id = 'user123' 
  AND stat_date >= CURRENT_DATE - INTERVAL '30 days';

-- Achievement summary (uses materialized view)
SELECT * FROM kingdom_summary WHERE user_id = 'user123';
```

### Aggregation Performance
- **Pre-computed Daily Stats**: No runtime aggregation needed
- **Materialized Summary**: Instant access to user overview
- **Indexed Lookups**: Fast filtering and sorting

## 🔄 Data Flow

### 1. **Gain Recording**
```
User Action → kingdom_gains → Trigger → kingdom_daily_stats
```

### 2. **Daily Aggregation**
```
kingdom_gains → update_kingdom_daily_stats() → kingdom_daily_stats
```

### 3. **Summary Updates**
```
kingdom_stats + kingdom_gains + kingdom_achievements → kingdom_summary
```

## 🚀 Usage Examples

### Inserting Gains
```sql
INSERT INTO kingdom_gains (
    user_id, gain_type, source_name, 
    gold_gained, experience_gained, category, rarity
) VALUES (
    'user123', 'quest', 'Daily Quest', 
    50, 25, 'daily', 'common'
);
```

### Updating Stats
```sql
UPDATE kingdom_stats 
SET gold = gold + 50, 
    experience = experience + 25,
    updated_at = NOW()
WHERE user_id = 'user123';
```

### Querying Performance
```sql
-- Get user's weekly performance
SELECT 
    stat_date,
    daily_gold_gained,
    daily_experience_gained,
    daily_quests_completed
FROM kingdom_daily_stats 
WHERE user_id = 'user123' 
  AND stat_date >= CURRENT_DATE - INTERVAL '7 days'
ORDER BY stat_date DESC;
```

## 📋 Migration Steps

### 1. **Backup Current Data**
```sql
-- Export existing data if needed
```

### 2. **Run Optimization Script**
```sql
-- Execute optimize-kingdom-stats.sql
```

### 3. **Verify Tables**
```sql
-- Check table creation and indexes
SELECT table_name FROM information_schema.tables 
WHERE table_name LIKE 'kingdom_%';
```

### 4. **Test Performance**
```sql
-- Run sample queries to verify performance
EXPLAIN ANALYZE SELECT * FROM kingdom_summary WHERE user_id = 'test';
```

## 🔍 Monitoring and Maintenance

### Performance Monitoring
- **Query Execution Times**: Monitor slow queries
- **Index Usage**: Ensure indexes are being used
- **Table Sizes**: Track growth and plan partitioning

### Maintenance Tasks
- **Daily**: Auto-update daily statistics
- **Weekly**: Refresh materialized views
- **Monthly**: Analyze table performance and growth

### Optimization Opportunities
- **Table Partitioning**: For very large datasets
- **Additional Indexes**: Based on query patterns
- **Caching Layers**: Application-level caching

## 📚 Related Documentation

- **Database Schema**: See `docs/existing-database-schema.md`
- **API Routes**: See `app/api/kingdom-stats/route.ts`
- **Type Definitions**: See `types/kingdom-stats.ts`
- **Migration Scripts**: See `supabase/migrations/`

## 🎯 Next Steps

1. **Deploy to Production**: Run optimization script
2. **Update Application Code**: Use new table structure
3. **Performance Testing**: Verify query performance improvements
4. **Monitor Usage**: Track real-world performance metrics
5. **Iterate**: Apply lessons learned to other tables

---

**Created**: 2025-01-25  
**Version**: 1.0.0  
**Status**: Ready for Production
