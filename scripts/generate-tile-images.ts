import fs from 'fs';
import path from 'path';
import { createCanvas, Image } from 'canvas';
import { renderToString } from 'react-dom/server';
import { GrassTile } from '../components/tile-visuals/grass-tile';
import { ForestTile } from '../components/tile-visuals/forest-tile';
import { WaterTile } from '../components/tile-visuals/water-tile';
import { MountainTile } from '../components/tile-visuals/mountain-tile';
import { DesertTile } from '../components/tile-visuals/desert-tile';
import { TownTile } from '../components/tile-visuals/town-tile';
import { CityTile } from '../components/tile-visuals/city-tile';

const tileComponents = {
  grass: GrassTile,
  forest: ForestTile,
  water: WaterTile,
  mountain: MountainTile,
  desert: DesertTile,
  town: TownTile,
  city: CityTile,
} as const;

const outputDir = path.join(process.cwd(), 'public', 'images', 'tiles');

// Create output directory if it doesn't exist
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Generate PNG files for each tile
Object.entries(tileComponents).forEach(([name, Component]) => {
  const svg = renderToString(Component({}));
  const canvas = createCanvas(64, 64);
  const ctx = canvas.getContext('2d');
  
  // Draw SVG on canvas
  const img = new Image();
  img.onload = () => {
    ctx.drawImage(img, 0, 0);
    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(path.join(outputDir, `${name}-tile.png`), buffer);
    console.log(`Generated ${name}-tile.png`);
  };
  img.src = `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
}); 