# Level Up Dashboard

A fantasy realm building game with interactive maps, achievements, and quests.

## Current Status

This is a stable version with some known issues that are being worked on:

### Known Issues

1. Map Functionality:
   - City and town locations don't load on the realm map
   - Mystery tile events are not triggering
   - Unable to buy tiles when the stack is completed

2. Achievements:
   - Placement achievement modals work correctly
   - Destroy tile achievement modals are not displaying

3. Image Optimization:
   - Some image loading warnings in development mode
   - Working on migrating from `images.domains` to `images.remotePatterns`

## Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

The application will be available at http://localhost:3001

## Development Notes

- Next.js 14.1.0
- React 18
- Tailwind CSS for styling
- shadcn/ui for components

## Contributing

Please read the known issues section before submitting PRs. We're actively working on resolving these issues.

## License

[Add your license here]

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

## Features

- Interactive realm map with various tile types
- Resource management system
- Quest and achievement tracking
- Character progression
- Medieval-themed UI components 