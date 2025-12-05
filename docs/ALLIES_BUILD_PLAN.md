# Allies Enhancement Build Plan

## 🎯 Project Overview
Enhance the Allies feature with achievements, gifting, visual improvements, and better notifications.

---

## 📋 Feature Breakdown & Implementation Order

### **Phase 1: Foundation & Data Structure** (Day 1)
Core infrastructure needed for all features.

#### 1.1 Database Schema Updates
**File:** `migrations/allies-enhancements.sql`

**Tasks:**
- [ ] Create `alliance_achievements` table
  - `id`, `user_id`, `achievement_type`, `unlocked_at`, `progress`
  - Achievement types: `first_friend`, `five_friends`, `ten_friends`, `first_quest_sent`, `five_quests_sent`, `ten_quests_sent`
- [ ] Create `gifts` table
  - `id`, `sender_id`, `recipient_id`, `item_type`, `item_id`, `amount`, `status`, `message`, `created_at`, `claimed_at`
  - Status: `pending`, `claimed`, `rejected`
- [ ] Add `title` column to `character_stats` if not exists
- [ ] Add `last_seen` column to track user activity for status indicators
- [ ] Add RLS policies for new tables

#### 1.2 Achievement System Core
**File:** `lib/achievement-manager.ts`

**Tasks:**
- [ ] Create `AchievementManager` class
  - `checkAndUnlock(userId, achievementType)` - Check progress and unlock
  - `getProgress(userId, achievementType)` - Get current progress
  - `getAllAchievements(userId)` - Get all user achievements
- [ ] Define achievement definitions with metadata:
  - Icon, title, description, requirement
  - Rewards (XP, gold, special title unlock)

---

### **Phase 2: Achievements Implementation** (Day 2)

#### 2.1 Backend - Achievement Tracking
**Modified Files:**
- `app/api/friends/route.ts` (POST endpoint)
- `app/api/friends/[id]/route.ts` (PUT endpoint - accept friend)
- `app/api/quests/friend/route.ts` (POST endpoint)

**Tasks:**
- [ ] Add achievement check when friend request is accepted
  - Increment friend count for both users
  - Unlock `first_friend`, `five_friends`, `ten_friends` as needed
- [ ] Add achievement check when friend quest is sent
  - Increment quest sent count
  - Unlock `first_quest_sent`, `five_quests_sent`, `ten_quests_sent`
- [ ] Create notification when achievement is unlocked

#### 2.2 Frontend - Achievement Display
**New Files:**
- `components/achievement-toast.tsx` - Animated toast for unlocked achievements
- `components/achievements-modal.tsx` - View all achievements

**Modified Files:**
- `app/allies/page.tsx` - Add achievements button and modal

**Tasks:**
- [ ] Create achievement unlock animation (confetti + sound)
- [ ] Create achievements modal showing:
  - Locked achievements (with progress bar)
  - Unlocked achievements (highlighted)
  - Rewards received
- [ ] Add "Achievements" button to Allies page header
- [ ] Integrate achievement toast notifications

---

### **Phase 3: Friend Titles & Status** (Day 3)

#### 3.1 Display Friend Titles
**Modified Files:**
- `app/api/friends/route.ts` (GET endpoint)
- `app/allies/page.tsx`

**Tasks:**
- [ ] Update GET `/api/friends` to fetch `character_stats.title` for each friend
- [ ] Add title to `Friend` interface
- [ ] Display title below username on ally cards
  - Show with special styling (medieval font, gold color)
  - Add tooltip if title is long

#### 3.2 Status Indicators
**Backend:**
- `app/api/friends/route.ts` - Include `last_seen` in response
- Auto-update `last_seen` on user activity (middleware or API calls)

**Frontend:**
- `app/allies/page.tsx`

**Tasks:**
- [ ] Add `last_seen` to Friend interface
- [ ] Create status indicator component:
  - 🟢 Green: Online (active in last 5 minutes)
  - 🟡 Yellow: Active today (within 24 hours)
  - ⚫ Gray: Inactive (3+ days)
- [ ] Add pulsing animation for online status
- [ ] Display relative time on hover ("Last seen 2 hours ago")

---

### **Phase 4: Messenger Ravens & Notifications** (Day 4)

#### 4.1 Themed Notification System
**New Files:**
- `components/messenger-raven.tsx` - Animated raven component
- `components/notification-types/friend-request-raven.tsx`
- `components/notification-types/quest-received-scroll.tsx`
- `components/notification-types/quest-completed-herald.tsx`

**Tasks:**
- [ ] Create raven animation (flies across screen from right to left)
- [ ] Create scroll animation (unfurls from top)
- [ ] Create herald animation (banner slides down)
- [ ] Add medieval sound effects (wing flaps, scroll unfurl, trumpet)

#### 4.2 Quest Completion Notifications
**Backend:**
- `app/api/quests/complete/route.ts` (or wherever quest completion happens)

**Tasks:**
- [ ] When friend quest is completed, create notification:
  - Type: `friend_quest_completed`
  - Data: `{ questTitle, completedBy, completedAt }`
  - Send to the quest sender
- [ ] Update notification center to handle new type

**Frontend:**
- `components/notification-center.tsx`

**Tasks:**
- [ ] Render quest completion notifications with herald theme
- [ ] Show quest title and completion time
- [ ] Add "View Stats" button to see friend's progress

---

### **Phase 5: Visual Enhancements** (Day 5)

#### 5.1 Animated Comparisons
**Modified Files:**
- `app/allies/page.tsx` (Compare Modal)

**Tasks:**
- [ ] Add entrance animations to compare modal:
  - Modal fades in with scale effect
  - Avatar cards slide in from left and right
  - "VS" text pulses
- [ ] Animate progress bars:
  - Bars animate from 0 to actual value over 1 second
  - Use spring animation for natural feel
  - Stagger animation for each category (0.1s delay between each)
- [ ] Add crown icon to leader in each stat
- [ ] Add sparkle particles around winning stats
- [ ] Optional: Add sound effect when modal opens (medieval fanfare)

#### 5.2 Quest Preview Cards
**New Files:**
- `components/quest-preview-card.tsx`

**Modified Files:**
- `app/allies/page.tsx` (Send Quest Modal)

**Tasks:**
- [ ] Create live preview card showing:
  - Quest title (with medieval scroll background)
  - Difficulty (⚔️⚔️⚔️ sword icons)
  - Category icon with color-coded background
  - Rewards (XP and Gold with icons)
  - Estimated time (if difficulty-based)
- [ ] Update as user types
- [ ] Add "Epic Quest" banner for high XP quests (100+)
- [ ] Add shine/shimmer effect on preview card

---

### **Phase 6: Gifting System** (Day 6-7)

#### 6.1 Backend - Gift Management
**New Files:**
- `app/api/gifts/route.ts` (GET - list gifts, POST - send gift)
- `app/api/gifts/[id]/route.ts` (PUT - claim gift, DELETE - reject)

**Tasks:**
- [ ] GET `/api/gifts` - List pending and claimed gifts
  - Filter by recipient_id
  - Include sender details from Clerk
- [ ] POST `/api/gifts` - Send gift
  - Validate sender has the item/gold
  - Create gift record
  - Create notification for recipient
  - Deduct from sender's inventory
- [ ] PUT `/api/gifts/[id]` - Claim gift
  - Verify recipient owns gift
  - Add to recipient's inventory
  - Update status to `claimed`
  - Create "gift claimed" notification for sender
- [ ] DELETE `/api/gifts/[id]` - Reject gift (optional)

#### 6.2 Inventory System (if not exists)
**New Files (if needed):**
- `app/api/inventory/route.ts` - Get user inventory
- `app/api/inventory/items/route.ts` - List available items

**Tasks:**
- [ ] Create inventory table if needed:
  - `user_id`, `item_type`, `item_id`, `quantity`
  - Item types: `gold`, `creature`, `title`, `power_up`, `badge`
- [ ] Seed some giftable items:
  - Gold (transferable)
  - Creature companions (from existing creatures)
  - Titles (special unlockable ones)
  - Power-ups (XP boost, gold multiplier)

#### 6.3 Frontend - Gift Sending
**New Files:**
- `components/gift-modal.tsx` - Send gift interface
- `components/gift-card.tsx` - Display individual gift

**Modified Files:**
- `app/allies/page.tsx` - Add "Send Gift" button to ally cards

**Tasks:**
- [ ] Create gift modal:
  - Select item type
  - Select specific item (with preview)
  - Add optional message (max 200 chars)
  - Show recipient confirmation
- [ ] Add gift animation on send (package flies away)
- [ ] Add validation (can't gift what you don't have)

#### 6.4 Frontend - Gift Receiving
**New Files:**
- `components/gifts-inbox.tsx` - View received gifts
- `components/gift-opening-animation.tsx` - Unwrap animation

**Tasks:**
- [ ] Create gifts inbox (accessible from NotificationCenter)
- [ ] Show pending gifts with:
  - Sender info
  - Item preview (wrapped gift box)
  - Message
  - Accept/Reject buttons
- [ ] Create gift opening animation:
  - Box opens with particle effects
  - Item revealed with shine
  - Confetti/sparkles
  - Sound effect
- [ ] Update inventory after claiming

---

## 🗂️ Files to Create

### New Files
```
migrations/
  └── allies-enhancements.sql

lib/
  └── achievement-manager.ts

components/
  ├── achievement-toast.tsx
  ├── achievements-modal.tsx
  ├── messenger-raven.tsx
  ├── quest-preview-card.tsx
  ├── gift-modal.tsx
  ├── gift-card.tsx
  ├── gifts-inbox.tsx
  └── gift-opening-animation.tsx
  └── notification-types/
      ├── friend-request-raven.tsx
      ├── quest-received-scroll.tsx
      └── quest-completed-herald.tsx

app/api/
  ├── gifts/
  │   ├── route.ts
  │   └── [id]/route.ts
  └── inventory/
      ├── route.ts
      └── items/route.ts

public/sounds/ (optional)
  ├── raven-wings.mp3
  ├── scroll-unfurl.mp3
  ├── achievement-unlock.mp3
  └── gift-open.mp3
```

### Modified Files
```
app/api/
  ├── friends/route.ts
  ├── friends/[id]/route.ts
  └── quests/friend/route.ts

app/
  └── allies/page.tsx

components/
  └── notification-center.tsx
```

---

## 🎨 Design Assets Needed

### Images
- [ ] Achievement badges (6 icons for each achievement)
- [ ] Raven sprite/animation frames
- [ ] Scroll texture/background
- [ ] Gift box (wrapped and unwrapped states)
- [ ] Crown icon for stat leader
- [ ] Status indicator dots (green, yellow, gray)

### Animations
- [ ] Raven flight path (CSS/Framer Motion)
- [ ] Scroll unfurl (CSS animation)
- [ ] Gift box opening (Framer Motion)
- [ ] Sparkle/confetti particles
- [ ] Progress bar fill animation

### Sounds (Optional)
- [ ] Raven wings flapping
- [ ] Scroll unfurling
- [ ] Achievement unlock fanfare
- [ ] Gift opening chime
- [ ] Herald trumpet

---

## 🧪 Testing Checklist

### Achievements
- [ ] First friend achievement unlocks correctly
- [ ] Progress shows correctly before unlock
- [ ] Multiple achievements can unlock simultaneously
- [ ] Achievement notifications don't spam
- [ ] Achievements persist after refresh

### Gifting
- [ ] Can't gift items you don't have
- [ ] Gift appears in recipient's inbox
- [ ] Claiming gift updates inventory correctly
- [ ] Sender gets notified when gift is claimed
- [ ] Can't claim same gift twice

### Notifications
- [ ] Raven animation plays smoothly
- [ ] Quest completion notification appears for sender
- [ ] Notifications don't stack incorrectly
- [ ] All notification types render correctly

### Status Indicators
- [ ] Status updates in real-time
- [ ] Last seen time is accurate
- [ ] Different colors show for different states

### Visual Enhancements
- [ ] Animations perform well on mobile
- [ ] Progress bars animate smoothly
- [ ] Modal entrance is smooth
- [ ] No layout shifts during animations

---

## 📊 Estimated Timeline

- **Phase 1:** 6-8 hours (Database + Core Achievement System)
- **Phase 2:** 4-6 hours (Achievement Implementation)
- **Phase 3:** 3-4 hours (Titles & Status)
- **Phase 4:** 5-6 hours (Notifications & Ravens)
- **Phase 5:** 6-8 hours (Visual Enhancements)
- **Phase 6:** 10-12 hours (Gifting System)

**Total:** ~35-45 hours (5-6 days of focused work)

---

## 🚀 Deployment Strategy

1. **Phase 1-2:** Deploy achievements (low risk, high value)
2. **Phase 3-4:** Deploy titles, status, and notifications
3. **Phase 5:** Deploy visual enhancements (can do gradually)
4. **Phase 6:** Deploy gifting last (most complex, test thoroughly)

---

## 💡 Nice-to-Have Extensions

If time permits:
- [ ] Achievement showcase on profile page
- [ ] Leaderboard for most gifts sent/received
- [ ] Gift history/log
- [ ] Batch gift sending (send same gift to multiple friends)
- [ ] Scheduled gifts (birthday gifts, etc.)
- [ ] Gift wishlist feature
