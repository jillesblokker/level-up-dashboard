# UX Audit Changelog

All modifications made from the Micro-UX Audit will be tracked here to ensure we can isolate any issues caused by specific changes.

## [2026-06-23] Phase 1: High-Impact / Low-Risk Global Polish

### Changed
- **components/ui/button.tsx**: Added `active:scale-95 transition-all` to global button variants for tactile press feedback.
- **components/ui/dialog.tsx**: Added `bg-zinc-950/80 backdrop-blur-sm` to overlay for a premium glassmorphism effect.
- **components/ui/progress.tsx**: Added `shadow-inner` to the background track for physical depth.
- **app/globals.css**: Added `font-variant-numeric: tabular-nums` to `body` to prevent horizontal jitter on changing numbers.

## [2026-06-23] Phase 2: Component Animations & Feedback

### Changed
- **components/ui/progress.tsx**: Added an `animate-pulse` glow effect to the progress bar indicator when value is >= 90% to trigger completion bias.
- **app/market/page.tsx**: Added staggered `animate-in fade-in slide-in-from-bottom-4` animations to the free chests, premium packs, and materials lists so they cascade in fluidly. Added a subtle purple border highlight to the highest rarity 'crown' pack.
- **app/quests/page.tsx**: Verified that Quests already successfully use `framer-motion` for staggered fade-ins.

## [2026-06-23] Phase 3: Logic & Interaction Fixes

### Changed
- **app/market/page.tsx**: Added a 600ms global debouncing mechanism (`isProcessing` state) to all market purchase and sale buttons (materials and packs) to prevent accidental double clicks and layout jumps.
- **app/market/page.tsx**: Toned down the 'crown' pack animation to a subtle border glow based on feedback.
- **components/add-quest-form.tsx**: Verified that the quick add quest input natively uses the `autoFocus` property to allow immediate typing.
