# API Reference & Consolidation Plan

This document provides an overview of all API endpoints and a plan to consolidate duplicates.

## Current Issues

1. **Duplicate quest endpoints**: Multiple endpoints handle similar functionality
2. **Inconsistent naming**: Mix of kebab-case and nested routes
3. **Debug/restore endpoints**: Should be removed or moved to admin
4. **Version suffixes**: `kingdom-stats` vs `kingdom-stats-v2`

## Current API Structure

### Core Endpoints (Keep)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/character-stats` | GET, PUT | Character stats CRUD |
| `/api/quests` | GET, POST | Quest management |
| `/api/quests/[id]` | GET, PUT, DELETE | Single quest operations |
| `/api/challenges` | GET, POST | Challenge management |
| `/api/milestones` | GET, POST | Milestone management |
| `/api/achievements` | GET | User achievements |
| `/api/inventory` | GET, POST | Inventory management |
| `/api/notifications` | GET, POST, DELETE | Notification management |
| `/api/friends` | GET, POST, DELETE | Friend management |

### Endpoints to Consolidate

#### Quest-Related (CONSOLIDATE)

- `/api/quests-complete` → Move to `/api/quests/[id]/complete`
- `/api/quests/complete` → Duplicate, remove
- `/api/quests/completion` → Duplicate, remove
- `/api/quests/smart-completion` → Merge into main completion logic
- `/api/quests/daily` → Keep as separate endpoint
- `/api/quests/favorites` → Keep
- `/api/quest-progress` → Merge into quests

#### Kingdom-Related (CONSOLIDATE)

- `/api/kingdom-stats` → Deprecate
- `/api/kingdom-stats-v2` → Rename to `/api/kingdom-stats`
- `/api/kingdom-grid` → Keep
- `/api/kingdom-events` → Keep
- `/api/kingdom-items` → Merge into inventory
- `/api/kingdom-tile-states` → Merge into kingdom-grid
- `/api/kingdom-timers` → Keep as `/api/kingdom/timers`
- `/api/kingdom/buy-tile` → Keep
- `/api/kingdom/buy-token` → Keep

#### Debug/Restore (REMOVE FROM PRODUCTION)

- `/api/debug-challenges` → Move to admin or remove
- `/api/debug-count` → Move to admin or remove
- `/api/restore-*` → Move to admin or remove
- `/api/seed-challenges` → Move to admin

### Recommended Consolidated Structure

```
/api
├── auth/
│   └── webhooks/clerk
├── admin/
│   ├── analytics
│   ├── users
│   ├── debug/
│   └── restore/
├── user/
│   ├── profile          # GET, PUT
│   ├── preferences      # GET, PUT
│   ├── friends/         # GET, POST
│   │   └── [id]         # DELETE
│   └── delete-account   # DELETE
├── character/
│   ├── stats            # GET, PUT
│   ├── strengths        # GET, PUT
│   ├── titles           # GET
│   └── perks            # GET, PUT
├── quests/
│   ├── index            # GET (list), POST (create)
│   ├── [id]/            
│   │   ├── index        # GET, PUT, DELETE
│   │   └── complete     # POST
│   ├── daily            # GET
│   └── favorites        # GET, POST, DELETE
├── challenges/
│   ├── index            # GET, POST
│   ├── [id]/
│   │   └── complete     # POST
│   └── progress         # GET
├── milestones/
│   ├── index            # GET, POST
│   └── [id]/
│       └── complete     # POST
├── achievements/
│   ├── index            # GET
│   ├── definitions      # GET
│   └── unlock           # POST
├── kingdom/
│   ├── stats            # GET
│   ├── grid             # GET, PUT
│   ├── tiles/
│   │   ├── buy          # POST
│   │   └── [id]         # GET, PUT
│   ├── events           # GET
│   └── timers           # GET, PUT
├── inventory/
│   ├── index            # GET
│   ├── add              # POST
│   └── remove           # POST
├── social/
│   ├── alliance/        # GET, POST
│   │   ├── invite       # POST
│   │   └── streak       # GET, PUT
│   ├── leaderboard      # GET
│   └── gifts/           
│       └── [id]         # GET, POST
└── notifications/       # GET, POST, DELETE
```

## Migration Steps

### Phase 1: Create Alias Routes (Non-Breaking)

1. Create new route structure
2. Have old routes forward to new ones
3. Add deprecation warnings in responses

### Phase 2: Update Client Code

1. Update all frontend API calls to use new routes
2. Run tests to verify

### Phase 3: Remove Old Routes

1. Remove deprecated routes
2. Clean up unused code

## Notes

- The CSS lint warnings about `-webkit-overflow-scrolling` are for Safari legacy support
  and can be safely ignored or wrapped in `@supports`
- The `text-size-adjust` warning is also for mobile Safari compatibility
