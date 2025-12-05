# Supabase AI Database Setup Guide

Follow these steps in your Supabase dashboard to create all the necessary tables and policies.

## Step 1: Create quest_favorites table

**Go to:** Table Editor → Create a new table

**Table name:** `quest_favorites`

**Columns:**
- `id` (type: bigint, primary key, identity)
- `user_id` (type: text, not null)
- `quest_id` (type: text, not null)
- `favorited_at` (type: timestamptz, default: now())
- `created_at` (type: timestamptz, default: now())
- `updated_at` (type: timestamptz, default: now())

**Enable RLS:** Yes

## Step 2: Create kingdom_grid table

**Go to:** Table Editor → Create a new table

**Table name:** `kingdom_grid`

**Columns:**
- `id` (type: bigint, primary key, identity)
- `user_id` (type: text, not null)
- `grid` (type: jsonb, not null, default: '[]'::jsonb)
- `created_at` (type: timestamptz, default: now())
- `updated_at` (type: timestamptz, default: now())

**Enable RLS:** Yes

## Step 3: Create user_progress table

**Go to:** Table Editor → Create a new table

**Table name:** `user_progress`

**Columns:**
- `id` (type: bigint, primary key, identity)
- `user_id` (type: text, not null)
- `level` (type: integer, default: 1)
- `experience` (type: integer, default: 0)
- `gold` (type: integer, default: 0)
- `build_tokens` (type: integer, default: 0)
- `tiles_placed` (type: integer, default: 0)
- `creatures_discovered` (type: integer, default: 0)
- `achievements_unlocked` (type: integer, default: 0)
- `quests_completed` (type: integer, default: 0)
- `challenges_completed` (type: integer, default: 0)
- `created_at` (type: timestamptz, default: now())
- `updated_at` (type: timestamptz, default: now())

**Enable RLS:** Yes

## Step 4: Create achievements table

**Go to:** Table Editor → Create a new table

**Table name:** `achievements`

**Columns:**
- `id` (type: bigint, primary key, identity)
- `user_id` (type: text, not null)
- `achievement_id` (type: varchar(10), not null)
- `achievement_name` (type: varchar(255))
- `description` (type: text)
- `unlocked_at` (type: timestamptz, default: now())
- `created_at` (type: timestamptz, default: now())
- `updated_at` (type: timestamptz, default: now())

**Enable RLS:** Yes

## Step 5: Create tile_placements table

**Go to:** Table Editor → Create a new table

**Table name:** `tile_placements`

**Columns:**
- `id` (type: bigint, primary key, identity)
- `user_id` (type: text, not null)
- `x` (type: integer, not null)
- `y` (type: integer, not null)
- `tile_type` (type: integer, not null)
- `placed_at` (type: timestamptz, default: now())
- `created_at` (type: timestamptz, default: now())
- `updated_at` (type: timestamptz, default: now())

**Enable RLS:** Yes

## Step 6: Create monster_spawns table

**Go to:** Table Editor → Create a new table

**Table name:** `monster_spawns`

**Columns:**
- `id` (type: bigint, primary key, identity)
- `user_id` (type: text, not null)
- `x` (type: integer, not null)
- `y` (type: integer, not null)
- `monster_type` (type: varchar(50), not null)
- `spawned_at` (type: timestamptz, default: now())
- `created_at` (type: timestamptz, default: now())
- `updated_at` (type: timestamptz, default: now())

**Enable RLS:** Yes

## Step 7: Create achievement_definitions table

**Go to:** Table Editor → Create a new table

**Table name:** `achievement_definitions`

**Columns:**
- `id` (type: varchar(10), primary key)
- `name` (type: varchar(255), not null)
- `description` (type: text)
- `category` (type: varchar(50), not null)
- `difficulty` (type: varchar(20), not null)
- `xp_reward` (type: integer, default: 0)
- `gold_reward` (type: integer, default: 0)
- `image_url` (type: text)
- `is_hidden` (type: boolean, default: false)
- `unlock_condition` (type: text)
- `created_at` (type: timestamptz, default: now())
- `updated_at` (type: timestamptz, default: now())

**Enable RLS:** Yes

## Step 8: Add Unique Constraints

**Go to:** Table Editor → Select each table → Edit → Add constraints

**quest_favorites:**
- Add unique constraint on `(user_id, quest_id)`

**kingdom_grid:**
- Add unique constraint on `(user_id)`

**user_progress:**
- Add unique constraint on `(user_id)`

**achievements:**
- Add unique constraint on `(user_id, achievement_id)`

**tile_placements:**
- Add unique constraint on `(user_id, x, y)`

## Step 9: Create RLS Policies

**Go to:** Authentication → Policies → Add policy for each table

### quest_favorites policies:
- **Select policy:** `quest_favorites_select_policy`
  - Target roles: `authenticated`
  - Using expression: `user_id = auth.uid()`

- **Insert policy:** `quest_favorites_insert_policy`
  - Target roles: `authenticated`
  - Using expression: `user_id = auth.uid()`

- **Update policy:** `quest_favorites_update_policy`
  - Target roles: `authenticated`
  - Using expression: `user_id = auth.uid()`

- **Delete policy:** `quest_favorites_delete_policy`
  - Target roles: `authenticated`
  - Using expression: `user_id = auth.uid()`

### kingdom_grid policies:
- **Select policy:** `kingdom_grid_select_policy`
  - Target roles: `authenticated`
  - Using expression: `user_id = auth.uid()`

- **Insert policy:** `kingdom_grid_insert_policy`
  - Target roles: `authenticated`
  - Using expression: `user_id = auth.uid()`

- **Update policy:** `kingdom_grid_update_policy`
  - Target roles: `authenticated`
  - Using expression: `user_id = auth.uid()`

- **Delete policy:** `kingdom_grid_delete_policy`
  - Target roles: `authenticated`
  - Using expression: `user_id = auth.uid()`

### user_progress policies:
- **Select policy:** `user_progress_select_policy`
  - Target roles: `authenticated`
  - Using expression: `user_id = auth.uid()`

- **Insert policy:** `user_progress_insert_policy`
  - Target roles: `authenticated`
  - Using expression: `user_id = auth.uid()`

- **Update policy:** `user_progress_update_policy`
  - Target roles: `authenticated`
  - Using expression: `user_id = auth.uid()`

- **Delete policy:** `user_progress_delete_policy`
  - Target roles: `authenticated`
  - Using expression: `user_id = auth.uid()`

### achievements policies:
- **Select policy:** `achievements_select_policy`
  - Target roles: `authenticated`
  - Using expression: `user_id = auth.uid()`

- **Insert policy:** `achievements_insert_policy`
  - Target roles: `authenticated`
  - Using expression: `user_id = auth.uid()`

- **Update policy:** `achievements_update_policy`
  - Target roles: `authenticated`
  - Using expression: `user_id = auth.uid()`

- **Delete policy:** `achievements_delete_policy`
  - Target roles: `authenticated`
  - Using expression: `user_id = auth.uid()`

### tile_placements policies:
- **Select policy:** `tile_placements_select_policy`
  - Target roles: `authenticated`
  - Using expression: `user_id = auth.uid()`

- **Insert policy:** `tile_placements_insert_policy`
  - Target roles: `authenticated`
  - Using expression: `user_id = auth.uid()`

- **Update policy:** `tile_placements_update_policy`
  - Target roles: `authenticated`
  - Using expression: `user_id = auth.uid()`

- **Delete policy:** `tile_placements_delete_policy`
  - Target roles: `authenticated`
  - Using expression: `user_id = auth.uid()`

### monster_spawns policies:
- **Select policy:** `monster_spawns_select_policy`
  - Target roles: `authenticated`
  - Using expression: `user_id = auth.uid()`

- **Insert policy:** `monster_spawns_insert_policy`
  - Target roles: `authenticated`
  - Using expression: `user_id = auth.uid()`

- **Update policy:** `monster_spawns_update_policy`
  - Target roles: `authenticated`
  - Using expression: `user_id = auth.uid()`

- **Delete policy:** `monster_spawns_delete_policy`
  - Target roles: `authenticated`
  - Using expression: `user_id = auth.uid()`

### achievement_definitions policies:
- **Select policy:** `achievement_definitions_read_policy`
  - Target roles: `authenticated`
  - Using expression: `true`

## Step 10: Insert Achievement Definitions

**Go to:** Table Editor → achievement_definitions → Insert row

Add these rows one by one:

1. **ID:** `201`
   **Name:** `Ancient Dragon Slayer`
   **Description:** `Defeat Dragoni in a Simon Says battle`
   **Category:** `combat`
   **Difficulty:** `hard`
   **XP Reward:** `100`
   **Gold Reward:** `100`
   **Image URL:** `/images/achievements/201.png`
   **Unlock Condition:** `Complete Simon Says battle against Dragon`

2. **ID:** `202`
   **Name:** `Goblin Hunter`
   **Description:** `Defeat Orci in a Simon Says battle`
   **Category:** `combat`
   **Difficulty:** `easy`
   **XP Reward:** `100`
   **Gold Reward:** `100`
   **Image URL:** `/images/achievements/202.png`
   **Unlock Condition:** `Complete Simon Says battle against Goblin`

3. **ID:** `203`
   **Name:** `Troll Crusher`
   **Description:** `Defeat Trollie in a Simon Says battle`
   **Category:** `combat`
   **Difficulty:** `medium`
   **XP Reward:** `100`
   **Gold Reward:** `100`
   **Image URL:** `/images/achievements/203.png`
   **Unlock Condition:** `Complete Simon Says battle against Troll`

4. **ID:** `204`
   **Name:** `Dark Wizard Vanquisher`
   **Description:** `Defeat Sorcero in a Simon Says battle`
   **Category:** `combat`
   **Difficulty:** `hard`
   **XP Reward:** `100`
   **Gold Reward:** `100`
   **Image URL:** `/images/achievements/204.png`
   **Unlock Condition:** `Complete Simon Says battle against Wizard`

5. **ID:** `205`
   **Name:** `Pegasus Tamer`
   **Description:** `Defeat Peggie in a Simon Says battle`
   **Category:** `combat`
   **Difficulty:** `medium`
   **XP Reward:** `100`
   **Gold Reward:** `100`
   **Image URL:** `/images/achievements/205.png`
   **Unlock Condition:** `Complete Simon Says battle against Pegasus`

6. **ID:** `206`
   **Name:** `Fairy Friend`
   **Description:** `Defeat Fairiel in a Simon Says battle`
   **Category:** `combat`
   **Difficulty:** `easy`
   **XP Reward:** `100`
   **Gold Reward:** `100`
   **Image URL:** `/images/achievements/206.png`
   **Unlock Condition:** `Complete Simon Says battle against Fairy`

## Step 11: Grant Permissions

**Go to:** SQL Editor → Run this query:

```sql
GRANT ALL ON quest_favorites TO authenticated;
GRANT ALL ON kingdom_grid TO authenticated;
GRANT ALL ON user_progress TO authenticated;
GRANT ALL ON achievements TO authenticated;
GRANT ALL ON tile_placements TO authenticated;
GRANT ALL ON monster_spawns TO authenticated;
GRANT ALL ON achievement_definitions TO authenticated;
```

## Step 12: Create Indexes

**Go to:** SQL Editor → Run this query:

```sql
CREATE INDEX idx_quest_favorites_user_id ON quest_favorites(user_id);
CREATE INDEX idx_quest_favorites_quest_id ON quest_favorites(quest_id);
CREATE INDEX idx_kingdom_grid_user_id ON kingdom_grid(user_id);
CREATE INDEX idx_user_progress_user_id ON user_progress(user_id);
CREATE INDEX idx_achievements_user_id ON achievements(user_id);
CREATE INDEX idx_achievements_achievement_id ON achievements(achievement_id);
CREATE INDEX idx_tile_placements_user_id ON tile_placements(user_id);
CREATE INDEX idx_tile_placements_coordinates ON tile_placements(x, y);
CREATE INDEX idx_monster_spawns_user_id ON monster_spawns(user_id);
CREATE INDEX idx_monster_spawns_coordinates ON monster_spawns(x, y);
```

## Verification

After completing all steps:

1. **Test the app** - Quest favorites and kingdom grid should work
2. **Check Table Editor** - All 7 tables should be visible
3. **Check Authentication → Policies** - All policies should be active
4. **Check achievement_definitions table** - Should have 6 rows

## Troubleshooting

If you encounter issues:

1. **Table already exists:** Skip that step and continue
2. **Policy already exists:** Skip that policy and continue  
3. **Permission denied:** Make sure you're using the correct role
4. **RLS not working:** Verify policies are enabled and correct

This approach uses the Supabase UI instead of SQL, making it much easier to follow and less prone to errors! 