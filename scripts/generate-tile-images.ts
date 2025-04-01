import fs from 'fs';
import path from 'path';
import { createCanvas } from 'canvas';
import { renderToString } from 'react-dom/server';
import { GrassTile } from '../app/components/tile-visuals/grass-tile';
import { ForestTile } from '../app/components/tile-visuals/forest-tile';
import { WaterTile } from '../app/components/tile-visuals/water-tile';
import { MountainTile } from '../app/components/tile-visuals/mountain-tile';
import { DesertTile } from '../app/components/tile-visuals/desert-tile';
import { TownTile } from '../app/components/tile-visuals/town-tile';
import { CityTile } from '../app/components/tile-visuals/city-tile';

const tileComponents = {
  grass: GrassTile,
  forest: ForestTile,
  water: WaterTile,
  mountain: MountainTile,
  desert: DesertTile,
  town: TownTile,
  city: CityTile,
};

const outputDir = path.join(process.cwd(), 'public', 'images', 'tiles');

// Create output directory if it doesn't exist
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Generate PNG files for each tile
Object.entries(tileComponents).forEach(([name, Component]) => {
  const svg = renderToString(<Component />);
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