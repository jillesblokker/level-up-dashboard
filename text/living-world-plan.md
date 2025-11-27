# Living World Feature Plan: "Creatures of Thrivehaven" (v3)

## **Objective**
To transform the Kingdom Map from a static board into a living ecosystem where unlocked creatures inhabit the world, interact with the player, and react to their presence.

## **1. Visual Design: "Creature Sprites"**
We will use the custom PNG assets for each creature.

*   **Assets Location**: `/public/images/creatures/[id].png` (e.g., `001.png` for Flamio).
*   **Rendering**:
    *   Creatures will be rendered as `<img>` elements within the `<CreatureLayer />`.
    *   **Size**: Scaled to fit comfortably within a map tile (approx 60-80% of tile size) so they don't obscure the terrain entirely.
    *   **Animations**:
        *   **Idle**: A gentle "breathing" scale effect (scale 1.0 -> 1.05 -> 1.0).
        *   **Walking**: A small "hop" or "waddle" animation (rotate -5deg -> +5deg) while moving between tiles.
        *   **Interaction**: A "jump" effect (translateY -10px) when the player steps on their tile.

## **2. Core Feature: The "Encounter" System**
The creatures acknowledge the player's presence, making the world feel reactive.

### **A. Player-Creature Collision**
*   **Trigger**: When the player's avatar (or selection cursor) moves onto a tile occupied by a creature.
*   **Reaction**:
    1.  **Visual**: The creature performs a "Jump" animation.
    2.  **Audio**: A subtle sound effect (sizzle for fire, splash for water).
    3.  **Dialogue**: A speech bubble appears instantly above the creature with a character-specific greeting.

### **B. Personality-Driven Greetings**
We will write a set of "Encounter Lines" for each creature:

| Creature | Personality | Greeting (On Tile Enter) |
| :--- | :--- | :--- |
| **Flamio** | Hotheaded, energetic | *"Hot stuff coming through!"* / *"Watch the sparks, boss!"* |
| **Dolpio** | Playful, wet | *"Splash! You found me!"* / *"Race you to the waterfall!"* |
| **Rockie** | Grumpy, solid | *"Oof. Watch the toes."* / *"I was napping here..."* |
| **Leaf** | Cheerful, tiny | *"Peek-a-boo!"* / *"Don't step on the flowers!"* |
| **Icey** | Cold, shivering | *"Brrr! Close the door!"* / *"Chilly today, isn't it?"* |

## **3. Technical Implementation**

### **A. The `CreatureManager`**
A centralized system to manage creature states.

```typescript
interface MapCreature {
  id: string;          // '001' (Flamio), '004' (Dolpio)
  tileId: string;      // The grid tile they are currently on (e.g., 'row-2-col-3')
  type: 'fire' | 'water' | 'earth' | 'nature' | 'ice';
  state: 'idle' | 'walking' | 'greeting';
  imagePath: string;   // '/images/creatures/001.png'
}
```

### **B. Intelligent Wandering (Habitat System)**
Creatures won't just walk anywhere. They stick to their **Biomes**.
*   **Dolpio** only moves to `type: 'water'` tiles.
*   **Rockie** only moves to `type: 'mountain'` or `type: 'stone'` tiles.
*   **Leaf** sticks to `type: 'forest'` or `type: 'grass'`.
*   **Flamio** wanders near buildings (hearths) or empty land.

### **C. The `<CreatureOverlay />` Component**
*   Sits on top of the map grid.
*   Renders the creature PNGs at the center of their assigned tiles.
*   Handles the `onPlayerEnter` event to trigger the greeting.

## **4. Implementation Steps

1.  **Asset Preparation** [Completed]
    *   [x] User uploads PNGs to `/public/images/creatures/`.
    *   [x] Create `lib/creature-mapping.ts` with definitions (ID, Name, Filename, Type, Greetings).
    *   [x] Updated filenames to match user provided list (e.g. Dolphio.png, Drakon.png).

2.  **Component Development** [Completed]
    *   [x] Create `components/creature-sprite.tsx` (Visuals + Animation + Speech Bubble).
    *   [x] Create `components/creature-layer.tsx` (Spawning + Wandering AI + Interaction Logic).

3.  **Integration** [Completed]
    *   [x] Add `<CreatureLayer />` to Kingdom Map (`app/kingdom/page.tsx` / `KingdomGrid`).
    *   [x] Add `<CreatureLayer />` to Realm Map (`app/realm/page.tsx` / `MapGrid`).

4.  **Testing & Refinement** [Completed]
    *   [x] Verify creatures spawn only if unlocked.
    *   [x] Verify creatures wander within their habitat.
    *   [x] Verify speech bubbles trigger on player contact.
    *   [x] Adjust animation speeds and scale. is active/hovered).
2.  Detect Collision: `if (playerTile === creatureTile) triggerGreeting()`.
3.  Display the Speech Bubble UI.

## **5. Why this is better**
*   **Immersion**: Using the actual creature art makes them feel like tangible inhabitants of the world.
*   **Consistency**: Matches the achievement icons exactly, reinforcing the collection aspect.
*   **Delight**: Seeing your collection "come to life" and walk around is a huge reward for unlocking them.
