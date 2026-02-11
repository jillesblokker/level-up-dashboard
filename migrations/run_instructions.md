# Database Migrations Required

To fully connect the game systems, please execute the following SQL scripts in your Supabase SQL Editor:

1. **Titles System**
    * File: `migrations/create_titles_system.sql`
    * Purpose: Creates tables for tracking unlocked and equipped titles.

2. **Active Modifiers (Potions)**
    * File: `migrations/create_active_modifiers.sql`
    * Purpose: Creates a table to persist active potion effects and other modifiers.

3. **Dungeon History**
    * File: `migrations/create_dungeon_history.sql`
    * Purpose: Creates a table to record completed dungeon runs for history tracking.

4. **Ascension System**
    * File: `migrations/add_ascension_system.sql`
    * Purpose: Adds `ascension_level` column to `character_stats` to track prestige.

## Verification

After running these scripts, the backend APIs for Titles (`/api/titles`), Modifiers (`/api/active-modifiers`), Dungeon Completion (`/api/dungeon-complete`), and Ascension (`/api/ascension`) will function correctly and persist data to the database.
