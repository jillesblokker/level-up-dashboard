# Thrivehaven

A fantasy realm building game where you can level up your real-life skills through daily quests and challenges.

## Asset Structure

The project uses a centralized asset management system with the following structure:

```
public/assets/
├── backgrounds/    # Background images and placeholders
├── headers/       # Header and banner images
├── icons/        # UI icons and symbols
└── tiles/        # Game tile SVGs
```

### Managing Assets

- All image paths are managed through `config/image-paths.ts`
- To generate tile SVGs from components, run:
  ```bash
  pnpm generate-tiles
  ```

### Adding New Assets

1. Place new assets in the appropriate directory under `public/assets/`
2. Add the path to `config/image-paths.ts`
3. Import and use the path using the `getImagePath` helper function:
   ```typescript
   import { getImagePath } from "@/config/image-paths";
   
   // Usage
   const imagePath = getImagePath("headers", "castleBanner");
   ```

## Development

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start
```

## Features

- Interactive realm map with various tile types
- Resource management system
- Quest and achievement tracking
- Character progression
- Medieval-themed UI components 