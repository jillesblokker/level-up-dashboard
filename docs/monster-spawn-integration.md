# Monster Spawn Integration Guide

## Overview
The monster spawning system automatically spawns monsters on grass tiles based on specific conditions. When players move to a tile with a monster, the Simon Says battle begins.

## Spawn Conditions

### 1. Dragoni (Dragon) - Achievement 201
- **Trigger**: Place 2 cave tiles
- **Spawns on**: Random grass tile
- **Difficulty**: Hard

### 2. Orci (Goblin) - Achievement 202  
- **Trigger**: Place 20 forest tiles
- **Spawns on**: Random grass tile
- **Difficulty**: Easy

### 3. Trollie (Troll) - Achievement 203
- **Trigger**: Place 5 lava tiles
- **Spawns on**: Random grass tile
- **Difficulty**: Medium

### 4. Sorcero (Wizard) - Achievement 204
- **Trigger**: Use portal 2 times
- **Spawns on**: Random grass tile
- **Difficulty**: Hard

### 5. Peggie (Pegasus) - Achievement 205
- **Trigger**: Place 3 desert tiles
- **Spawns on**: Random grass tile
- **Difficulty**: Medium

### 6. Fairiel (Fairy) - Achievement 206
- **Trigger**: Complete 5 mystery box events
- **Spawns on**: Random grass tile
- **Difficulty**: Easy

## Integration Steps

### Step 1: Import Monster Spawn Manager
```typescript
import { checkMonsterSpawn, spawnMonsterOnTile } from '@/lib/monster-spawn-manager'
import { MonsterBattle } from '@/components/monster-battle'
import { MonsterTileOverlay } from '@/components/monster-tile-overlay'
```

### Step 2: Add Monster Battle State
```typescript
const [battleOpen, setBattleOpen] = useState(false)
const [currentMonster, setCurrentMonster] = useState<'dragon' | 'goblin' | 'troll' | 'wizard' | 'pegasus' | 'fairy'>('dragon')
```

### Step 3: Check for Monster Spawns When Placing Tiles
```typescript
const handlePlaceTile = (x: number, y: number, tileType: TileType) => {
  // Your existing tile placement logic
  
  // Check for monster spawns
  const spawnResult = checkMonsterSpawn(grid, tileType)
  
  if (spawnResult.shouldSpawn && spawnResult.position && spawnResult.monsterType) {
    // Spawn the monster
    spawnMonsterOnTile(grid, spawnResult.position.x, spawnResult.position.y, spawnResult.monsterType as any)
    
    // Show notification
    toast({
      title: "Monster Appeared!",
      description: `A ${spawnResult.monsterType} has appeared on the map!`,
    })
  }
}
```

### Step 4: Handle Monster Tile Clicks
```typescript
const handleTileClick = (x: number, y: number) => {
  const tile = grid[y][x]
  
  if (tile.hasMonster) {
    setCurrentMonster(tile.hasMonster)
    setBattleOpen(true)
    return
  }
  
  // Your existing tile click logic
}
```

### Step 5: Handle Character Movement to Monster Tiles
```typescript
const handleCharacterMove = (x: number, y: number) => {
  const tile = grid[y][x]
  
  if (tile.hasMonster) {
    setCurrentMonster(tile.hasMonster)
    setBattleOpen(true)
    return
  }
  
  // Your existing movement logic
}
```

### Step 6: Add Monster Battle Component
```typescript
<MonsterBattle
  isOpen={battleOpen}
  onClose={() => setBattleOpen(false)}
  monsterType={currentMonster}
  onBattleComplete={(won, goldEarned, xpEarned) => {
    if (won) {
      // Remove monster from tile
      const currentTile = grid[characterPosition.y][characterPosition.x]
      if (currentTile) {
        currentTile.hasMonster = undefined
        currentTile.monsterAchievementId = undefined
      }
      
      // Update grid
      setGrid([...grid])
    }
  }}
/>
```

### Step 7: Add Monster Overlays to Tile Rendering
```typescript
// In your tile rendering component
{tile.hasMonster && (
  <MonsterTileOverlay 
    tile={tile} 
    size={32} 
    className="absolute inset-0" 
  />
)}
```

## Special Event Handling

### Cave Placement
```typescript
const handleCavePlacement = (x: number, y: number) => {
  // Your cave placement logic
  
  // Check for dragon spawn
  const spawnResult = checkMonsterSpawn(grid, undefined, 'cave_placed')
  // Handle spawn result...
}
```

### Portal Usage
```typescript
const handlePortalUse = () => {
  // Your portal usage logic
  
  // Check for wizard spawn
  const spawnResult = checkMonsterSpawn(grid, undefined, 'portal_used')
  // Handle spawn result...
}
```

### Mystery Event Completion
```typescript
const handleMysteryEventComplete = () => {
  // Your mystery event logic
  
  // Check for fairy spawn
  const spawnResult = checkMonsterSpawn(grid, undefined, 'mystery_event')
  // Handle spawn result...
}
```

## State Management

### Local Storage
The monster spawn system uses localStorage to track:
- Spawned monsters (to prevent respawning)
- Tile counts for each type
- Cave placement count
- Portal usage count
- Mystery event count

### Reset Function
```typescript
import { resetMonsterSpawnState } from '@/lib/monster-spawn-manager'

// Reset all monster spawn state (for testing)
resetMonsterSpawnState()
```

## Visual Indicators

### Monster Tiles
- Monsters appear as overlays on grass tiles
- Red pulsing glow indicates monster presence
- Monster image is displayed on the tile

### Battle Interface
- Monster image appears in battle card
- Achievement card images used for rewards
- Item images from `/images/items/` folder

## Testing

### Manual Spawn Testing
```typescript
import { getCurrentSpawnState } from '@/lib/monster-spawn-manager'

// Check current spawn state
console.log(getCurrentSpawnState())
```

### Force Spawn (for testing)
```typescript
// Manually spawn a monster for testing
spawnMonsterOnTile(grid, 5, 5, 'dragon')
```

## Achievement Integration

### Automatic Unlocking
- Achievements are automatically unlocked on battle victory
- Achievement IDs: 201-206 for each monster type
- Images should be placed in `/public/images/achievements/`

### Achievement Display
- New achievements appear as undiscovered on achievement page
- Unlocked achievements show the monster battle card
- Progress tracking for monster collection 