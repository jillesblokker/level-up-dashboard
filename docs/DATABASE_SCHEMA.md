# Database Schema Documentation

This document provides a comprehensive overview of the Level Up Dashboard database schema.

## Overview

The application uses **Supabase** (PostgreSQL) as its primary database. The schema is designed to support:

- User authentication (via Clerk)
- Character progression (stats, levels, achievements)
- Quest/Challenge/Milestone tracking
- Kingdom building
- Social features (friends, alliances)

## Core Tables

### `character_stats`

Primary table for user character data.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | TEXT | Clerk user ID (unique) |
| `gold` | INTEGER | Current gold balance |
| `experience` | INTEGER | Total XP earned |
| `level` | INTEGER | Current level |
| `health` | INTEGER | Current health |
| `max_health` | INTEGER | Maximum health |
| `build_tokens` | INTEGER | Tokens for kingdom building |
| `character_name` | TEXT | Display name |
| `display_name` | TEXT | Display name (alias) |
| `title` | TEXT | Character title |
| `stats_data` | JSONB | Flexible stats storage |
| `created_at` | TIMESTAMP | Creation timestamp |
| `updated_at` | TIMESTAMP | Last update timestamp |

**Indexes:**

- `character_stats_user_id_key` (UNIQUE on user_id)

---

### `quests`

Quest definitions and metadata.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | TEXT | Owner's Clerk user ID |
| `name` | TEXT | Quest name |
| `title` | TEXT | Display title |
| `description` | TEXT | Quest description |
| `category` | TEXT | Category (might, knowledge, etc.) |
| `difficulty` | TEXT | Difficulty level |
| `xp_reward` | INTEGER | XP reward on completion |
| `gold_reward` | INTEGER | Gold reward on completion |
| `icon` | TEXT | Emoji or icon |
| `frequency` | TEXT | daily, weekly, monthly, once |
| `sender_id` | TEXT | For social quests |
| `is_global` | BOOLEAN | Available to all users |
| `created_at` | TIMESTAMP | Creation timestamp |
| `updated_at` | TIMESTAMP | Last update timestamp |

---

### `quest_completion`

Tracks quest completion status per user.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `quest_id` | UUID | Foreign key to quests |
| `user_id` | TEXT | Clerk user ID |
| `completed` | BOOLEAN | Completion status |
| `completed_at` | TIMESTAMP | When completed |
| `created_at` | TIMESTAMP | Record creation |

**Unique Constraint:** `(quest_id, user_id, completed_at::date)`

---

### `challenges`

Challenge definitions with streak tracking.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | TEXT | Owner's Clerk user ID |
| `name` | TEXT | Challenge name |
| `description` | TEXT | Challenge description |
| `category` | TEXT | Category |
| `xp_reward` | INTEGER | XP reward |
| `gold_reward` | INTEGER | Gold reward |
| `completed` | BOOLEAN | Completion status |
| `completed_at` | TIMESTAMP | When completed |
| `streak_count` | INTEGER | Current streak |
| `last_completed_date` | DATE | For streak tracking |
| `created_at` | TIMESTAMP | Creation timestamp |

---

### `milestones`

Long-term goals and achievements.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | TEXT | Owner's Clerk user ID |
| `name` | TEXT | Milestone name |
| `description` | TEXT | Description |
| `category` | TEXT | Category |
| `target_value` | INTEGER | Goal value |
| `current_value` | INTEGER | Progress value |
| `xp_reward` | INTEGER | XP reward |
| `gold_reward` | INTEGER | Gold reward |
| `completed` | BOOLEAN | Completion status |
| `completed_at` | TIMESTAMP | When completed |
| `created_at` | TIMESTAMP | Creation timestamp |

---

### `streaks`

User streak tracking.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | TEXT | Clerk user ID (unique) |
| `current_streak` | INTEGER | Current streak days |
| `longest_streak` | INTEGER | Best streak ever |
| `last_activity_date` | DATE | Last active day |
| `created_at` | TIMESTAMP | Creation timestamp |
| `updated_at` | TIMESTAMP | Last update |

---

### `achievements`

Achievement definitions (global).

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `name` | TEXT | Achievement name |
| `description` | TEXT | Description |
| `icon` | TEXT | Icon/emoji |
| `rarity` | TEXT | common, uncommon, rare, epic, legendary |
| `xp_reward` | INTEGER | XP reward |
| `gold_reward` | INTEGER | Gold reward |
| `requirement` | TEXT | How to unlock |
| `category` | TEXT | Category |

---

### `user_achievements`

Tracks which achievements users have unlocked.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | TEXT | Clerk user ID |
| `achievement_id` | UUID | Foreign key to achievements |
| `unlocked_at` | TIMESTAMP | When unlocked |

---

## Kingdom Tables

### `realm_tiles`

Kingdom grid tile data.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | TEXT | Owner's Clerk user ID |
| `x` | INTEGER | X coordinate |
| `y` | INTEGER | Y coordinate |
| `tile_type` | TEXT | Tile type |
| `level` | INTEGER | Upgrade level |
| `building` | TEXT | Building on tile |
| `created_at` | TIMESTAMP | Creation timestamp |
| `updated_at` | TIMESTAMP | Last update |

---

### `tile_inventory`

User's available tiles.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | TEXT | Owner's Clerk user ID |
| `tile_type` | TEXT | Tile type |
| `quantity` | INTEGER | Count owned |

---

## Social Tables

### `friends`

Friend relationships.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | TEXT | Requesting user |
| `friend_id` | TEXT | Friend's user ID |
| `status` | TEXT | pending, accepted, blocked |
| `created_at` | TIMESTAMP | When requested |

---

### `alliances`

Alliance groups.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `name` | TEXT | Alliance name |
| `description` | TEXT | Description |
| `leader_id` | TEXT | Leader's user ID |
| `member_count` | INTEGER | Current members |
| `streak_count` | INTEGER | Alliance streak |
| `created_at` | TIMESTAMP | Creation timestamp |

---

### `alliance_members`

Alliance membership.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `alliance_id` | UUID | Foreign key to alliances |
| `user_id` | TEXT | Member's user ID |
| `role` | TEXT | leader, officer, member |
| `joined_at` | TIMESTAMP | When joined |

---

### `notifications`

User notifications.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | TEXT | Recipient's user ID |
| `type` | TEXT | Notification type |
| `title` | TEXT | Title |
| `message` | TEXT | Message body |
| `data` | JSONB | Additional data |
| `read` | BOOLEAN | Read status |
| `created_at` | TIMESTAMP | When created |

---

## RPC Functions

### `smart_quest_completion`

Handles quest completion with stat updates atomically.

```sql
smart_quest_completion(
  p_user_id TEXT,
  p_quest_id UUID,
  p_completed BOOLEAN,
  p_xp_reward INTEGER,
  p_gold_reward INTEGER
) RETURNS JSONB
```

---

## Row Level Security (RLS)

All tables have RLS enabled with policies that ensure:

- Users can only read/write their own data
- Global data (achievements, global quests) is readable by all
- Admin functions are restricted

---

## Migration Strategy

Migrations are stored in `/migrations/` and should be run in order.

Key migrations:

- `master_setup.sql` - Initial schema
- `ensure_character_stats_complete.sql` - Character stats fixes
- `create_smart_quest_completion.sql` - RPC function
- `add-social-features.sql` - Friends/alliances

---

## Best Practices

1. **Always use `user_id` from Clerk** - Never trust client-provided user IDs
2. **Use transactions for multi-table updates** - Especially for stat changes
3. **Use JSONB for flexible data** - The `stats_data` column is a good fallback
4. **Index frequently queried columns** - user_id is indexed on all tables
5. **Handle missing columns gracefully** - Check both column and JSONB fallback
