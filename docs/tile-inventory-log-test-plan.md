# Tile Inventory Log Test Plan

## Overview
This plan outlines the logging strategy to track tile inventory operations and identify where issues occur in the buying process.

## Test Scenarios

### Scenario 1: New Player - First Time Buying Tiles
**Objective**: Track the complete flow when a new player buys their first tiles

**Steps**:
1. Open realm page
2. Open tile inventory
3. Check initial state (should show 5 foundation tiles)
4. Buy 1 grass tile
5. Check place tab quantities
6. Check buy tab quantities

**Expected Logs**:
```
[Realm] Loading inventory items...
[Realm] User level: 1
[Realm] No foundation tiles found, giving starting quantities
[Realm] Inventory items loaded: [grass: 5, water: 5, forest: 5, mountain: 5]
[Tile Inventory] Buy button clicked for grass tile
[Tile Inventory] Quantity: 1, Cost: 25
[Tile Inventory] Gold spent: 25
[Tile Inventory] API call to addTileToInventory
[API] POST /api/tile-inventory - Adding grass tile
[API] Database updated: grass quantity = 6
[Tile Inventory] Purchase successful
[Tile Inventory] Updating parent state
[Tile Inventory] Event dispatched: tile-inventory-update
[Realm] Tile inventory update event received
[Realm] Reloading inventory from database
[Realm] Updated inventoryAsItems: [grass: 6, water: 5, forest: 5, mountain: 5]
```

### Scenario 2: Existing Player - Buying Additional Tiles
**Objective**: Track flow when player with existing tiles buys more

**Steps**:
1. Open realm page
2. Open tile inventory
3. Check current quantities
4. Buy 2 water tiles
5. Check both tabs

**Expected Logs**:
```
[Realm] Loading inventory items...
[Realm] Found existing tiles: [grass: 6, water: 5, forest: 5, mountain: 5]
[Tile Inventory] Buy button clicked for water tile
[Tile Inventory] Quantity: 2, Cost: 100
[Tile Inventory] Gold spent: 100
[Tile Inventory] API call to addTileToInventory
[API] POST /api/tile-inventory - Updating water tile
[API] Database updated: water quantity = 7
[Tile Inventory] Purchase successful
[Tile Inventory] Updating parent state
[Tile Inventory] Event dispatched: tile-inventory-update
[Realm] Tile inventory update event received
[Realm] Reloading inventory from database
[Realm] Updated inventoryAsItems: [grass: 6, water: 7, forest: 5, mountain: 5]
```

### Scenario 3: Place Tab Verification
**Objective**: Verify place tab shows correct quantities

**Steps**:
1. Buy tiles in buy tab
2. Switch to place tab
3. Check quantities match

**Expected Logs**:
```
[Tile Inventory] Switching to place tab
[Tile Inventory] Place tab tiles: [grass: 6, water: 7, forest: 5, mountain: 5]
[Tile Inventory] All quantities match buy tab
```

## Log Implementation Points

### 1. Realm Page Logging
```typescript
// In loadInventoryItems function
console.log('[Realm] Loading inventory items...');
console.log('[Realm] User level:', userLevel);
console.log('[Realm] Database result:', inventoryResult);
console.log('[Realm] Inventory items loaded:', items.map(i => `${i.type}: ${i.quantity}`));

// In handleTileInventoryUpdate function
console.log('[Realm] Tile inventory update event received');
console.log('[Realm] Reloaded inventory data:', inventoryResult);
console.log('[Realm] Updated inventoryAsItems:', inventoryAsItems.map(i => `${i.type}: ${i.quantity}`));
```

### 2. Tile Inventory Component Logging
```typescript
// In handleBuyTile function
console.log('[Tile Inventory] Buy button clicked for', tile.type, 'tile');
console.log('[Tile Inventory] Quantity:', quantity, 'Cost:', totalCost);
console.log('[Tile Inventory] Gold spent:', totalCost);
console.log('[Tile Inventory] API call to addTileToInventory');
console.log('[Tile Inventory] Purchase result:', result);
console.log('[Tile Inventory] Updating parent state');
console.log('[Tile Inventory] Event dispatched: tile-inventory-update');

// In place tab rendering
console.log('[Tile Inventory] Place tab tiles:', categoryTiles.map(t => `${t.type}: ${t.quantity}`));
```

### 3. API Route Logging
```typescript
// In POST route
console.log('[API] POST /api/tile-inventory -', existing ? 'Updating' : 'Adding', tile.id, 'tile');
console.log('[API] Database updated:', tile.id, 'quantity =', existing ? existing.quantity + quantity : quantity);
```

## Debugging Questions

### For Each Scenario, Check:

1. **Initial State**:
   - What quantities are shown in place tab?
   - What quantities are shown in buy tab?
   - Are they consistent?

2. **After Purchase**:
   - Does the quantity increase by the amount bought?
   - Do both tabs show the same quantities?
   - Is the database updated correctly?

3. **State Synchronization**:
   - Does the realm page receive the update event?
   - Does the inventoryAsItems state update?
   - Do both tabs reflect the changes?

## Expected Issues to Look For

1. **Database Not Updated**: API call fails or doesn't update correctly
2. **Event Not Received**: Realm page doesn't get the update event
3. **State Not Updated**: inventoryAsItems doesn't reflect database changes
4. **Tab Inconsistency**: Place and buy tabs show different quantities
5. **Starting Quantities**: New players don't get foundation tiles

## Log Analysis Checklist

- [ ] All expected log messages appear in correct order
- [ ] Database quantities match UI quantities
- [ ] Both tabs show consistent data
- [ ] Events are dispatched and received
- [ ] State updates happen in correct sequence
- [ ] No duplicate events or state updates
- [ ] Starting quantities are applied correctly
- [ ] Purchase quantities are added correctly

## Next Steps After Logging

1. **Run the test scenarios** and collect logs
2. **Compare actual vs expected logs** to identify discrepancies
3. **Identify the exact point** where the flow breaks
4. **Implement targeted fixes** based on log analysis
5. **Re-run tests** to verify fixes work 