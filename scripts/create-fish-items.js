#!/usr/bin/env node

/**
 * Fish Items Creation Script
 * This script creates additional fish items for the fisherman
 */

const fs = require('fs');
const path = require('path');

// Fish items to create
const fishItems = [
  {
    name: 'goldenfish',
    displayName: 'Golden Fish',
    description: 'A rare golden fish that provides nourishment and luck',
    rarity: 'rare',
    stats: { health: 30, stamina: 20 },
    cost: 75
  },
  {
    name: 'silverfish',
    displayName: 'Silver Fish',
    description: 'A shimmering silver fish that boosts energy',
    rarity: 'uncommon',
    stats: { health: 20, stamina: 15 },
    cost: 50
  },
  {
    name: 'bronzefish',
    displayName: 'Bronze Fish',
    description: 'A sturdy bronze fish that provides basic sustenance',
    rarity: 'common',
    stats: { health: 15, stamina: 10 },
    cost: 25
  },
  {
    name: 'rainbowfish',
    displayName: 'Rainbow Fish',
    description: 'A colorful fish that grants multiple benefits',
    rarity: 'epic',
    stats: { health: 40, stamina: 25, mana: 10 },
    cost: 120
  },
  {
    name: 'crystalfish',
    displayName: 'Crystal Fish',
    description: 'A crystalline fish that enhances magical abilities',
    rarity: 'legendary',
    stats: { health: 50, stamina: 30, mana: 20 },
    cost: 200
  }
];

// Create fish items in the comprehensive items system
function createFishItems() {
  console.log('🐟 Creating fish items for the fisherman...\n');
  
  // Read the current comprehensive items file
  const comprehensiveItemsPath = 'app/lib/comprehensive-items.ts';
  let content = fs.readFileSync(comprehensiveItemsPath, 'utf8');
  
  // Find the food section
  const foodSectionStart = content.indexOf('  // ==========================================');
  const foodSectionEnd = content.indexOf('];', foodSectionStart);
  
  if (foodSectionStart === -1 || foodSectionEnd === -1) {
    console.log('❌ Could not find food section in comprehensive items');
    return;
  }
  
  // Create new food items content
  let newFoodItems = '';
  fishItems.forEach((fish, index) => {
    newFoodItems += `  {
    id: 'food-${fish.name}',
    name: '${fish.displayName}',
    description: '${fish.description}',
    type: 'food',
    category: 'fish',
    rarity: '${fish.rarity}',
    stats: ${JSON.stringify(fish.stats)},
    emoji: '🐟',
    image: '/images/items/food/fish-${fish.name.replace('fish', '')}.png',
    cost: ${fish.cost},
    isDefault: false,
    isEquippable: false,
    isConsumable: true,
  }`;
    
    if (index < fishItems.length - 1) {
      newFoodItems += ',\n';
    }
  });
  
  // Replace the single food item with multiple fish items
  const oldFoodSection = content.substring(foodSectionStart, foodSectionEnd);
  const newFoodSection = oldFoodSection.replace(
    /  \/\/ ==========================================\n  \/\/ FOOD\n  \/\/ ==========================================\n  \{[\s\S]*?\},?\n  \];/,
    `  // ==========================================\n  // FOOD\n  // ==========================================\n${newFoodItems}\n  ];`
  );
  
  const newContent = content.replace(oldFoodSection, newFoodSection);
  
  // Write the updated content back
  fs.writeFileSync(comprehensiveItemsPath, newContent);
  console.log('✅ Updated comprehensive items with new fish items');
  
  // Update the items metadata JSON
  updateItemsMetadata();
  
  // Update the kingdom tiles to include more fish variety
  updateKingdomTiles();
  
  console.log('\n🎣 Fisherman now has access to multiple fish types!');
}

// Update the items metadata JSON
function updateItemsMetadata() {
  const metadataPath = 'public/images/items/items-metadata.json';
  let metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
  
  // Add new fish items to metadata
  fishItems.forEach(fish => {
    metadata.items[`food-${fish.name}`] = {
      name: fish.displayName,
      type: 'food',
      category: 'fish',
      rarity: fish.rarity,
      stats: fish.stats,
      cost: fish.cost,
      isDefault: false,
      image: `/images/items/food/fish-${fish.name.replace('fish', '')}.png`,
      description: fish.description
    };
  });
  
  // Update total items count
  metadata.metadata.totalItems = Object.keys(metadata.items).length;
  
  fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
  console.log('✅ Updated items metadata JSON');
}

// Update kingdom tiles to include more fish variety
function updateKingdomTiles() {
  const kingdomTilesPath = 'lib/kingdom-tiles.ts';
  let content = fs.readFileSync(kingdomTilesPath, 'utf8');
  
  // Update fisherman tile to include more fish variety
  const fishermanUpdate = content.replace(
    /possibleItems: \[\s*'\/images\/items\/food\/goldenfish\.png',\s*'\/images\/items\/food\/goldenfish\.png',\s*\/\/ More common\s*'\/images\/items\/food\/goldenfish\.png',\s*\/\/ More common\s*'\/images\/items\/food\/goldenfish\.png',\s*\/\/ More common\s*'\/images\/items\/food\/goldenfish\.png'\s*\/\/ More common\s*\],/,
    `possibleItems: [
      '/images/items/food/fish-golden.webp',
      '/images/items/food/fish-silver.webp',
      '/images/items/food/fish-red.webp',
      '/images/items/food/fish-rainbow.webp',
      '/images/items/food/fish-silver.webp'
    ],`
  );
  
  // Update other tiles that also have fish
  const updatedContent = fishermanUpdate.replace(
    /possibleItems: \['\/images\/items\/food\/goldenfish\.png'\],/g,
    `possibleItems: [
      '/images/items/food/fish-golden.webp',
      '/images/items/food/fish-silver.webp',
      '/images/items/food/fish-red.webp'
    ],`
  );
  
  fs.writeFileSync(kingdomTilesPath, updatedContent);
  console.log('✅ Updated kingdom tiles with fish variety');
}

// Create placeholder fish images (copy goldenfish with different names)
function createFishImages() {
  console.log('\n🖼️ Creating fish image placeholders...');
  
  const sourceImage = 'public/images/items/food/fish-golden.webp';
  const targetDir = 'public/images/items/food/';
  
  // Create copies for each fish type
  fishItems.forEach(fish => {
    if (fish.name !== 'goldenfish') {
      const targetPath = path.join(targetDir, `${fish.name}.png`);
      try {
        fs.copyFileSync(sourceImage, targetPath);
        console.log(`✅ Created ${fish.name}.png`);
      } catch (error) {
        console.log(`⚠️ Could not create ${fish.name}.png (using goldenfish as fallback)`);
      }
    }
  });
}

// Main execution
function main() {
  console.log('🎣 Fish Items Creation Script\n');
  
  try {
    createFishImages();
    createFishItems();
    console.log('\n✨ All fish items have been created successfully!');
    console.log('\n📝 Note: You may want to create unique images for each fish type later.');
  } catch (error) {
    console.error('❌ Error creating fish items:', error.message);
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = {
  createFishItems,
  updateItemsMetadata,
  updateKingdomTiles,
  createFishImages,
  fishItems
};
