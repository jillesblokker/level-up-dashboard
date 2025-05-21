const sharp = require('sharp');
const path = require('path');

const inputPath = path.join(__dirname, '../public/icons/thrivehaven_fav.png');
const outputPath = path.join(__dirname, '../public/icons/thrivehaven_fav_optimized.png');

async function optimizeFavicon() {
  try {
    await sharp(inputPath)
      .resize(32, 32) // Standard favicon size
      .png({ quality: 80 }) // Good quality with compression
      .toFile(outputPath);
    
    console.log('Favicon optimized successfully!');
  } catch (error) {
    console.error('Error optimizing favicon:', error);
  }
}

optimizeFavicon(); 