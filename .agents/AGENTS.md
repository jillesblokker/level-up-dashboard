# Thrivehaven — Product vision & rules

> Source: Creator interview, July 2026 (Expanded & Refined late July 2026)

## Core promise

**"Grow with persistency."** The world of Thrivehaven is a metaphor for real life. As the player builds habits, they become smarter, cleaner, stronger IRL — and the game world reflects that growth visually and mechanically.

## Target audience

Started as a personal tool. Now intended to help **everyone** start building habits. First impression should be **a sense of possibility** — "I can finally start building habits."

## Quest / Challenge / Milestone structure

| Type | Cadence | Example | Tab |
|------|---------|---------|-----|
| **Quest** | Daily repeating habit | Brush teeth, 10 push-ups | Quests tab |
| **Challenge** | Weekly or intensive | Run 5km, read a full chapter | Challenges tab |
| **Milestone** | Cumulative goal | 100 push-ups in a row | Milestones tab |

- Reset: **local timezone midnight** (NOT hardcoded Amsterdam)
- Undo: user should be able to uncheck a quest they accidentally marked complete
- Sweet spot: **5/day = "Great"**, 10 = "Awesome", 15+ = "Super", 20+ = "Amazing"
- Mix simple habits (wake before 10) with aspirational ones (10 push-ups)
- Must feel **fun and "laagdrempelig" (low barrier)** — NOT a task list
- Categories (`Might`, `Knowledge`, `Honor`, `Castle`, `Craft`, `Vitality`, `Wellness`) **meaningfully affect gameplay** (granting dynamic Dungeon combat buffs, House Cup virtue energy, and crafting materials)

## Notification Center Action Feed Rules

- **High-Value Action Filtering**: The topbar Notification Bell only alerts on actionable events:
  - **Social**: Friend Dares & Virtue Duels received
  - **Raid & Rewards**: Titan Wyrm Victory Chests ready
  - **Progression**: Level Gained & Achievements Unlocked
  - **Protection**: Streak Freeze & Rest Day alerts
- **Noise Suppression**: Minor routine logs (such as +10 XP per habit or low-priority system events) are suppressed to prevent notification fatigue.
- **One-Tap Action Cards**: Notification cards feature immediate action buttons (`Accept Dare`, `Claim Chest`, `View Title`).
- **24-Hour Auto-Archiving**: Read notifications automatically archive after 24 hours to maintain a clean, zero-clutter inbox.

## Master Systems Evaluation & Completeness Matrix

| System # | Game System Name | System Description & Primary Role | Visual Assets (1-10) | Rewards & Economy (1-10) | UX Quality (1-10) | Fun Factor (1-10) | Incomplete Systems? | Key Missing Elements / Depth Opportunities |
|:---:|---|---|:---:|:---:|:---:|:---:|:---:|---|
| **1** | **Fighting Dungeon Battles** | Turn-based 3v3 elemental creature battles with daily habit ATK/HP multipliers, Guardian Pet support strikers, and floor 5/10 boss dual drops (Blueprints + Apotheca Reagents) | 9/10 | 9/10 | 9/10 | 9/10 | **No** | Defeating Boss floors drops rare Kingdom Blueprints (Serene Lake, Astral Citadel) AND Apotheca potion reagents |
| **2** | **Citizen Training & Specialization** | Upgrade citizens with Gold/Essences into Tank, Mage, Alchemist, Scout classes, earning Expedition EXP on Airship/Map voyages | 9/10 | 8/10 | 9/10 | 9/10 | **No** | Visual equipment slot overlays (weapon/armor/shield/mount/artifact) per citizen on Character Vault |
| **3** | **Character Setup & Hero Vault** | Top hero card showcasing avatar, streak, titles, sigil crests, equipment items, and guardian pet collections | 9/10 | 9/10 | 9/10 | 9/10 | **No** | 2D RPG equipment paperdoll grid around central avatar (Weapon, Shield, Armor, Mount, Artifact slots) |
| **4** | **Realm Building & Sandbox Grid** | Freeform 2D grid builder with 84+ placeable tile types, rotation controls, single-click tile placement with confirmation, and friend-visitable showpiece showcase | 9/10 | 8/10 | 9/10 | 9/10 | **No** | Reaching Level 100 Prestige unlocks exclusive freeform sandbox tiles (Floating Islands, Crystal Cascades) |
| **5** | **Kingdom Board & Settlement Tiles** | Strategic board with dopamine tile taps, passive taxes, top cover image 'Collect taxes' header button, and interactive settlement drawers | 9/10 | 9/10 | 9/10 | 9/10 | **No** | Single top cover image 'Collect taxes' button with summary harvest modal |
| **6** | **Exploration, Events & Minigames** | Interactive minigame tiles (Plank Labyrinth, Riddles, Tarot) and random event triggers yielding blueprints & essences | 9/10 | 9/10 | 9/10 | 9/10 | **No** | Interactive minigame tiles (Plank Labyrinth, Riddles, Tarot Card Reading) |
| **7** | **Alchemy & Potion Crafting** | Grand Apotheca glasshouse where players convert botanical materials & essences into gold, exp, and health potions | 9/10 | 8/10 | 9/10 | 8/10 | **No** | Apotheca potion brewing linked via Market page shortcut button |
| **8** | **Friend Dares & Virtue Duels** | Head-to-head friend habit challenges awarding +10 bonus House Cup virtue points to both issuer and recipient | 9/10 | 9/10 | 9/10 | 9/10 | **No** | 1v1 Daily Habit Races: First ally to hit 5/10 habit target wins bonus House Cup virtue points (+10 to both) and rivalry badges |
| **9** | **House Cup & Seasons Archival** | Real-time 7 Virtue Hourglasses, monthly recaps, annual celebration modal, Chronicle past champions gallery, and legacy titles | 9/10 | 9/10 | 9/10 | 9/10 | **No** | Paragon Borders & Chronicle Hall of Champions: Season winners earn glowing avatar borders, legacy titles, and permanent Chronicle placement |
| **10** | **Airship Harbor & Ether Voyages** | Real-world habit-powered Ether fuel engine propelling voyages to distant trading ports with 3-citizen crew assignments | 9/10 | 9/10 | 9/10 | 9/10 | **No** | Category Synergy & Streak Speed: Habit categories grant specific Ether fuel perks (Knowledge = speed, Might = cargo size) and 7+ streaks double flight speed |
| **11** | **Market Exchange & Bazaar** | Royal Exchange Trading Post (material buy/sell) & Mystic Shop (free Chrono Chests, Mythic card packs, and rare tiles) | 9/10 | 9/10 | 9/10 | 9/10 | **No** | Unified tabs: 'Trading post' and 'Mystic bazaar' with Apotheca glasshouse shortcut button |
| **12** | **Daily Hub & Daily Opening Routine** | Interactive full-screen 3-step opening flow (Yesterday's recap → Today's habit target → Virtue toast & pet gifts) | 10/10 | 9/10 | 10/10 | 9/10 | **No** | Quick Morning Habit Focus widget with celebratory 5/10 target confetti explosion |
| **13** | **Chronicle & Reflection Journal** | Dual journal (auto-generated habit milestones & archived season champions + private reflection diary with mood tracking) | 9/10 | 8/10 | 9/10 | 8/10 | **No** | Simple mood tag selectors (Energized, Focused, Calm) and monthly AI reflection summary synthesis |
| **14** | **Quests, Challenges & Milestones Engine** | 3-tab habit engine (Daily Quests, Weekly Challenges, Cumulative Milestones) with midnight reset, undo capability, and 5/10 target sweet spot | 10/10 | 9/10 | 10/10 | 9/10 | **No** | Deep Habit Engine with custom category tag creation and 5/10 target confetti explosions |
| **15** | **Guardian Pets & Companions** | Evolving pet companions (Ember Drake, Sage Owl, Spirit Sprite) providing passive daily yields (+10% Gold/Essence) and active Dungeon Support Striker skills | 9/10 | 9/10 | 9/10 | 9/10 | **No** | Dedicated Guardian Pets tab with pet food treat feeding (+5% Affection) |
| **16** | **Seasonal Events & Alliance Titan Raids** | Co-op Alliance Titan Wyrm raid boss health bar where daily habit completions deal boss damage and unlock shared victory chests | 9/10 | 9/10 | 9/10 | 9/10 | **No** | Alliance Contribution Leaderboard and tier victory chest claim drawer |

## House Cup & Seasons

- **Real-time 7 Virtue Hourglasses**: `Might`, `Knowledge`, `Honor`, `Castle`, `Craft`, `Vitality`, `Wellness`.
- **Monthly Recap**: In-between monthly stats displayed in a dedicated recap modal.
- **End of Year Celebration**: Celebratory modal showing house winners and scaling rewards (scaling based on how many allies/circle members participated).
- **Paragon Borders & Chronicle Hall of Champions**: Season winners earn glowing avatar borders, legacy titles, and permanent placement in the **Chronicle Hall of Champions** gallery.
- **Friend Dares & Virtue Duels (1v1 Daily Habit Races)**: First ally to hit their 5/10 habit target wins bonus House Cup virtue points (+10 to both) and competitive rivalry badges.

## Airship Harbor & Real-World Habit Engine

- **Real-World Activity Connection**: Airship voyages are propelled directly by completing daily habits (which generate Ether fuel), NOT passive countdown timers.
- **Category Synergy & Streak Speed**: Habit categories grant specific Ether fuel perks (`Knowledge` habits = flight speed boost, `Might` habits = cargo size multiplier). Maintaining a 7+ day habit streak doubles airship flight speed.
- **Voyage Cargo**: Propelling airships to distant trading ports unlocks rare building blueprints, citizen training gear, and alchemy reagents.

## Kingdom & Dungeon Loop

- **Visual diary of progress** — real-life growth mirrored in-game
- **Gameplay loop**: Completing habits/quests yields Gold & Essences → used to train citizens/fighters → trained citizens clear higher floors in the Dungeon.
- **Dungeon Boss Dual Drops**: Defeating Dungeon Keep Boss rooms (every 5th floor) drops rare Kingdom Blueprints (Serene Lake, Waterway Canal, Zen Garden, Astral Citadel) AND Apotheca potion brewing reagents directly into player inventory.
- **Habit Combat Buffs**: Completing today's habits grants immediate combat stat multipliers in the Dungeon Keep (e.g. `Might` habits = +5% ATK per habit up to +25% max; `Knowledge` habits = +5% Spell Power).

## Characters, Citizens & Guardian Pets

- Citizens: **both functional AND narrative** — world feels alive, interactive, explorable. Upgradeable with gold & alchemy essences earned from habits.
- Guardian pets: **strategic choice with dual mechanics**:
  - **Passive Yields**: Grant passive daily kingdom resource yields (+10% Gold & Essences).
  - **Pet Food Treat Feeding**: Feed daily botanical treats (*Golden Apple*) to boost pet affection (+5%) and increase passive yields.
  - **Dungeon Support**: As pets level up alongside player habits, they join Dungeon Keep battles as active support strikers, executing elemental signature moves.

## Economy & Progression

- Primary gold sink: **realm tiles** (feels most like a game → wonder & exploration)
- Leveling pace: ~1 month to level 10 with normal activity. Level 1→2 easy, 99→100 very hard
- **Infinite Progression & Level 100 Prestige System**:
  - Reaching Level 100 unlocks **Prestige Ranks** (Prestige I, II, III...) with distinct Paragon crest borders.
  - Unlocks exclusive **Legendary Sandbox Blueprint Tiles** (Floating Islands, Crystal Cascades) and Mythic Pet Evolutions.

## Page Purposes

| Page | Role & Key Features |
|------|---------------------|
| **Daily hub** | Quick Morning Habit Focus widget displaying daily streak + habit target (5/10), followed by favorite daily habits checklist and quick links |
| **Chronicle** | **Dual system**: passive journal (auto-generated from habit milestones & season winners archive) + private reflection diary for active writing |
| **Dungeon** | Turn-based elemental mini-game with 3v3 squad management CTA and active Guardian Pet support striker skills |
| **Airship harbor** | Ether fuel engine propelled by real-world habit completion with category synergy perks and streak speed multipliers |
| **Market** | Royal Exchange Trading Post & Mystic Bazaar with unified tabs ('Trading post' & 'Mystic bazaar') and Apotheca Glasshouse shortcut |
| **Realm** | Creative sandbox + friend-visitable showpiece for custom building layout |
| **Kingdom** | Strategic board + dopamine tile taps, top cover image 'Collect taxes' button with summary harvest modal, and 3-tab Kingdom Command Drawer |
| **Character** | Hero Showcase & Vault — Top Hero Card → 5 RPG Equipment Slots (Weapon, Shield, Armor, Mount, Artifact/Astral crystal) |

## Design philosophy

- Critical UI: **straightforward and practical** — no "the server dragon was slain" error messages
- Current direction: **add depth to existing features** rather than building new ones
- Fantasy theme is the wrapper, but UX clarity comes first
- **Anti-Pollution Principle**: Avoid unnecessary duplicate loadout drawers, complex tile leveling sinks, or heavy notification clutter. Focus core polish strictly on direct habit dopamine loops (Morning Focus 5/10 target confetti) and visual combat feedback (Guardian Pet Striker skills).

## Copywriting rules

- **Sentence case everywhere**: Only the first word of a sentence or a proper name starts capitalized
- No ALL CAPS or Title Case in UI text, badges, headers, toast messages, loading screens
- Potion names: "Gold potion", "Exp potion", "Health potion", "Mana potion", "Water"
- Mythic names: "Green minotaur", "Red cyclops" (color lowercase, creature lowercase)

## React Child Type Safety & Anti-Regression Rules

- **Never render raw objects or un-invoked component definitions as React children.**
  - Props of type `ReactNode` or `icon` MUST be guarded using `renderSafeNode(icon)` or `isValidElement(icon)` to prevent **React Minified Error #31** runtime crashes in production.

## Universal API Response Unwrapping & Cross-Device Sync Rules

- **Always use `unwrapApiResponse(result)` when parsing API payloads on the client.**
  - All API client hooks, data fetching routines, and new features MUST consume responses via `unwrapApiResponse(res)` from `@/lib/api-response-unwrapper`.
  - This prevents `undefined` stat/level/gold bugs when endpoints return wrapped `{ success: true, data: { ... } }` objects and guarantees identical cross-device state.

## Mobile Viewport & Container Overflow Rules

- **Zero-Clipping Responsive Button Stacking**:
  - Buttons and action badges in side-by-side containers MUST use `flex flex-col sm:flex-row w-full` on mobile viewports (`< 640px`) so buttons never bleed past screen edges.
- **Scroll Box Height Requirements**:
  - Scrollable text boxes (such as battle logs, loot feeds, or status histories) MUST specify `min-h-[72px]` / `min-h-[76px]` to display at least **3 full lines of text** without cramped single-line scrolling.
- **Celebration & Results Screen Viewport Bounds**:
  - Fullscreen modals and celebration/victory overlays MUST use `min-h-dvh flex flex-col justify-center overflow-y-auto p-4 sm:p-8 pb-safe pt-safe` with scaled text sizes (`text-3xl sm:text-5xl`) to guarantee top icons and bottom action buttons fit comfortably inside iPhone viewports without top/bottom clipping.
- **District & Feature Badge Padding**:
  - Multi-stat badges (e.g. Barracks `⚔️ Barracks` and `+4 ATK`) MUST enforce a minimum width (`min-w-[170px]`) and explicit gap spacing (`gap-3`) to prevent text overlap.
- **Interactive Drag-to-Dismiss Modals**:
  - All iOS-style mobile bottom sheet modals featuring a top drag handle MUST support interactive touch gestures (`onTouchStart`, `onTouchMove`, `onTouchEnd`) to allow players to drag down to dismiss the modal smoothly.

