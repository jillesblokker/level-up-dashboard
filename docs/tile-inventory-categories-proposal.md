# Tile Inventory Categories Proposal

## Overview
Divide the tile inventory into 5 level-based categories to provide progression incentives and organize tiles logically by complexity and cost.

## Category Structure

### Level 0-20: "Foundation Tiles"
**Theme**: Basic terrain and simple structures
**Tiles Available**:
- Grass (Basic terrain)
- Forest (Natural environment)
- Mountain (Elevated terrain)
- Water (Liquid elements)
- Simple Path (Basic connectivity)
- Small Rock (Decorative element)

**Unlock Condition**: Available from start
**Purpose**: Teach basic tile placement and grid mechanics

### Level 20-40: "Settlement Tiles"
**Theme**: Small communities and basic infrastructure
**Tiles Available**:
- Town (Small settlement)
- City (Larger settlement)
- Road (Basic connectivity)
- Bridge (Water crossing)
- Farm (Food production)
- Well (Water source)
- Small House (Residential)
- Market Stall (Commerce)

**Unlock Condition**: Level 20
**Purpose**: Introduce economic and social elements

### Level 40-60: "Development Tiles"
**Theme**: Advanced infrastructure and specialized buildings
**Tiles Available**:
- Castle (Defensive structure)
- Tower (Defensive/observation)
- Library (Knowledge center)
- Workshop (Crafting facility)
- Tavern (Social hub)
- Church (Religious center)
- Guard Post (Security)
- Stable (Transportation)

**Unlock Condition**: Level 40
**Purpose**: Add strategic and specialized gameplay elements

### Level 60-80: "Advanced Tiles"
**Theme**: Complex structures and magical elements
**Tiles Available**:
- Wizard Tower (Magical research)
- Alchemy Lab (Potion crafting)
- Arena (Combat facility)
- Observatory (Research facility)
- Magic Portal (Transportation)
- Crystal Mine (Resource extraction)
- Enchanted Garden (Magical agriculture)
- Training Ground (Combat training)

**Unlock Condition**: Level 60
**Purpose**: Introduce magical and advanced gameplay mechanics

### Level 80-100: "Legendary Tiles"
**Theme**: Epic structures and unique features
**Tiles Available**:
- Dragon's Lair (Epic structure)
- Floating Island (Unique terrain)
- Time Portal (Advanced transportation)
- Crystal Palace (Luxury structure)
- Ancient Temple (Religious epic)
- Sky Bridge (Advanced connectivity)
- Elemental Forge (Epic crafting)
- World Tree (Legendary natural feature)

**Unlock Condition**: Level 80
**Purpose**: Provide end-game content and prestige

## Database Schema Changes

### New Table: `tile_categories`
```sql
CREATE TABLE tile_categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    category_name TEXT NOT NULL,
    min_level INTEGER NOT NULL,
    max_level INTEGER NOT NULL,
    description TEXT,
    theme TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Insert category data
INSERT INTO tile_categories (category_name, min_level, max_level, description, theme) VALUES
('Foundation Tiles', 0, 20, 'Basic terrain and simple structures for beginners', 'Basic terrain'),
('Settlement Tiles', 20, 40, 'Small communities and basic infrastructure', 'Settlement'),
('Development Tiles', 40, 60, 'Advanced infrastructure and specialized buildings', 'Development'),
('Advanced Tiles', 60, 80, 'Complex structures and magical elements', 'Advanced'),
('Legendary Tiles', 80, 100, 'Epic structures and unique features', 'Legendary');
```

### Update `tiles` table
```sql
-- Add category_id to existing tiles table
ALTER TABLE tiles ADD COLUMN category_id UUID REFERENCES tile_categories(id);

-- Update existing tiles with appropriate categories
UPDATE tiles SET category_id = (SELECT id FROM tile_categories WHERE category_name = 'Foundation Tiles') WHERE type IN ('grass', 'forest', 'mountain', 'water');
UPDATE tiles SET category_id = (SELECT id FROM tile_categories WHERE category_name = 'Settlement Tiles') WHERE type IN ('town', 'city', 'road', 'bridge');
-- Continue for other categories...
```

## Frontend Implementation

### Component Structure
```typescript
interface TileCategory {
  id: string;
  name: string;
  minLevel: number;
  maxLevel: number;
  description: string;
  theme: string;
  isUnlocked: boolean;
  tiles: Tile[];
}

interface TileInventoryProps {
  categories: TileCategory[];
  userLevel: number;
  selectedCategory: string;
  onCategoryChange: (categoryId: string) => void;
}
```

### UI Layout
```tsx
<Tabs value={selectedCategory} onValueChange={onCategoryChange}>
  <TabsList className="grid grid-cols-5 w-full">
    {categories.map(category => (
      <TabsTrigger 
        key={category.id} 
        value={category.id}
        disabled={!category.isUnlocked}
        className={cn(
          !category.isUnlocked && "opacity-50 cursor-not-allowed"
        )}
      >
        <div className="text-center">
          <div className="font-bold">{category.name}</div>
          <div className="text-xs text-muted-foreground">
            Level {category.minLevel}-{category.maxLevel}
          </div>
        </div>
      </TabsTrigger>
    ))}
  </TabsList>
  
  {categories.map(category => (
    <TabsContent key={category.id} value={category.id}>
      {!category.isUnlocked ? (
        <div className="text-center py-8">
          <div className="text-lg font-bold">Locked</div>
          <div className="text-sm text-muted-foreground">
            Unlock at level {category.minLevel}
          </div>
        </div>
      ) : (
        <TileGrid tiles={category.tiles} />
      )}
    </TabsContent>
  ))}
</Tabs>
```

## Benefits

1. **Progression Incentive**: Players have clear goals to unlock new tile categories
2. **Organized Interface**: Tiles are logically grouped by complexity
3. **Balanced Economy**: Higher-level tiles can have higher costs
4. **Content Gating**: Prevents overwhelming new players with complex options
5. **Scalability**: Easy to add new categories and tiles

## Implementation Steps

1. **Database Migration**: Create tile_categories table and update tiles table
2. **API Updates**: Modify tile inventory endpoints to support categories
3. **Frontend Components**: Create category-based tile inventory interface
4. **Level Integration**: Connect user level to category unlocking
5. **Testing**: Verify category unlocking and tile availability
6. **Documentation**: Update user guides and tooltips

## Future Enhancements

- **Category-specific quests**: Special quests that unlock when reaching new categories
- **Category achievements**: Rewards for using tiles from each category
- **Category themes**: Visual themes for each category
- **Category challenges**: Special building challenges for each category 