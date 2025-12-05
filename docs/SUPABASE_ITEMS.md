# Supabase Stored Items

This file lists the main tables and data types stored in Supabase for this project, based on `types/supabase.ts`.

## Main Tables and Stored Items

- **realm_grids**: User's grid state, character position, discovered tiles, current dungeon, etc.
- **quest_completions**: Quest completion status, category, quest name, date, etc.
- **character_stats**: Gold, experience, level, health, character name, etc.
- **inventory_items**: All inventory items (id, name, type, category, quantity, emoji, image, stats, equipped, etc.)
- **character_perks**: Perks, their type, effect, expiration, and equipped status.
- **character_titles**: Titles unlocked by the user.
- **character_strengths**: Strengths and their values.
- **achievements**: Achievements unlocked by the user.
- **notifications**: In-app notifications for the user.
- **app_logs**: Application logs (for log center).
- **kingdom_time_series**: Time series events for the kingdom.
- **tile_inventory**: Inventory of tiles, their type, quantity, cost, connections, etc.
- **discoveries**: Discoveries made by the user.
- **quest_stats**: Quest progress and completion.
- **image_descriptions**: Descriptions for images.
- **game_settings**: User-specific game settings.
- **purchased_items**: Items purchased by the user.
- **notable_locations**: Notable locations discovered by the user.
- **milestones**: Milestones and their progress.
- **checked_milestones**: Checked milestones.
- **checked_quests**: Checked quests.
- **tile_counts**: Count of each tile type.
- **tilemap**: Map data for the user.
- **user_preferences**: User preferences (e.g., UI settings).
- **realm_visits**: Visits to realms.
- **dungeon_sessions**: Dungeon run sessions.
- **character_positions**: Character positions on the map.
- **gold_transactions**: Gold transaction history.
- **experience_transactions**: Experience transaction history.
- **user_sessions**: User session data.
- **realm_grid_data**: Grid data snapshots.

---

For more details, see `types/supabase.ts`. 