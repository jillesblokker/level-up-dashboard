# Level Up Dashboard

A Next.js-based game dashboard featuring:

- 🎮 Interactive game requirements tracking
- 🎨 Customizable design system
- 🏰 Kingdom management system
- 🌍 Realm exploration
- 🏘️ City building mechanics
- 👤 Character progression
- ✨ Quest and achievement system
- 💰 Working item purchase system
- 🤝 Community features

## Features

- **Design System**: Fully customizable UI components with interactive color pickers and typography controls
- **Requirements**: Comprehensive game requirements organized in a tabbed interface
- **Kingdom Management**: Statistics tracking and visualization
- **Item System**: Working purchase mechanics with gold management

## Tech Stack

- Next.js 14
- TypeScript
- Tailwind CSS
- Shadcn/ui Components

## Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

## License

MIT

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

4. Mobile Issues:
   - Realm may not load correctly on mobile devices, showing only empty tiles and character
   - City/Town loading can sometimes fail on first attempt
   - Mystery tile events need implementation
   - Achievement modals may not show up consistently

5. Image Loading:
   - Some images may fail to load initially, requiring a refresh
   - Image optimization warnings in development mode

6. Performance:
   - Large maps may cause performance issues on slower devices
   - Initial load time can be slow due to asset loading

## Development Notes

- Next.js 14.1.0
- React 18
- Tailwind CSS for styling
- shadcn/ui for components

## Contributing

Please read the known issues section before submitting PRs. We're actively working on resolving these issues.

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
- Medieval-themed UI components # Production deployment ready - Fri Jul 25 00:13:09 CEST 2025
# Header images loaded and ready for production - Fri Jul 25 00:16:31 CEST 2025
# Force redeploy Tue Aug 19 09:23:37 CEST 2025
