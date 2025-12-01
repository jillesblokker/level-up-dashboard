# Mobile Testing Checklist - Level Up PWA

## 📱 Installation & PWA Features

### iOS (Safari)
- [ ] Visit site in Safari
- [ ] "Add to Home Screen" option appears in share menu
- [ ] App installs successfully
- [ ] App icon appears on home screen with correct castle icon
- [ ] App opens in standalone mode (no browser UI)
- [ ] Status bar color is correct (amber)
- [ ] Splash screen shows correctly

### Android (Chrome)
- [ ] Install prompt appears after 30 seconds
- [ ] "Add to Home Screen" works from menu
- [ ] App installs successfully  
- [ ] App icon appears with correct castle icon
- [ ] App opens in standalone mode
- [ ] Theme color is correct
- [ ] Splash screen shows correctly

## 🎯 Touch Targets & Interactions

### Bottom Navigation
- [ ] All nav items are easily tappable (44x44px minimum)
- [ ] Active state is clearly visible
- [ ] No accidental taps on adjacent items
- [ ] Smooth transitions between pages

### Modals
- [ ] All modals open smoothly
- [ ] Modal content is scrollable
- [ ] Modal buttons are above bottom nav (not hidden)
- [ ] Close button is easily tappable
- [ ] Backdrop dismisses modal correctly
- [ ] No layout shift when keyboard opens

### Forms & Inputs
- [ ] Input fields are easily tappable
- [ ] Keyboard doesn't cover input fields
- [ ] Form submission buttons are accessible
- [ ] Select dropdowns work correctly
- [ ] Date/time pickers work on mobile

### Buttons & Cards
- [ ] All buttons have adequate touch targets
- [ ] Hover states work on touch (or are disabled)
- [ ] Long-press doesn't cause issues
- [ ] Swipe gestures don't conflict with navigation

## 🎨 Layout & Responsiveness

### Portrait Mode
- [ ] All pages render correctly
- [ ] No horizontal scrolling
- [ ] Content fits within viewport
- [ ] Images scale appropriately
- [ ] Text is readable (minimum 16px)

### Landscape Mode
- [ ] Layout adapts correctly
- [ ] Bottom nav behavior is appropriate
- [ ] Modals still work correctly
- [ ] No critical content is hidden

### Different Screen Sizes
- [ ] iPhone SE (375px) - Small phone
- [ ] iPhone 12/13 (390px) - Standard phone
- [ ] iPhone 14 Pro Max (430px) - Large phone
- [ ] iPad Mini (768px) - Small tablet
- [ ] iPad Pro (1024px) - Large tablet

## 🔔 Notifications & Toasts

### Toast Notifications
- [ ] Toasts appear above bottom nav
- [ ] Toasts don't overlap with content
- [ ] Toasts are dismissible
- [ ] Multiple toasts stack correctly
- [ ] Toast animations are smooth

### Push Notifications (if enabled)
- [ ] Permission prompt appears correctly
- [ ] Notifications show with correct icon
- [ ] Notification click opens correct page
- [ ] Badge count updates correctly

## ⚡ Performance

### Loading
- [ ] Initial page load < 3 seconds
- [ ] Navigation between pages is instant
- [ ] Images load progressively
- [ ] No janky scrolling
- [ ] Animations are smooth (60fps)

### Offline Support
- [ ] App loads when offline
- [ ] Cached pages are accessible
- [ ] Appropriate offline message for API calls
- [ ] Service worker updates correctly
- [ ] Background sync works (if applicable)

## 🎮 Core Features

### Quests Page
- [ ] Quest list loads correctly
- [ ] Quest completion toggle works
- [ ] Add quest modal works
- [ ] Edit quest modal works
- [ ] Delete quest confirmation works
- [ ] Category filters work
- [ ] Search/filter is responsive

### Kingdom Page
- [ ] Kingdom grid renders correctly
- [ ] Tiles are tappable
- [ ] Building placement works
- [ ] Zoom/pan gestures work (if applicable)
- [ ] Stats update correctly

### Character Page
- [ ] Character stats display correctly
- [ ] Level progress bar renders
- [ ] Achievements list is scrollable
- [ ] Achievement details modal works

### Milestones
- [ ] Milestone list loads
- [ ] Add milestone works
- [ ] Edit milestone works
- [ ] Delete milestone works
- [ ] Progress tracking updates

## 🔐 Authentication

### Sign In/Up
- [ ] Sign in form works on mobile
- [ ] Keyboard doesn't cover inputs
- [ ] Social auth buttons work
- [ ] Error messages are visible
- [ ] Redirect after auth works

### Session Management
- [ ] Session persists across app restarts
- [ ] Auto-logout works correctly
- [ ] Token refresh works
- [ ] Protected routes redirect correctly

## 🐛 Known Issues to Test

### Specific Scenarios
- [ ] Rapid modal open/close doesn't break UI
- [ ] Rotating device doesn't lose state
- [ ] Switching apps and returning works
- [ ] Low battery mode doesn't break features
- [ ] Slow network doesn't cause errors
- [ ] Form submission during network loss

### Edge Cases
- [ ] Very long quest names
- [ ] Many quests (100+)
- [ ] Empty states (no quests, no achievements)
- [ ] Maximum character level
- [ ] Full kingdom grid

## 📊 Analytics & Monitoring

### Track These Metrics
- [ ] Install rate
- [ ] Bounce rate on mobile
- [ ] Average session duration
- [ ] Most used features
- [ ] Error rates
- [ ] Performance metrics (Core Web Vitals)

## ✅ Final Checks

- [ ] All critical user flows work end-to-end
- [ ] No console errors in production
- [ ] App works on 4G/5G and WiFi
- [ ] App works in different timezones
- [ ] Dark mode works correctly (if applicable)
- [ ] Accessibility features work (screen readers, etc.)

## 🚀 Pre-Launch Checklist

- [ ] All above tests pass
- [ ] Performance score > 90 (Lighthouse)
- [ ] Accessibility score > 90 (Lighthouse)
- [ ] PWA score = 100 (Lighthouse)
- [ ] No critical bugs
- [ ] Analytics tracking works
- [ ] Error logging works
- [ ] Backup/restore tested

---

## 📝 Testing Notes

**Tested By:** _________________  
**Date:** _________________  
**Devices Used:** _________________  
**Issues Found:** _________________  
**Status:** ⬜ Pass | ⬜ Fail | ⬜ Needs Review
