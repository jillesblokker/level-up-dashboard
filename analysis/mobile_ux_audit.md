# Mobile UX/UI Audit - Level Up Dashboard

**Created:** February 2026  
**Auditor:** Antigravity  
**Focus:** Mobile usability, readability, and UX/UI standards

---

## Executive Summary

This audit identifies mobile UX/UI improvements needed across the Level Up Dashboard. The analysis compares pages with better mobile implementations (like the Tasks/Quests page) to those needing work (like the Kingdom page tabs).

---

## 🔴 Critical Issues

### 1. Kingdom Page Tabs - Cramped & Unreadable

**Problem:**  
The Kingdom page uses `grid-cols-4` for tabs with no horizontal scroll. On mobile, this forces all 4 tabs (Thrivehaven, Journey, Inventory, Rewards) into a cramped space where text gets cut off and touch targets are too small.

**Current Code:**

```tsx
<TabsList className="mb-6 w-full grid grid-cols-4">
```

**How It Should Look:**  
Use horizontal scrolling tabs with adequate padding, like the Tasks page does with its view switcher.

**Fix:**

- Use `overflow-x-auto` with `flex` instead of `grid-cols-4`
- Add `flex-shrink-0` to prevent tab squishing
- Minimum touch target of 44px × 44px (Apple HIG)
- Add `scroll-snap` for smooth tab switching

---

### 2. Profile Page Tabs - Hidden Text on Mobile

**Problem:**  
The Profile page also uses `grid-cols-4` with icon+text tabs. On small screens (320-375px width), the text becomes invisible or overlaps.

**Current Code:**

```tsx
<TabsList className="grid w-full grid-cols-4 bg-gray-900 border-amber-800/20">
  <TabsTrigger value="avatar">
    <Camera className="w-4 h-4 mr-2" />
    Avatar  <!-- Text gets cut off on small phones -->
  </TabsTrigger>
```

**Fix:**

- On mobile: Show icons only with a tooltip
- Use responsive classes: `hidden md:inline` for tab labels
- Or use horizontal scroll like Kingdom should

---

### 3. Social/Tavern Page Tabs - 2-Column on Mobile Creates Tall Layout

**Problem:**  
The Social page uses `grid-cols-2 md:grid-cols-4` which is better, but creates a tall 2-row tab layout on mobile that takes up too much vertical space.

**Current Code:**

```tsx
<TabsList className="grid w-full grid-cols-2 md:grid-cols-4 h-auto mb-8">
```

**Fix:**

- Consider horizontal scroll instead of 2-row grid
- Or reduce padding on mobile to fit all 4 tabs in one row
- Add `py-2` instead of `py-3` on mobile

---

## 🟡 Medium Priority Issues

### 4. Touch Target Sizes Too Small

**Problem:**  
Many interactive elements have touch targets smaller than the recommended 44px minimum.

**Examples:**

- Tab triggers: Currently `h-10` (40px) - slightly below recommended
- Bottom nav icons: `min-w-[56px]` is good, but vertical height is small
- Dropdown menu items
- Small buttons in cards

**Fix:**

- Increase minimum heights to `min-h-[44px]`
- Add extra padding on mobile using responsive classes
- Use `touch-manipulation` to prevent delays

---

### 5. Bottom Navigation Overlap with Content

**Problem:**  
Pages have `pb-20 md:pb-0` but some content still gets hidden behind the bottom nav. The fixed bottom nav takes up approximately 60-70px but `pb-20` is only 80px, leaving minimal margin.

**Current Bottom Nav Code:**

```tsx
<nav className="lg:landscape:hidden fixed bottom-0 left-0 right-0 z-50...">
  style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 0.5rem)' }}
```

**Fix:**

- Increase padding-bottom to `pb-24` (96px)
- Use `scroll-padding-bottom` for smooth anchor scrolling
- Consider sticky vs fixed bottom nav for certain pages

---

### 6. Text Truncation Without Indication

**Problem:**  
Long text (usernames, quest names, email addresses) gets truncated without ellipsis or scroll indication.

**Example - Profile Page:**

```tsx
<Badge className="truncate max-w-[calc(100vw-8rem)]">
  {user?.primaryEmailAddress?.emailAddress}
</Badge>
```

**Fix:**

- Always use `text-ellipsis` with `overflow-hidden`
- Consider adding tooltip on truncated text
- Allow horizontal scroll for important identifiers

---

### 7. Modal Dialogs Not Optimized for Mobile

**Problem:**  
Some modals (quest creation, edit forms) use fixed widths like `max-w-md` which can overflow on small screens or leave too little margin.

**Fix:**

- Use `max-w-[calc(100vw-2rem)]` or `w-[92vw]` for mobile
- Add `overflow-y-auto` with `max-h-[85vh]`
- Ensure close button is always accessible

---

### 8. Form Inputs - Small on Mobile

**Problem:**  
Input fields maintain desktop sizing on mobile, making them hard to tap and read.

**Fix:**

- Increase font size to `text-base` (16px) on inputs to prevent iOS zoom
- Add `min-h-[44px]` to all form controls
- Increase padding to `px-4 py-3`

---

## 🟢 Good Practices to Replicate

### Tasks/Quests Page - View Switcher ✅

The "Three Pillars" view switcher is a good example of mobile-friendly tabs:

```tsx
<div className="flex bg-gray-950/60 p-1.5 rounded-2xl border border-amber-900/20 mb-6 w-full md:w-auto overflow-x-auto">
  <button className="whitespace-nowrap px-4 md:px-6 py-3...">
```

**What's Good:**

- `overflow-x-auto` allows horizontal scroll
- `whitespace-nowrap` preserves button text
- Responsive padding: `px-4 md:px-6`
- Adequate tap target: `py-3` (12px padding = ~44px with text)

---

### Mobile Layout Wrapper ✅

The existing `MobileLayoutWrapper` component has great fundamentals:

```tsx
style={{
  minHeight: isMobile ? viewportHeight : '100vh',
  WebkitOverflowScrolling: 'touch',
  overscrollBehavior: 'contain',
  '--touch-target-size': '44px',
}}
```

**What's Good:**

- Dynamic viewport height calculation
- Native-like scrolling on iOS
- Prevents overscroll bounce artifacts
- CSS variables for consistent touch targets

---

### Bottom Nav ✅

The bottom nav is well-designed for mobile:

```tsx
<Link className="min-w-[56px] px-2 py-1 touch-manipulation"...>
  <Icon className="w-6 h-6 mb-1" />
  <span className="text-[10px]">Label</span>
</Link>
```

**What's Good:**

- Touch target larger than minimum
- `touch-manipulation` for instant response
- Clear icon + tiny label pattern
- Safe area handling

---

## 📋 Improvement Plan

### Phase 1: Critical Fixes (High Impact, Low Effort)

| Issue | Page | Fix | Priority |
|-------|------|-----|----------|
| Cramped tabs | Kingdom | Add horizontal scroll | 🔴 High |
| Tab text cut-off | Profile | Icon-only on mobile | 🔴 High |
| Touch targets | Global | Add `min-h-[44px]` to TabsTrigger | 🔴 High |

### Phase 2: Medium Priority (Improved UX)

| Issue | Page | Fix | Priority |
|-------|------|-----|----------|
| Bottom nav overlap | All pages | Increase `pb-24` | 🟡 Medium |
| Modal overflow | Various | Responsive max-width | 🟡 Medium |
| Form input sizing | All forms | 16px font, larger padding | 🟡 Medium |
| Social tabs height | Tavern | Single-row scroll or compact padding | 🟡 Medium |

### Phase 3: Polish

| Issue | Page | Fix | Priority |
|-------|------|-----|----------|
| Text truncation | Various | Ellipsis + tooltips | 🟢 Low |
| Scroll indicators | Tab areas | Add fade edges | 🟢 Low |
| Focus states | All | Visible focus rings | 🟢 Low |

---

## Specific Code Changes Needed

### 1. Update `TabsList` Base Component

**File:** `components/ui/tabs.tsx`

Change the default TabsList from rigid grid to flexible scroll:

```tsx
// FROM:
"inline-flex h-10 items-center justify-center rounded-md bg-gray-900..."

// TO:
"inline-flex h-auto min-h-[44px] items-center rounded-md bg-gray-900 overflow-x-auto scroll-smooth snap-x snap-mandatory gap-1 px-1..."
```

---

### 2. Update `TabsTrigger` Base Component

**File:** `components/ui/tabs.tsx`

Add mobile-friendly defaults:

```tsx
// FROM:
"inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm..."

// TO:
"inline-flex items-center justify-center whitespace-nowrap rounded-lg px-3 md:px-4 py-2 md:py-2.5 text-sm min-h-[40px] md:min-h-[44px] snap-start flex-shrink-0 touch-manipulation..."
```

---

### 3. Update Kingdom Page Tabs

**File:** `app/kingdom/kingdom-client.tsx`

```tsx
// FROM:
<TabsList className="mb-6 w-full grid grid-cols-4">

// TO:
<TabsList className="mb-6 w-full flex overflow-x-auto pb-1 justify-start md:justify-center gap-1">
  <TabsTrigger value="thrivehaven" className="flex-shrink-0 min-w-max">
  ...
```

---

### 4. Update Profile Page Tabs

**File:** `app/profile/page.tsx`

```tsx
// FROM:
<TabsTrigger value="avatar">
  <Camera className="w-4 h-4 mr-2" />
  Avatar
</TabsTrigger>

// TO:
<TabsTrigger value="avatar">
  <Camera className="w-4 h-4 md:mr-2" />
  <span className="hidden md:inline">Avatar</span>
</TabsTrigger>
```

---

### 5. Global Touch Target Enhancement

**File:** `app/styles/globals.css`

Add to the mobile responsive section:

```css
@media (max-width: 768px) {
  /* Ensure minimum touch targets */
  button, 
  [role="button"],
  .touch-target,
  [data-radix-tab-trigger] {
    min-height: 44px;
    min-width: 44px;
  }
  
  /* Better form inputs on mobile */
  input, textarea, select {
    font-size: 16px !important; /* Prevent iOS zoom */
    min-height: 44px;
  }
  
  /* Enhanced bottom padding for bottom nav */
  .pb-nav-safe {
    padding-bottom: calc(env(safe-area-inset-bottom) + 96px);
  }
}
```

---

### 6. Add Horizontal Scroll Indicator

**File:** `app/styles/globals.css`

```css
/* Fade edges to indicate scrollable content */
.scroll-horizontal-fade {
  mask-image: linear-gradient(
    to right,
    transparent,
    black 10px,
    black calc(100% - 10px),
    transparent
  );
  -webkit-mask-image: linear-gradient(
    to right,
    transparent,
    black 10px,
    black calc(100% - 10px),
    transparent
  );
}

/* Only show fade when scrollable */
.scroll-horizontal-fade:not(:hover) {
  scrollbar-width: none;
}
.scroll-horizontal-fade:not(:hover)::-webkit-scrollbar {
  display: none;
}
```

---

## Testing Checklist

After implementing fixes, verify:

- [ ] Kingdom tabs scrollable horizontally on 375px screen
- [ ] All tab triggers meet 44px minimum touch target
- [ ] Profile tab icons visible, labels hidden on mobile
- [ ] No content hidden behind bottom navigation
- [ ] Form inputs don't trigger iOS zoom
- [ ] Modals don't overflow screen width
- [ ] Text truncates with ellipsis where needed
- [ ] Horizontal scroll indicators visible on scrollable areas

---

## Device Testing Matrix

Test on these viewport sizes:

| Device | Width | Priority |
|--------|-------|----------|
| iPhone SE | 375px | 🔴 Critical |
| iPhone 14 | 390px | 🔴 Critical |
| iPhone 14 Plus | 428px | 🟡 High |
| iPad Mini | 744px | 🟡 High |
| iPad Pro | 1024px | 🟢 Medium |

---

## Summary

The app has a solid foundation with components like `MobileLayoutWrapper` and a well-designed bottom nav. However, the tab navigation across Kingdom, Profile, and Social pages needs work to match the good patterns already used in the Tasks page.

**Key Actions:**

1. Replace `grid-cols-4` with horizontal scroll flexbox for tabs
2. Add responsive icon-only labels
3. Ensure 44px minimum touch targets globally
4. Increase bottom padding for fixed navigation
5. Use 16px font on inputs to prevent iOS zoom

These changes will significantly improve the mobile experience while maintaining the existing desktop layout.
