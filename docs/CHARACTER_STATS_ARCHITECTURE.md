# Character Stats Architecture - CRITICAL DOCUMENTATION

## ⚠️ READ THIS BEFORE MAKING ANY CHANGES TO STATS MANAGEMENT

This document explains why stats management keeps breaking and how to prevent it.

## The Problem

We have **THREE RECURRING ISSUES**:

1. **Gold amounts decreasing** instead of increasing
2. **Achievements not unlocking** despite meeting requirements
3. **Quest/Challenge/Milestone progress not saving** correctly

## Root Causes

### 1. Multiple Data Sources Without Coordination

```text
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│ localStorage│ ←→  │  Supabase    │ ←→  │  In-Memory  │
│  (Client)   │     │   (Server)   │     │   (React)   │
└─────────────┘     └──────────────┘     └─────────────┘
       ↑                    ↑                    ↑
       └────────────────────┴────────────────────┘
              NO SINGLE SOURCE OF TRUTH!
```

**Why this breaks:**

- Component A reads from localStorage (gold: 100)
- Component B reads from Supabase (gold: 90, stale)
- Component B saves 90 + 10 = 100
- Component A saves 100 + 10 = 110
- Server receives both, last write wins (could be either!)

### 2. Race Conditions

```typescript
// ❌ BROKEN PATTERN (what we had):
async function saveCharacterStats(updates) {
  const current = await loadCharacterStats(); // ← Fetches from server!
  const merged = { ...current, ...updates };  // ← Overwrites local changes!
  await saveToServer(merged);
}

// Example of failure:
// T=0: User clicks building, gold=100 → 110 (saved locally)
// T=1: User completes quest, triggers save
// T=2: Save fetches from server (still shows gold=100)
// T=3: Save writes gold=100+reward=120 to local
// T=4: User's gold went from 110 → 120 instead of 110 → 130!
```

### 3. No Validation or Safeguards

```typescript
// ❌ DANGEROUS: No check if gold is decreasing
addToCharacterStat('gold', -50); // Accidentally negative!

// ❌ DANGEROUS: No conflict resolution
```typescript
localGold = 150;  // User earned this
serverGold = 100; // Stale data
// Which one wins? Random!
```

## The Solution: Character Stats Service

### Architecture

```
┌─────────────────────────────────────────────────────────┐
│           Character Stats Service (Singleton)            │
│                                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │  Local State (Source of Truth for Reads)           │ │
│  │  - Always up-to-date                               │ │
│  │  - Immediate updates                               │ │
│  │  - Optimistic UI                                   │ │
│  └────────────────────────────────────────────────────┘ │
│                          ↓                               │
│  ┌────────────────────────────────────────────────────┐ │
│  │  Sync Queue (Batched, Debounced)                   │ │
│  │  - Collects updates                                │ │
│  │  - Waits 2s before sync                            │ │
│  │  - Min 3s between syncs                            │ │
│  └────────────────────────────────────────────────────┘ │
│                          ↓                               │
│  ┌────────────────────────────────────────────────────┐ │
│  │  Server Sync (Backup & Persistence)                │ │
│  │  - Sends current local state                       │ │
│  │  - Never overwrites local with server              │ │
│  │  - Conflict resolution: local wins for gold/XP     │ │
│  └────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

### Key Principles

1. **Local State is ALWAYS the Source of Truth**
   - All reads come from localStorage
   - Server is just a backup
   - Never fetch from server before updating

2. **Progressive Stats Can Only Increase**
   - Gold and XP can never decrease (except explicit spending)
   - Validation happens on every update
   - Warnings logged if decrease detected

3. **Batched, Debounced Syncs**
   - Updates queue for 2 seconds
   - Minimum 3 seconds between server syncs
   - Prevents race conditions and API spam

4. **Conflict Resolution**
   - When merging server + local: `Math.max()` for gold/XP
   - Server wins for non-progressive stats (health, etc.)
   - Local changes never lost

## How to Use (MANDATORY)

### ✅ CORRECT: Use the Service

```typescript
import { 
  getCharacterStats, 
  updateCharacterStats, 
  addToCharacterStat,
  fetchFreshCharacterStats 
} from '@/lib/character-stats-service';

// Reading stats
const stats = getCharacterStats(); // Always use this!
console.log(stats.gold);

// Adding to a stat (most common)
addToCharacterStat('gold', 50, 'kingdom-building');
addToCharacterStat('experience', 100, 'quest-completion');

// Updating multiple stats
updateCharacterStats({
  gold: stats.gold + 50,
  experience: stats.experience + 100
}, 'quest-reward');

// Fetching from server (only on page load!)
useEffect(() => {
  fetchFreshCharacterStats();
}, []);
```

### ❌ WRONG: Direct Access

```typescript
// ❌ DON'T DO THIS:
localStorage.getItem('character-stats');

// ❌ DON'T DO THIS:
await fetch('/api/character-stats');

// ❌ DON'T DO THIS:
import { loadCharacterStats } from '@/lib/character-stats-manager';
const stats = await loadCharacterStats();
```

## Migration Plan

### Phase 1: Update Core Managers ✅ DONE

- [x] Create character-stats-service.ts
- [x] Update gold-manager.ts to use service
- [x] Update experience-manager.ts to use service
- [x] Update character-stats-manager.ts (delegates to service)

### Phase 2: Update Components ✅ DONE

- [x] Update kingdom-client.tsx (Potion/Item usage)
- [x] Update quests/page.tsx (Rewards application)
- [x] Update market/page.tsx (Balance checks & purchases)
- [ ] Update achievements/page.tsx (Verification)
- [ ] Update character/page.tsx (Verification)

### Phase 3: Testing

- [ ] Test gold collection (rapid clicks)
- [ ] Test quest completion
- [ ] Test achievement unlocking
- [ ] Test page refresh (data persistence)

## Testing Checklist

Before deploying ANY changes to stats:

- [ ] Can I collect from 5 kingdom buildings rapidly without gold decreasing?
- [ ] Does completing a quest increase gold correctly?
- [ ] Do achievements unlock when requirements are met?
- [ ] Does refreshing the page preserve my progress?
- [ ] Are there any console warnings about stat decreases?

## Common Pitfalls to Avoid

### 1. Fetching Before Updating

```typescript
// ❌ WRONG:
const current = await loadCharacterStats();
const newGold = current.gold + 50;
await saveCharacterStats({ gold: newGold });

// ✅ CORRECT:
addToCharacterStat('gold', 50, 'source-name');
```

### 2. Not Specifying Source

```typescript
// ❌ WRONG:
addToCharacterStat('gold', 50); // Where did this come from?

// ✅ CORRECT:
addToCharacterStat('gold', 50, 'kingdom-farm-collection');
```

### 3. Direct State Mutation

```typescript
// ❌ WRONG:
const stats = getCharacterStats();
stats.gold += 50; // This doesn't save!

// ✅ CORRECT:
addToCharacterStat('gold', 50, 'source-name');
```

### 4. Async/Await Confusion

```typescript
// ❌ WRONG:
const stats = await getCharacterStats(); // It's not async!

// ✅ CORRECT:
const stats = getCharacterStats(); // Synchronous!
```

## Debugging

If stats are broken, check:

1. **Console Warnings**: Look for "⚠️" warnings about stat decreases
2. **Source Attribution**: Check what `source` is causing the issue
3. **Sync Queue**: Is the queue backing up? Check network tab
4. **Race Conditions**: Are multiple components updating at once?

## Emergency Rollback

If the service breaks everything:

```typescript
// Temporarily disable the service
export const getCharacterStats = () => {
  // Fallback to old method
  const stored = localStorage.getItem('character-stats');
  return stored ? JSON.parse(stored) : defaultStats;
};
```

## Future Improvements

1. **Optimistic Locking**: Add version numbers to detect conflicts
2. **Offline Queue**: Persist sync queue to survive page refresh
3. **Real-time Sync**: WebSocket for instant cross-tab updates
4. **Audit Log**: Track every stat change for debugging

---

### 🚨 GOLDEN RULE 🚨

If you think you need to bypass it, you're probably wrong. Ask first.
