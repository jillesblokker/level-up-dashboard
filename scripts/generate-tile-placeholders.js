const fs = require('fs');
const path = require('path');
const { createCanvas } = require('canvas');

const TILE_SIZE = 64;
const TILES_DIR = path.join(__dirname, '../public/images/tiles');

// Ensure tiles directory exists
if (!fs.existsSync(TILES_DIR)) {
  fs.mkdirSync(TILES_DIR, { recursive: true });
}

// List of missing tiles
const missingTiles = [
  'road-tile',
  'corner-road-tile',
  'crossroad-tile',
  'snow-tile',
  'portal-tile',
  'village-tile'
];

// Generate placeholder for each missing tile
missingTiles.forEach(tileName => {
  const canvas = createCanvas(TILE_SIZE, TILE_SIZE);
  const ctx = canvas.getContext('2d');

  // Fill background
  ctx.fillStyle = '#4a5568';
  ctx.fillRect(0, 0, TILE_SIZE, TILE_SIZE);

  // Add border
  ctx.strokeStyle = '#2d3748';
  ctx.lineWidth = 2;
  ctx.strokeRect(2, 2, TILE_SIZE - 4, TILE_SIZE - 4);

  // Add text
  ctx.fillStyle = '#ffffff';
  ctx.font = '12px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(tileName.replace('-tile', ''), TILE_SIZE / 2, TILE_SIZE / 2);

  // Save the image
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(path.join(TILES_DIR, `${tileName}.png`), buffer);
  console.log(`Generated ${tileName}.png`);
}); 