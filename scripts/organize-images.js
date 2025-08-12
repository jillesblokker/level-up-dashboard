#!/usr/bin/env node

/**
 * Image Organization Script
 * This script helps organize the images folder structure for better maintainability
 */

const fs = require('fs');
const path = require('path');

// Define the new organized structure
const organizedStructure = {
  'public/images': {
    'items': {
      'weapons': {
        'swords': 'sword/*.png',
        'axes': 'sword/*axe*.png',
        'maces': 'sword/*morningstar*.png'
      },
      'defense': {
        'shields': 'shield/*.png',
        'armor': 'armor/*.png'
      },
      'mounts': {
        'horses': 'horse/*.png'
      },
      'consumables': {
        'potions': 'potion/*.png',
        'scrolls': 'scroll/*.png'
      },
      'artifacts': {
        'rings': 'artifact/ring/*.png',
        'crowns': 'artifact/crown/*.png',
        'scepters': 'artifact/scepter/*.png',
        'thrones': 'artifact/throne/*.png',
        'robes': 'artifact/robe/*.png'
      },
      'materials': {
        'wood': 'materials/*.png'
      },
      'food': {
        'fish': 'food/*.png'
      }
    },
    'tiles': 'tiles/*.png',
    'characters': 'character/*.png',
    'locations': 'locations/*.png',
    'kingdom': 'kingdom-tiles/*.png',
    'creatures': 'creatures/*.png',
    'achievements': 'achievements/*.png',
    'monsters': 'Monsters/*.png',
    'animals': 'Animals/*.png',
    'encounters': 'encounters/*.png',
    'notifications': 'Notifications/*.png',
    'placeholders': 'placeholders/*.png'
  }
};

// Function to create directory if it doesn't exist
function ensureDirectoryExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`✅ Created directory: ${dirPath}`);
  }
}

// Function to get file size in human readable format
function getFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
}

// Function to analyze current folder structure
function analyzeCurrentStructure() {
  console.log('🔍 Analyzing current image folder structure...\n');
  
  const basePath = 'public/images';
  if (!fs.existsSync(basePath)) {
    console.log('❌ Base images directory not found');
    return;
  }

  const items = fs.readdirSync(basePath);
  let totalSize = 0;
  let totalFiles = 0;

  items.forEach(item => {
    const itemPath = path.join(basePath, item);
    const stats = fs.statSync(itemPath);
    
    if (stats.isDirectory()) {
      const subItems = fs.readdirSync(itemPath);
      console.log(`📁 ${item}/ (${subItems.length} items)`);
      
      subItems.forEach(subItem => {
        const subItemPath = path.join(itemPath, subItem);
        const subStats = fs.statSync(subItemPath);
        
        if (subStats.isDirectory()) {
          const subSubItems = fs.readdirSync(subItemPath);
          console.log(`  📁 ${subItem}/ (${subSubItems.length} items)`);
          
          subSubItems.forEach(subSubItem => {
            const subSubItemPath = path.join(subItemPath, subSubItem);
            const subSubStats = fs.statSync(subSubItemPath);
            if (subSubStats.isFile()) {
              totalSize += subSubStats.size;
              totalFiles++;
              console.log(`    📄 ${subSubItem} (${getFileSize(subSubStats.size)})`);
            }
          });
        } else if (subStats.isFile()) {
          totalSize += subStats.size;
          totalFiles++;
          console.log(`  📄 ${subItem} (${getFileSize(subStats.size)})`);
        }
      });
    } else if (stats.isFile()) {
      totalSize += stats.size;
      totalFiles++;
      console.log(`📄 ${item} (${getFileSize(stats.size)})`);
    }
  });

  console.log(`\n📊 Summary:`);
  console.log(`   Total files: ${totalFiles}`);
  console.log(`   Total size: ${getFileSize(totalSize)}`);
}

// Function to suggest improvements
function suggestImprovements() {
  console.log('\n💡 Suggested Improvements:\n');
  
  console.log('1. 📁 Create dedicated subcategories:');
  console.log('   - weapons/swords/ (for all sword types)');
  console.log('   - weapons/axes/ (for axe weapons)');
  console.log('   - defense/shields/ (for all shields)');
  console.log('   - defense/armor/ (for all armor)');
  
  console.log('\n2. 🏷️ Standardize naming conventions:');
  console.log('   - Use kebab-case for all files');
  console.log('   - Include type prefix (sword-, shield-, armor-)');
  console.log('   - Include rarity suffix for variations');
  
  console.log('\n3. 📝 Add metadata files:');
  console.log('   - items.json (for item definitions)');
  console.log('   - categories.json (for category mappings)');
  console.log('   - README.md (for folder organization)');
  
  console.log('\n4. 🔍 Implement search and filtering:');
  console.log('   - By item type (weapon, armor, etc.)');
  console.log('   - By rarity (common, rare, epic, legendary)');
  console.log('   - By stats (attack, defense, etc.)');
}

// Function to create README for images folder
function createImagesReadme() {
  const readmeContent = `# Images Folder Organization

This folder contains all the visual assets for the Level Up game.

## 📁 Folder Structure

### Items
- **weapons/** - All weapon types (swords, axes, maces)
- **defense/** - Shields and armor
- **mounts/** - Horses and other mounts
- **consumables/** - Potions, scrolls, and other consumables
- **artifacts/** - Rings, crowns, scepters, thrones, robes
- **materials/** - Building materials and resources
- **food/** - Food items and consumables

### Game Elements
- **tiles/** - Realm and kingdom tiles
- **characters/** - Character sprites and portraits
- **locations/** - Location-specific images
- **kingdom/** - Kingdom-specific tiles and elements
- **creatures/** - Creature sprites and images
- **achievements/** - Achievement icons and badges
- **monsters/** - Monster sprites and images
- **animals/** - Animal sprites and images
- **encounters/** - Encounter-specific images
- **notifications/** - UI notification images
- **placeholders/** - Placeholder images and fallbacks

## 🏷️ Naming Conventions

- Use kebab-case for all files
- Include type prefix (e.g., sword-, shield-, armor-)
- Include descriptive names (e.g., iron-sword, magic-shield)
- Use consistent file extensions (.png for sprites, .jpg for backgrounds)

## 📊 File Types

- **PNG**: Sprites, icons, UI elements (with transparency)
- **JPG**: Backgrounds, large images (no transparency needed)
- **SVG**: Vector graphics, icons, simple shapes

## 🔧 Adding New Images

1. Place images in the appropriate category folder
2. Follow the naming convention
3. Optimize images for web use
4. Update this README if adding new categories
5. Consider adding metadata for game integration

## 📈 Performance Tips

- Compress images appropriately
- Use WebP format when possible
- Implement lazy loading for large images
- Consider sprite sheets for multiple small images
`;

  const readmePath = 'public/images/README.md';
  fs.writeFileSync(readmePath, readmeContent);
  console.log(`✅ Created README: ${readmePath}`);
}

// Main execution
function main() {
  console.log('🚀 Image Organization Script\n');
  
  analyzeCurrentStructure();
  suggestImprovements();
  createImagesReadme();
  
  console.log('\n✨ Script completed! Check the README.md file for organization guidelines.');
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = {
  analyzeCurrentStructure,
  suggestImprovements,
  createImagesReadme,
  organizedStructure
};
