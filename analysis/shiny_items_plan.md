# Shiny Items System - Implementation Plan

## Overview

A rarity tier system for kingdom inventory items, inspired by Pokémon's "shiny" mechanic. Items can spawn with star ratings (0-3 stars), affecting their visual appearance and value.

---

## 1. Rarity Tiers

| Tier | Stars | Display | Probability | Price Multiplier |
|------|-------|---------|-------------|------------------|
| Normal | 0 | (none) | 85% | 1.0x |
| Uncommon | 1 | ⭐ | 10% | 2.0x |
| Rare | 2 | ⭐⭐ | 4% | 5.0x |
| Legendary | 3 | ⭐⭐⭐ | 1% | 15.0x |

**Example**: A `fish-red` with base value of 10 gold:

- Normal (0 stars): 10 gold
- 1 star: 20 gold
- 2 star: 50 gold
- 3 star: 150 gold

---

## 2. Database Changes

### Option A: Add Column to `tile_inventory`

```sql
ALTER TABLE tile_inventory 
ADD COLUMN star_rating INTEGER DEFAULT 0 CHECK (star_rating >= 0 AND star_rating <= 3);

-- Add index for queries filtering by rarity
CREATE INDEX idx_tile_inventory_star_rating ON tile_inventory(star_rating);
```

### Option B: New `item_metadata` Table (more flexible)

```sql
CREATE TABLE item_metadata (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    inventory_item_id UUID REFERENCES tile_inventory(id) ON DELETE CASCADE,
    star_rating INTEGER DEFAULT 0 CHECK (star_rating >= 0 AND star_rating <= 3),
    discovered_at TIMESTAMPTZ DEFAULT NOW(),
    -- Future extensibility: other metadata like custom names, enchantments, etc.
    UNIQUE(inventory_item_id)
);
```

**Recommendation**: Option A is simpler and sufficient for this feature.

---

## 3. Star Rating Assignment Logic

### Location: When items are added to inventory

File: `lib/inventory-manager.ts` or wherever inventory items are created

```typescript
// Probability configuration
const STAR_PROBABILITIES = {
  0: 0.85,  // 85% - Normal
  1: 0.10,  // 10% - Uncommon  
  2: 0.04,  // 4%  - Rare
  3: 0.01   // 1%  - Legendary
};

function rollStarRating(): number {
  const roll = Math.random();
  let cumulative = 0;
  
  for (const [stars, probability] of Object.entries(STAR_PROBABILITIES)) {
    cumulative += probability;
    if (roll < cumulative) {
      return parseInt(stars);
    }
  }
  return 0; // Fallback to normal
}
```

### Integration Points

- Tile collection (when collecting resources from tiles)
- Quest rewards
- Market purchases (could have fixed star rating or rolled)
- Gift receiving from allies

---

## 4. Price Calculation

```typescript
const STAR_MULTIPLIERS = {
  0: 1.0,
  1: 2.0,
  2: 5.0,
  3: 15.0
};

function calculateItemValue(basePrice: number, starRating: number): number {
  const multiplier = STAR_MULTIPLIERS[starRating] || 1.0;
  return Math.floor(basePrice * multiplier);
}
```

---

## 5. UI Changes

### Item Card Component

File: `components/inventory-item-card.tsx` (or similar)

```tsx
interface InventoryItemProps {
  item: {
    id: string;
    type: string;
    name: string;
    image: string;
    baseValue: number;
    starRating: number; // NEW
  };
}

function InventoryItemCard({ item }: InventoryItemProps) {
  const starDisplay = '⭐'.repeat(item.starRating);
  const actualValue = calculateItemValue(item.baseValue, item.starRating);
  
  // Glow effect for rare items
  const glowClass = {
    0: '',
    1: 'ring-1 ring-yellow-400/30',
    2: 'ring-2 ring-yellow-400/50 shadow-lg shadow-yellow-500/20',
    3: 'ring-2 ring-amber-400 shadow-xl shadow-amber-500/40 animate-pulse'
  }[item.starRating];

  return (
    <div className={`relative ${glowClass}`}>
      <img src={item.image} alt={item.name} />
      
      {/* Star Rating Badge - Top Right */}
      {item.starRating > 0 && (
        <div className="absolute top-1 right-1 bg-black/70 rounded-full px-1.5 py-0.5 text-xs">
          {starDisplay}
        </div>
      )}
      
      {/* Price with multiplier indication */}
      <div className="text-amber-400">
        {actualValue} 🪙
        {item.starRating > 0 && (
          <span className="text-xs text-gray-400 ml-1">
            ({STAR_MULTIPLIERS[item.starRating]}x)
          </span>
        )}
      </div>
    </div>
  );
}
```

### Visual Hierarchy

- **0 stars**: No badge, normal appearance
- **1 star**: Subtle yellow ring, single star badge
- **2 stars**: Brighter ring + shadow, two stars
- **3 stars**: Animated glow effect, three stars, sparkle animation

---

## 6. API Changes

### GET /api/inventory

Response should include `star_rating`:

```json
{
  "items": [
    {
      "id": "abc-123",
      "type": "fish-red",
      "name": "Red Fish",
      "quantity": 1,
      "star_rating": 2,
      "base_value": 10,
      "actual_value": 50
    }
  ]
}
```

### POST /api/inventory (when adding items)

Include star rating in insert:

```typescript
const starRating = rollStarRating();
await supabase.from('tile_inventory').insert({
  user_id: userId,
  tile_type: itemType,
  star_rating: starRating,
  // ... other fields
});
```

---

## 7. Celebration & Feedback

When a player gets a rare item (2+ stars):

```typescript
// Show celebration modal/toast
if (starRating >= 2) {
  showRareItemCelebration({
    itemName: item.name,
    stars: starRating,
    message: starRating === 3 
      ? "🌟 LEGENDARY! You found an ultra-rare item!" 
      : "✨ Rare find! This item has bonus stars!"
  });
  
  // Play special sound effect
  playSound('rare-item-found');
  
  // Confetti for 3-star items
  if (starRating === 3) {
    triggerConfetti();
  }
}
```

---

## 8. Collection/Statistics Tracking

Optional: Track shiny discoveries for achievements

```sql
-- Track first discovery of each star-rating per item type
CREATE TABLE item_discoveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  item_type TEXT NOT NULL,
  star_rating INTEGER NOT NULL,
  discovered_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, item_type, star_rating)
);
```

### Achievements

- "Lucky Find" - Discover your first 1-star item
- "Rare Collector" - Discover 10 different 2-star items
- "Legendary Hunter" - Discover any 3-star item
- "Shiny Master" - Collect all items in 3-star variants

---

## 9. Implementation Order

1. **Phase 1 - Database**: Add `star_rating` column to `tile_inventory`
2. **Phase 2 - Backend**: Implement `rollStarRating()` and price calculation
3. **Phase 3 - API**: Update inventory endpoints to include star ratings
4. **Phase 4 - UI**: Add star badges to item cards
5. **Phase 5 - Polish**: Add glow effects, celebrations, sounds
6. **Phase 6 - Stats**: Add discovery tracking and achievements

---

## 10. Migration for Existing Items

For items already in the database:

```sql
-- All existing items become "normal" (0 stars)
UPDATE tile_inventory SET star_rating = 0 WHERE star_rating IS NULL;
```

Or optionally, retroactively roll star ratings:

```sql
-- Randomly assign stars to existing items (one-time migration)
UPDATE tile_inventory 
SET star_rating = CASE 
  WHEN random() < 0.01 THEN 3
  WHEN random() < 0.05 THEN 2
  WHEN random() < 0.15 THEN 1
  ELSE 0
END
WHERE star_rating IS NULL;
```

---

## Summary

This system adds collectible depth without requiring new art assets. Players will:

- Feel excitement when getting rare drops
- Have meaningful choices about selling vs keeping rare items
- Have long-term collection goals
- Show off rare items to allies

The 1% legendary drop rate means a dedicated player collecting ~100 items would statistically find 1 legendary, making them feel special without being impossible.
