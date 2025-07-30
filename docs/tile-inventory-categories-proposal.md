# Tile Inventory Categories Proposal

## Overview
Divide the tile inventory into 5 level-based categories to provide progression incentives and organize tiles logically by complexity and cost.

## Category Structure

### Level 0-20: "Foundation Tiles"
**Theme**: Basic terrain and natural elements
**Tiles Available**:
- Grass (Basic terrain - 100 gold)
- Forest (Natural environment - 100 gold)
- Mountain (Elevated terrain - 100 gold)
- Water (Liquid elements - 100 gold)

**Unlock Condition**: Available from start
**Purpose**: Teach basic tile placement and grid mechanics

### Level 20-40: "Settlement Tiles"
**Theme**: Small communities and basic infrastructure
**Tiles Available**:
- Town (Small settlement - 200 gold)
- City (Larger settlement - 300 gold)
- Desert (Arid terrain - 100 gold)
- Ice (Frozen terrain - 100 gold)

**Unlock Condition**: Level 20
**Purpose**: Introduce economic and social elements

### Level 40-60: "Development Tiles"
**Theme**: Advanced infrastructure and specialized buildings
**Tiles Available**:
- Castle (Defensive structure - 500 gold)
- Dungeon (Underground facility - 400 gold)
- Portal Entrance (Transportation - 250 gold)
- Portal Exit (Transportation - 250 gold)

**Unlock Condition**: Level 40
**Purpose**: Add strategic and specialized gameplay elements

### Level 60-80: "Advanced Tiles"
**Theme**: Complex structures and magical elements
**Tiles Available**:
- Volcano (Natural hazard - 500 gold)
- Lava (Magical terrain - 200 gold)
- Cave (Underground exploration - 200 gold)
- Snow (Frozen environment - 125 gold)

**Unlock Condition**: Level 60
**Purpose**: Introduce magical and advanced gameplay mechanics

### Level 80-100: "Legendary Tiles"
**Theme**: Epic structures and unique features
**Tiles Available**:
- Mystery (Unknown tile - 300 gold)
- Special (Unique tile - Variable cost)
- Treasure (Reward tile - Variable cost)
- Monster (Dangerous tile - Variable cost)

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