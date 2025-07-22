# Monster Battle Integration Guide

## Overview
The Monster Battle system is a Simon Says minigame that triggers when players encounter monster tiles on the realm map.

## Components Created

### 1. MonsterBattle Component (`components/monster-battle.tsx`)
- **Purpose**: Main battle interface with Simon Says gameplay
- **Features**: 
  - 5 rounds with increasing difficulty
  - 5 weapons (Shield, Sword, Armor, Artifact, Potion)
  - Visual sequence highlighting
  - Progress tracking
  - Reward system (100 gold + 100 XP for win, -10 gold per loss)

### 2. MonsterBattleExample Component (`components/monster-battle-example.tsx`)
- **Purpose**: Example implementation for testing
- **Usage**: Import and add to any page for testing

## Integration Steps

### Step 1: Add Monster Tiles to Realm Map
```typescript
// In your realm map generation, add monster tiles
const monsterTiles = [
  { x: 5, y: 3, type: 'dragon' },
  { x: 8, y: 7, type: 'goblin' },
  { x: 12, y: 2, type: 'troll' },
  { x: 3, y: 9, type: 'wizard' },
  { x: 7, y: 5, type: 'pegasus' },
  { x: 10, y: 8, type: 'fairy' }
]
```

### Step 2: Handle Monster Tile Clicks
```typescript
// In your realm page, add monster battle state
const [battleOpen, setBattleOpen] = useState(false)
const [currentMonster, setCurrentMonster] = useState<'dragon' | 'goblin' | 'troll' | 'wizard' | 'pegasus' | 'fairy'>('dragon')

// Handle tile click
const handleTileClick = (x: number, y: number) => {
  const tile = grid[y][x]
  if (tile.type === 'dragon' || tile.type === 'goblin' || tile.type === 'troll' || tile.type === 'wizard' || tile.type === 'pegasus' || tile.type === 'fairy') {
    setCurrentMonster(tile.type)
    setBattleOpen(true)
  }
}
```

### Step 3: Add Battle Component
```typescript
// Add to your realm page JSX
<MonsterBattle
  isOpen={battleOpen}
  onClose={() => setBattleOpen(false)}
  monsterType={currentMonster}
  onBattleComplete={(won, goldEarned, xpEarned) => {
    // Handle battle completion
    if (won) {
      // Remove monster tile from map
      // Update player stats
      // Show victory message
    }
  }}
/>
```

## Game Mechanics

### Round Progression
- **Round 1**: 3 items in sequence
- **Round 2**: 4 items in sequence
- **Round 3**: 5 items in sequence
- **Round 4**: 6 items in sequence
- **Round 5**: 7 items in sequence

### Rewards
- **Victory**: +100 gold, +100 XP + Achievement Card
- **Round Loss**: -10 gold (continues to next round)
- **Game Loss**: Total gold lost from all failed rounds

### Achievement Cards
Each monster unlocks a unique achievement card when defeated:
- **Dragon** (201.png) - Ancient Dragon Slayer
- **Goblin** (202.png) - Goblin Hunter
- **Troll** (203.png) - Troll Crusher
- **Wizard** (204.png) - Dark Wizard Vanquisher
- **Pegasus** (205.png) - Pegasus Tamer
- **Fairy** (206.png) - Fairy Friend

### Weapons
1. **Shield** (Blue) - Defensive weapon
2. **Sword** (Red) - Offensive weapon
3. **Armor** (Gray) - Protective gear
4. **Artifact** (Purple) - Magical item
5. **Potion** (Green) - Healing item

## Customization

### Adding New Monsters
```typescript
// Add to monsterData in monster-battle.tsx
const monsterData = {
  // ... existing monsters
  newMonster: {
    name: 'New Monster',
    image: '/images/creatures/new-monster.png',
    description: 'Description of new monster',
    difficulty: 'Medium',
    achievementId: '207' // Next available achievement ID
  }
}
```

### Modifying Rewards
```typescript
// In handleGameWin function
const earnedGold = 150 // Change from 100
const earnedXP = 200   // Change from 100
```

### Adjusting Difficulty
```typescript
// In generateSequence function
const roundLength = 1 + currentRound // Easier: starts with 2 items
// or
const roundLength = 3 + currentRound // Harder: starts with 4 items
```

## Testing

### Quick Test
1. Import `MonsterBattleExample` component
2. Add to any page: `<MonsterBattleExample />`
3. Click buttons to test different monsters

### Integration Test
1. Add monster tiles to your realm map
2. Click on monster tiles to trigger battles
3. Test win/loss scenarios
4. Verify rewards are applied correctly

## Future Enhancements

### Possible Additions
- **Sound Effects**: Add audio for weapon clicks and sequences
- **Animations**: More elaborate monster and weapon animations
- **Difficulty Scaling**: Adjust based on player level
- **Special Abilities**: Different weapons have special effects
- **Boss Battles**: Longer sequences for special monsters
- **Multiplayer**: Competitive battles between players

### Technical Improvements
- **Performance**: Optimize sequence generation and rendering
- **Accessibility**: Add keyboard controls and screen reader support
- **Mobile**: Improve touch controls for mobile devices
- **Persistence**: Save battle progress and monster states 