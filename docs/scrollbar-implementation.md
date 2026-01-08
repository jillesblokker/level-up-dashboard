# Auto-Hiding Scrollbars Implementation

## Overview

Implemented subtle, auto-hiding scrollbars that enhance the UI while maintaining full accessibility.

## Features

### Visual Design

- **Hidden by default** - Scrollbars are transparent when not in use
- **Appear on scroll** - Smoothly fade in when user scrolls
- **Auto-hide** - Fade out 1 second after scrolling stops
- **Subtle appearance** - Amber color at 30% opacity, matching the medieval theme
- **Hover enhancement** - Increases to 50% opacity on hover

### Accessibility

✅ **Keyboard Navigation** - Scrollbars always visible when using keyboard (`:focus-visible`)
✅ **High Contrast Mode** - Increased opacity (60%) for better visibility
✅ **Reduced Motion** - Respects `prefers-reduced-motion` setting
✅ **Assistive Technology** - Full support for screen readers and other AT

## Usage

### Automatic (Global)

All scrollable elements automatically get the auto-hiding behavior via global CSS.

### Manual Control (Advanced)

For custom scroll containers that need programmatic control:

```tsx
import { useAutoHideScrollbar } from '@/hooks/use-auto-hide-scrollbar'

function MyComponent() {
  const scrollRef = useAutoHideScrollbar<HTMLDivElement>()
  
  return (
    <div ref={scrollRef} className="overflow-y-auto h-96">
      {/* Your scrollable content */}
    </div>
  )
}
```

## Technical Details

### CSS Classes

- `.scrolling` - Added while actively scrolling
- `.scroll-fade-out` - Added when fade-out animation starts
- `.mobile-scroll-container` - Thinner scrollbars (6px) for mobile

### Browser Support

- **Webkit** (Chrome, Safari, Edge): Full support via `::-webkit-scrollbar`
- **Firefox**: Full support via `scrollbar-width` and `scrollbar-color`
- **Legacy browsers**: Graceful degradation to standard scrollbars

### Timing

- **Fade-in**: Instant (on scroll start)
- **Fade-out delay**: 1000ms after scroll stops
- **Fade-out duration**: 500ms
- **Transition duration**: 300ms (for hover effects)

## Customization

To adjust the scrollbar appearance, edit `/app/scrollbar-styles.css`:

```css
/* Change color */
::-webkit-scrollbar-thumb {
  background: rgba(YOUR_COLOR, 0.3);
}

/* Change width */
::-webkit-scrollbar {
  width: 10px; /* Default is 8px */
}

/* Change fade-out delay */
/* Edit the timeout in use-auto-hide-scrollbar.ts */
```

## API Error Fix

Also fixed the 405 error when updating quests by adding a PATCH method handler to `/api/quests/[id]/route.ts` that delegates to the existing PUT handler.

## Files Modified

- `/app/layout.tsx` - Import scrollbar styles
- `/app/scrollbar-styles.css` - Global scrollbar styling
- `/hooks/use-auto-hide-scrollbar.ts` - React hook for programmatic control
- `/app/api/quests/[id]/route.ts` - Added PATCH method

## Testing Checklist

- [ ] Scrollbars hidden by default
- [ ] Scrollbars appear when scrolling
- [ ] Scrollbars fade out after 1 second
- [ ] Scrollbars visible on hover
- [ ] Scrollbars visible when using Tab key
- [ ] High contrast mode works
- [ ] Reduced motion respected
- [ ] Quest updates work without 405 errors
