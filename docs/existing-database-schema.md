# EXISTING DATABASE SCHEMA - DO NOT MODIFY

## 🚨 CRITICAL: This is the ACTUAL database structure. DO NOT create new tables or modify existing ones.

## Database Tables (Confirmed from Screenshot)

### Core User & Character Tables
- `account` - User account management
- `profiles` - User profile information
- `character` - Character data
- `character_stats` - Character statistics (highlighted in screenshot)
- `character_perks` - Character abilities and perks
- `character_strengths` - Character strength attributes
- `character_titles` - Character titles and achievements

### Game Progression Tables
- `experience_transactions` - Experience point transactions
- `gold_transactions` - Gold currency transactions
- `user_progress` - User progression tracking
- `user_experience_summary` - Experience summary (eye icon - view)
- `user_quest_progress` - Quest progress tracking (eye icon - view)
- `user_roles` - User role assignments (eye icon - view)

### Quest & Challenge System
- `quests` - Available quests
- `quest_completion` - Quest completion records (highlighted in screenshot)
- `quest_favorites` - User favorite quests
- `challenges` - Available challenges
- `challenge_completion` - Challenge completion records
- `user_challenge_stats` - User challenge statistics

### Kingdom & Realm System
- `kingdom_grid` - Kingdom grid layout
- `kingdom_event_log` - Kingdom event history
- `realm_grids` - Realm grid data
- `realm_map` - Realm map data
- `realm_tiles` - Realm tile information
- `tile_inventory` - User's tile inventory
- `tile_placements` - Tile placement records
- `property_timers` - Property timer management

### Achievement & Milestone System
- `achievement_definitions` - Achievement definitions
- `achievements` - User achievements (highlighted in screenshot)
- `milestones` - Available milestones
- `milestone_completion` - Milestone completion records

### Inventory & Items
- `inventory_items` - User inventory (highlighted in screenshot)
- `item` - Item definitions
- `active_perks` - Active user perks

### Game Features
- `game_settings` - Game configuration (seasonal events, etc.)
- `daily_tasks` - Daily task system
- `streaks` - User streak tracking
- `notifications` - User notifications
- `user_preferences` - User preferences
- `easter_eggs` - Hidden game features
- `discovered_creatures` - Creature discoveries
- `monster_spawns` - Monster spawning system
- `rare_tiles` - Rare tile system
- `seasonal_hunt` - Seasonal hunting events

### Special Tables (Eye Icon - Views)
- `user_experience_summary` - Aggregated experience data
- `user_quest_progress` - Aggregated quest progress
- `user_roles` - User role assignments
- `user_creature_discoveries` - Creature discovery tracking

## 🚨 IMPORTANT NOTES:
1. **DO NOT CREATE NEW TABLES** - All necessary tables already exist
2. **DO NOT MODIFY TABLE STRUCTURE** - Tables are working and contain data
3. **FOCUS ON DATA RETRIEVAL** - The issue is likely in the API queries, not the database
4. **PRESERVE EXISTING DATA** - Users have valuable progress that must not be lost

## Current Issue:
Kingdom graphs/tables showing empty states despite data existing in Supabase tables. This is a data retrieval/API issue, not a database structure issue.
