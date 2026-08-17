# Thrivehaven App Text Audit & Simplification Matrix

> Audited against [`PAGES_SITEMAP.md`](file:///Users/jilles/Thrivehaven/PAGES_SITEMAP.md) across all 6 core page categories to eliminate text heaviness, redundant explanatory copy, and unnecessary UI noise.

---

## ✂️ Text Reduction Philosophy
1. **Self-Explanatory CTAs**: Buttons state the *action*, not the *instructions* (e.g. "Pet attack" instead of "Guardian Pet Striker • Ready (Click to Strike!)").
2. **Shortened Headers**: Page titles use 1–2 words (e.g. "Kingdom" instead of "Kingdom Board & Strategic Settlement Map").
3. **Implicit States**: Inactive/Disabled button styling conveys availability — redundant text like "(⚡ Ready)" or "(Used This Battle)" is removed.
4. **Zero Tutorial Noise**: Helper text explaining basic interactions ("Click tile to open drawer", "Tap checkbox to mark complete") is removed.

---

## 📊 Comprehensive Page Wording Proposal Matrix

### 1. Core Habit & Daily Experience

| Page Name | Path | Current Wording / Text Heavy UI Element | Proposed Simplified Wording | Character Count Reduction |
|---|---|---|---|:---:|
| **Daily Hub** | `/daily-hub` | "Quick Morning Habit Focus — Hit your 5 daily habits target!" | **"Morning focus"** (Badge: **"5 Target"**) | **-68%** |
| **Daily Hub** | `/daily-hub` | "Click the checkbox to mark habit complete and earn +10 Gold" | *Remove helper text entirely* | **-100%** |
| **Quests Board** | `/quests` | "Daily Quests & Repeating Habits Engine — Complete everyday routines" | **"Quests"** (Subhead: **"Daily routines"**) | **-72%** |
| **Quests Board** | `/quests` | "Filter habits by category: Might, Knowledge, Vitality" | **"Category:"** (`Might`, `Knowledge`, `Vitality`) | **-60%** |
| **Weekly Challenges** | `/challenges` | "Multi-Day Focus Goals — Complete higher intensity weekly challenges" | **"Challenges"** (Subhead: **"Weekly focus"**) | **-70%** |
| **Chronicle** | `/chronicle` | "Passive Habit Milestone Journal & Private AI Reflection Diary" | **"Chronicle"** (Tabs: **"Journal"** \| **"Reflections"**) | **-75%** |

---

### 2. Kingdom, Realm & Minigames

| Page Name | Path | Current Wording / Text Heavy UI Element | Proposed Simplified Wording | Character Count Reduction |
|---|---|---|---|:---:|
| **Kingdom Board** | `/kingdom` | "Kingdom Strategic Tile Board — Tap tile to inspect settlement building" | **"Kingdom"** | **-85%** |
| **Kingdom Board** | `/kingdom` | "Collect taxes from all ready producer buildings (+120 Gold)" | **"Collect (+120 Gold)"** | **-65%** |
| **Dungeon Keep** | `/dungeon` | "🐾 Guardian Pet Striker • Ready (Click to Strike!)" | **"🐾 Pet attack"** *(Implemented)* | **-74%** |
| **Dungeon Keep** | `/dungeon` | "🧠 Spend 5 Focus Points for +1 Extra Attempt" | **"🧠 +1 Attempt (5 Focus)"** | **-45%** |
| **Dungeon Keep** | `/dungeon` | "🏃 Safe Retreat (Preserves Daily Entry Attempt)" | **"🏃 Retreat"** | **-78%** |
| **Dungeon Keep** | `/dungeon` | "Choose Action ⚠️ Incoming Heavy Attack! Guard or Swap!" | **"Choose action"** (Warning: **"⚠️ Guard or swap"**) | **-52%** |
| **Royal Exchange** | `/market` | "Royal Exchange Trading Post & Mystic Bazaar — Buy and sell goods" | **"Market"** (Tabs: **"Trade"** \| **"Bazaar"**) | **-78%** |
| **Inventory Bag** | `/inventory` | "Player Inventory Pouch — Manage botanical reagents and potions" | **"Inventory"** | **-84%** |
| **Realm Sandbox** | `/realm` | "2D Sandbox Grid Builder — Place and rotate kingdom tiles" | **"Realm"** | **-88%** |
| **Riddles** | `/riddles` | "Interactive Sphinx Minigame & Labyrinth Puzzle Solver" | **"Riddles"** | **-84%** |

---

### 3. Character, Citizens & World Navigation

| Page Name | Path | Current Wording / Text Heavy UI Element | Proposed Simplified Wording | Character Count Reduction |
|---|---|---|---|:---:|
| **Character & Vault** | `/character` | "Hero Showcase & Citizen Vault — Train citizens with gold & essences" | **"Character"** (Tabs: **"Hero"** \| **"Vault"**) | **-76%** |
| **Character & Vault** | `/character` | "Spend 50 Gold & 1 Scroll to Train Citizen (+1 Level)" | **"Train (+1 Lv)"** (Subtext: **"50 Gold"**) | **-62%** |
| **Player Profile** | `/profile` | "Player Profile & Paragon Border Ranks — View equipped titles" | **"Profile"** | **-86%** |
| **Social & Alliances** | `/social` | "Alliance Guild Hall & Co-op Titan Wyrm Raids — Challenge allies" | **"Social"** (Tabs: **"Guild"** \| **"Friends"**) | **-78%** |
| **Social & Alliances** | `/social` | "Send 1v1 Friend Daily Habit Race Virtue Duel Challenge" | **"Issue dare (+10 Virtue)"** | **-60%** |
| **Skydock Airship** | `/map` | "Habit-Powered Ether Fuel Engine — Propel airship voyages" | **"Skydock"** | **-85%** |
| **Notifications** | `/notifications` | "Action Feed & System Notifications — View friend dares and rewards" | **"Notifications"** | **-82%** |

---

### 4. Settings & Account Pages

| Page Name | Path | Current Wording / Text Heavy UI Element | Proposed Simplified Wording | Character Count Reduction |
|---|---|---|---|:---:|
| **Settings** | `/settings` | "Global Application Preferences & Audio Controls" | **"Settings"** | **-83%** |
| **Hero Setup** | `/setup` | "Initial Character Onboarding & Starter Habit Selection" | **"Setup"** | **-88%** |
| **Account Data** | `/account/stored-data` | "Export Stored Application Data & Privacy JSON Management" | **"Data & privacy"** | **-70%** |

---

## 🛠️ Implemented Wording Simplification in Code

1. **Dungeon Pet Attack Button** ([`app/dungeon/page.tsx`](file:///Users/jilles/Thrivehaven/app/dungeon/page.tsx#L1831)):
   - **Before**: `🐾 Guardian Pet Striker • Ready (Click to Strike!)` / `🐾 Guardian Pet Striker • Used This Battle`
   - **After**: `🐾 Pet attack` (Disabled state uses implicit `opacity-50 cursor-not-allowed` without redundant text).

---

## 🎨 Medieval Emoji & Icon Alignment Registry

> Refined based on user feedback: Valid medieval symbols (**Target `🎯`**, **Cog `⚙️`**, **Lightning `⚡`**) are retained. Each feature uses a **unique, non-colliding icon** to preserve visual clarity across all pages.

| Feature / UI Location | Assigned Symbol | Icon Rationale & Medieval Authenticity |
|---|:---:|---|
| **Topbar Bag & Overlay** | `<Image src="/images/ui/medieval-backpack.png" />` | Custom transparent PNG of rustic leather & canvas adventurer bag *(Replaced red school backpack)* |
| **Daily Hub Navigation** | `📅` Daily Scroll / Schedule | Unique daily schedule symbol *(Avoids collision with Castle `🏰`)* |
| **Kingdom Grid Expansion** | `🗺️` Realm Map | Unique cartography map for grid expansion *(Avoids collision with Castle `🏰`)* |
| **Castle & Citadel Keep** | `🏰` Citadel Fortress | Exclusively reserved for Citadel & Castle Keep tiles |
| **Royal Exchange & Market** | `⚖️` Merchant Scales | Merchant trade balance scales for material commerce *(Replaced supermarket cart `🛒`)* |
| **Airship Expeditions** | `⛵` Airship Vessel | Ether sky vessel for harbor voyages *(Replaced modern rocket `🚀`)* |
| **Habit Targets & Goals** | `🎯` Archery Target | **Retained**: Archery target practice is authentic medieval |
| **Ether Energy & Speed** | `⚡` Elemental Lightning | **Retained**: Elemental lightning spells and ether fuel speed |
| **System Notifications** | `⚙️` Citadel Mechanisms | **Retained**: Clockwork cogs and citadel mechanism settings |
| **Momentum & Growth** | `🌿` Growth Sprout | Botanical growth for weekly momentum |


