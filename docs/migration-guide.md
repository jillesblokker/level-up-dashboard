# Data Migration Guide: localStorage to Supabase

This guide covers the migration of user data from localStorage to Supabase, following Clerk's free plan limitations and best practices.

## Overview

The migration process moves user data from browser localStorage to Supabase database tables, ensuring:
- Cross-device synchronization
- Data persistence and backup
- Better security with Row Level Security (RLS)
- Improved performance and scalability

## Migration Checklist Compliance

### ✅ Primary Keys
- Using `bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY` for all tables
- Avoiding UUID primary keys unless specifically needed

### ✅ Foreign Keys
- Using `text` for `user_id` columns (Clerk compatibility)
- Creating indexes on foreign key columns for performance
- Matching data types consistently

### ✅ Row Level Security (RLS)
- All tables have RLS enabled
- Policies for SELECT, INSERT, UPDATE, DELETE operations
- Proper user isolation with `auth.uid()::text = user_id`

### ✅ Data Types
- Using `text` for strings (Clerk compatibility)
- Using `timestamp with time zone` for dates/times
- Using `jsonb` for complex data structures

## Tables Created/Updated

### 1. Realm Grids (`realm_grids`)
```sql
- Stores user's grid/map data
- Supports versioning with `is_current` flag
- Includes character position and discovered tiles
```

### 2. Character Positions (`character_positions`)
```sql
- Stores character location coordinates
- Tracks last movement timestamp
```

### 3. Tile Inventory (`tile_inventory`)
```sql
- Stores user's tile collection
- Includes quantity, cost, connections, rotation
```

### 4. User Preferences (`user_preferences`)
```sql
- Stores user settings and preferences
- Key-value structure for flexibility
```

### 5. Image Descriptions (`image_descriptions`)
```sql
- Stores user-generated image descriptions
- Links images to descriptions
```

### 6. Game Settings (`game_settings`)
```sql
- Stores game configuration and state
- Key-value structure for various settings
```

## Migration Process

### Phase 1: Database Setup
1. Run the migration SQL file:
   ```bash
   # Apply the migration
   supabase db push
   ```

2. Verify tables are created:
   ```sql
   -- Check tables exist
   SELECT table_name FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name IN ('realm_grids', 'character_positions', 'tile_inventory', 'user_preferences', 'image_descriptions', 'game_settings');
   ```

### Phase 2: Client-Side Migration
1. **Automatic Detection**: The app automatically detects localStorage data
2. **Migration Prompt**: Users see a migration modal if local data exists
3. **Data Collection**: All relevant localStorage data is collected
4. **Supabase Upload**: Data is uploaded to appropriate tables
5. **Verification**: Migration success is confirmed
6. **Cleanup**: localStorage data is cleared (optional)

### Phase 3: Data Loading
1. **Supabase First**: Try to load from Supabase
2. **localStorage Fallback**: Fallback to localStorage if Supabase fails
3. **Default Values**: Use defaults if no data exists

## Usage Examples

### Migration Modal
```tsx
import { MigrationModal } from '@/components/migration-modal';

function App() {
  const [showMigration, setShowMigration] = useState(false);
  
  return (
    <MigrationModal 
      isOpen={showMigration}
      onClose={() => setShowMigration(false)}
      onComplete={() => console.log('Migration complete!')}
    />
  );
}
```

### Data Loading
```tsx
import { loadGridData, saveGridData } from '@/lib/data-loaders';

// Load grid data
const gridData = await loadGridData(userId);

// Save grid data
await saveGridData(userId, newGridData);
```

### Migration Hook
```tsx
import { useMigration } from '@/hooks/use-migration';

function MyComponent() {
  const { 
    shouldShowMigration, 
    hasMigrated, 
    userData, 
    triggerMigration 
  } = useMigration();
  
  if (shouldShowMigration) {
    return <MigrationModal />;
  }
  
  return <GameComponent data={userData} />;
}
```

## API Endpoints

### POST `/api/migration`
Migrates localStorage data to Supabase.

**Request Body:**
```json
{
  "gridData": {...},
  "characterPosition": {"x": 0, "y": 0},
  "tileInventory": {...},
  "userPreferences": {...},
  "imageDescriptions": {...},
  "gameSettings": {...}
}
```

**Response:**
```json
{
  "success": true,
  "migrated": ["grid_migrated", "position_migrated"],
  "message": "Data migrated successfully"
}
```

### GET `/api/migration`
Checks migration status for the current user.

**Response:**
```json
{
  "hasGridData": true,
  "hasCharacterPosition": true,
  "hasTileInventory": false,
  "hasUserPreferences": true,
  "hasImageDescriptions": false,
  "hasGameSettings": true
}
```

## Error Handling

### Common Issues
1. **Authentication Errors**: Ensure user is authenticated with Clerk
2. **RLS Policy Violations**: Check user permissions
3. **Data Type Mismatches**: Verify data types match table schema
4. **Network Errors**: Implement retry logic and fallbacks

### Fallback Strategy
1. **Supabase Failure**: Fallback to localStorage
2. **localStorage Failure**: Use default values
3. **Migration Failure**: Keep local data, retry later

## Performance Considerations

### Indexes
- All `user_id` columns are indexed
- Composite indexes for frequently queried combinations
- Partial indexes for active records

### Data Size
- Grid data can be large, consider compression
- Image descriptions are text-only
- Settings and preferences are typically small

### Caching
- Implement client-side caching for frequently accessed data
- Use localStorage as backup cache
- Consider Redis for server-side caching (future)

## Security

### Row Level Security
- All tables have RLS enabled
- Users can only access their own data
- Policies prevent cross-user data access

### Data Validation
- Validate data types before insertion
- Sanitize user inputs
- Implement proper error handling

## Monitoring

### Migration Metrics
- Track migration success/failure rates
- Monitor data size and performance
- Log errors for debugging

### User Experience
- Show progress indicators during migration
- Provide clear error messages
- Allow users to retry failed migrations

## Troubleshooting

### Migration Fails
1. Check user authentication
2. Verify database connection
3. Review RLS policies
4. Check data format compatibility

### Data Not Loading
1. Verify Supabase connection
2. Check localStorage fallback
3. Review data loading functions
4. Check for JavaScript errors

### Performance Issues
1. Optimize database queries
2. Add missing indexes
3. Implement caching
4. Consider data compression

## Future Enhancements

### Planned Features
1. **Incremental Migration**: Migrate data in chunks
2. **Conflict Resolution**: Handle data conflicts between devices
3. **Data Compression**: Compress large data sets
4. **Offline Support**: Queue changes when offline
5. **Data Export**: Allow users to export their data

### Scalability
1. **Database Partitioning**: Partition tables by user
2. **Read Replicas**: Add read replicas for performance
3. **CDN Integration**: Cache static data
4. **Background Jobs**: Process migrations asynchronously

## Support

For issues with migration:
1. Check the browser console for errors
2. Verify Supabase connection
3. Review RLS policies
4. Contact support with error details

## Migration Checklist

- [ ] Run database migration
- [ ] Test with sample data
- [ ] Implement client-side migration
- [ ] Add error handling
- [ ] Test fallback scenarios
- [ ] Monitor performance
- [ ] Document user instructions
- [ ] Plan rollback strategy 