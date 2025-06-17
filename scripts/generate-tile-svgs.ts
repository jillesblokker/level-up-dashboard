import fs from 'fs';
import path from 'path';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

// Import all tile components
import { GrassTile } from '../components/tile-visuals/grass-tile';
import { ForestTile } from '../components/tile-visuals/forest-tile';
import { MountainTile } from '../components/tile-visuals/mountain-tile';
import { WaterTile } from '../components/tile-visuals/water-tile';
import { DesertTile } from '../components/tile-visuals/desert-tile';
import { SnowTile } from '../components/tile-visuals/snow-tile';
import { IceTile } from '../components/tile-visuals/ice-tile';
import { LavaTile } from '../components/tile-visuals/lava-tile';
import { SwampTile } from '../components/tile-visuals/swamp-tile';
import { CityTile } from '../components/tile-visuals/city-tile';
import { TownTile } from '../components/tile-visuals/town-tile';
import { SpecialTile } from '../components/tile-visuals/special-tile';

const tileComponents = {
  grass: () => React.createElement(GrassTile),
  forest: () => React.createElement(ForestTile),
  mountain: () => React.createElement(MountainTile),
  water: () => React.createElement(WaterTile),
  desert: () => React.createElement(DesertTile),
  snow: () => React.createElement(SnowTile),
  ice: () => React.createElement(IceTile),
  lava: () => React.createElement(LavaTile),
  swamp: () => React.createElement(SwampTile),
  city: () => React.createElement(CityTile),
  town: () => React.createElement(TownTile),
  special: () => React.createElement(SpecialTile),
};

const outputDir = path.join(process.cwd(), 'public', 'assets', 'tiles');

// Create output directory if it doesn't exist
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Generate SVG files for each tile
Object.entries(tileComponents).forEach(([name, renderComponent]) => {
  const svg = renderToStaticMarkup(renderComponent());
  const filePath = path.join(outputDir, `${name}.svg`);
  fs.writeFileSync(filePath, svg);
  console.log(`Generated ${name}.svg`);
}); 