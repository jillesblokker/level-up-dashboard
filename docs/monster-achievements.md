# Monster Battle Achievements

## Overview
Each monster in the Simon Says battle system unlocks a unique achievement card when defeated. These achievements are automatically unlocked upon victory and provide players with collectible cards.

## Achievement List

### 201.png - Ancient Dragon Slayer
- **Monster**: Dragon
- **Difficulty**: Hard
- **Description**: Defeat the Ancient Dragon in a Simon Says battle
- **Requirements**: Complete all 5 rounds against the Dragon
- **Rewards**: 100 gold, 100 XP, Achievement Card

### 202.png - Goblin Hunter
- **Monster**: Goblin
- **Difficulty**: Easy
- **Description**: Defeat the Crafty Goblin in a Simon Says battle
- **Requirements**: Complete all 5 rounds against the Goblin
- **Rewards**: 100 gold, 100 XP, Achievement Card

### 203.png - Troll Crusher
- **Monster**: Troll
- **Difficulty**: Medium
- **Description**: Defeat the Mountain Troll in a Simon Says battle
- **Requirements**: Complete all 5 rounds against the Troll
- **Rewards**: 100 gold, 100 XP, Achievement Card

### 204.png - Dark Wizard Vanquisher
- **Monster**: Wizard
- **Difficulty**: Hard
- **Description**: Defeat the Dark Wizard in a Simon Says battle
- **Requirements**: Complete all 5 rounds against the Wizard
- **Rewards**: 100 gold, 100 XP, Achievement Card

### 205.png - Pegasus Tamer
- **Monster**: Pegasus
- **Difficulty**: Medium
- **Description**: Defeat the Mystical Pegasus in a Simon Says battle
- **Requirements**: Complete all 5 rounds against the Pegasus
- **Rewards**: 100 gold, 100 XP, Achievement Card

### 206.png - Fairy Friend
- **Monster**: Fairy
- **Difficulty**: Easy
- **Description**: Defeat the Enchanted Fairy in a Simon Says battle
- **Requirements**: Complete all 5 rounds against the Fairy
- **Rewards**: 100 gold, 100 XP, Achievement Card

## Technical Details

### Achievement Unlocking
Achievements are automatically unlocked when:
1. Player completes all 5 rounds successfully
2. Monster is defeated
3. API call to `/api/achievements/unlock` is made with the achievement ID

### Achievement IDs
- Dragon: `201`
- Goblin: `202`
- Troll: `203`
- Wizard: `204`
- Pegasus: `205`
- Fairy: `206`

### Image Files
Place the achievement card images in the `/public/images/achievements/` directory:
- `201.png` - Dragon achievement card
- `202.png` - Goblin achievement card
- `203.png` - Troll achievement card
- `204.png` - Wizard achievement card
- `205.png` - Pegasus achievement card
- `206.png` - Fairy achievement card

## Integration Notes

### Achievement System
The monster battle system automatically calls the achievement unlock API when a player wins. No additional integration is required.

### Error Handling
If the achievement unlock fails, the error is logged but doesn't affect the battle completion. Players still receive their gold and XP rewards.

### Future Expansion
To add more monster achievements:
1. Create the achievement card image (e.g., `207.png`)
2. Add the monster to the `monsterData` object with the next achievement ID
3. Update the TypeScript types to include the new monster type
4. Add the monster tile type to your realm map generation

## Player Experience

### Achievement Discovery
- Players discover achievements by encountering monster tiles on the realm map
- Each monster type provides a unique challenge and reward
- Achievement cards serve as collectibles and proof of victory

### Progression
- Easy monsters (Goblin, Fairy) are good for beginners
- Medium monsters (Troll, Pegasus) provide moderate challenge
- Hard monsters (Dragon, Wizard) are for experienced players

### Collection Completion
Players can collect all 6 monster achievement cards by defeating each monster type at least once. 