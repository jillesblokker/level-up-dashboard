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

## Master Systems Evaluation & Completeness Matrix

| System # | Game System Name | System Description & Primary Role | Visual Assets (1-10) | Rewards & Economy (1-10) | UX Quality (1-10) | Fun Factor (1-10) | Incomplete Systems? | Key Missing Elements / Depth Opportunities |
|:---:|---|---|:---:|:---:|:---:|:---:|:---:|---|
| **1** | **Fighting Dungeon Battles** | Turn-based 3v3 elemental creature battles with daily habit ATK/HP multipliers, Guardian Pet support strikers, and floor 5/10 boss tile blueprint drops | 9/10 | 9/10 | 9/10 | 9/10 | **No** | Add explicit boss room floor intro animations & elemental weak-point break mechanics |
| **2** | **Citizen Training & Specialization** | Upgrade citizens with Gold/Essences into Tank, Mage, Alchemist, Scout classes, earning Expedition EXP on Airship/Map voyages | 9/10 | 8/10 | 9/10 | 9/10 | **No** | Add visual equipment slot overlays (weapon/armor) per citizen on the Character Vault page |
| **3** | **Character Setup & Hero Vault** | Top hero card showcasing avatar, streak, titles, sigil crests, equipment items, and guardian pet collections | 9/10 | 9/10 | 9/10 | 9/10 | **No** | Add real-time 3D item preview inspect modal for legendary swords & armor |
| **4** | **Realm Building & Sandbox Grid** | Freeform 2D grid builder with 84+ placeable tile types, rotation controls, and friend-visitable showpiece showcase | 9/10 | 8/10 | 9/10 | 9/10 | **No** | Add multi-tile drag-to-place brush mode and custom weather particle overlays (snow/rain) |
| **5** | **Kingdom Board & Settlement Tiles** | Strategic board with dopamine tile taps, passive taxes, and interactive settlement drawers (Abbey, Apotheca, Barracks) | 9/10 | 9/10 | 9/10 | 9/10 | **No** | Add automated tax-collector citizen routes walking along paved roads |
| **6** | **Exploration, Events & Minigames** | Interactive minigame tiles (Plank Labyrinth, Riddles, Tarot) and random event triggers yielding blueprints & essences | 9/10 | 9/10 | 9/10 | 9/10 | **No** | Add 2 additional minigame tiles: Archery Target Range & Tarot Card Reading Fortune Wheel |
| **7** | **Alchemy & Potion Crafting** | Grand Apotheca glasshouse where players convert botanical materials & essences into gold, exp, and health potions | 9/10 | 8/10 | 9/10 | 8/10 | **No** | Add potion brewing timer cauldron animations with success rate boosters |
| **8** | **Friend Dares & Virtue Duels** | Head-to-head friend habit challenges awarding +10 bonus House Cup virtue points to both issuer and recipient | 9/10 | 9/10 | 9/10 | 9/10 | **No** | Add push notifications & friend duel revenge notifications |
| **9** | **House Cup & Seasons Archival** | Real-time 7 Virtue Hourglasses, monthly recaps, annual celebration modal, Chronicle past champions gallery, and legacy titles | 9/10 | 9/10 | 9/10 | 9/10 | **No** | Add animated Virtue Energy flowing liquid effects inside the 7 Hourglass columns |
| **10** | **Airship Harbor & Ether Voyages** | Real-world habit-powered Ether fuel engine propelling voyages to distant trading ports with 3-citizen crew assignments | 9/10 | 9/10 | 9/10 | 9/10 | **No** | Add live interactive airship flight animation canvas moving across cloud layers |
| **11** | **Market Exchange & Bazaar** | Royal Exchange Trading Post (material buy/sell) & Mystic Shop (free Chrono Chests, Mythic card packs, and rare tiles) | 9/10 | 9/10 | 9/10 | 9/10 | **No** | Add daily rotating flash sales & merchant barter bargain minigame |
| **12** | **Daily Hub & Daily Opening Routine** | Interactive full-screen 3-step opening flow (Yesterday's recap → Today's habit target → Virtue toast & pet gifts) | 10/10 | 9/10 | 10/10 | 9/10 | **No** | Add celebratory daily habit completion confetti explosions when 5/10 target is hit |
| **13** | **Chronicle & Reflection Journal** | Dual journal (auto-generated habit milestones & archived season champions + private reflection diary with mood tracking) | 9/10 | 8/10 | 9/10 | 8/10 | **No** | Add voice-to-text journal dictation and monthly AI reflection summary synthesis |

## House Cup & Seasons

- **Real-time 7 Virtue Hourglasses**: `Might`, `Knowledge`, `Honor`, `Castle`, `Craft`, `Vitality`, `Wellness`.
- **Monthly Recap**: In-between monthly stats displayed in a dedicated recap modal.
- **End of Year Celebration**: Celebratory modal showing house winners and scaling rewards (scaling based on how many allies/circle members participated).
- **Season Transitions & Archival**: When a new season/year starts, standings reset to 0, past winners are permanently archived in the **Chronicle**, and participating players receive permanent **legacy titles & trophy badges**.
- **Friend Dares & Virtue Duels**: "I dare you" friend quests and virtue duels award bonus House Cup virtue points (+10 to both issuer & recipient) and competitive rivalry trophies.

## Daily Opening Routine Sequence

- **Modal Trigger**: Launches an interactive full-screen Daily Opening Routine modal on first login each day.
- **Sequence Steps**:
  1. **Recap of last day** — Streak status, completed habit count, XP & Gold earned yesterday.
  2. **Today's habit focus & target** — Preview fresh habit focus (aim for 5/10 target) and set daily intentions.
  3. **House Cup toast, taxes, and pet gift** — Toast virtue standings, collect kingdom tile taxes, and claim daily guardian pet bounty (+50 Gold & +1 Essence).

## Kingdom & Dungeon Loop

- **Visual diary of progress** — real-life growth mirrored in-game
- **Gameplay loop**: Completing habits/quests yields Gold & Essences → used to train citizens/fighters → trained citizens clear higher floors in the Dungeon.
- **Dungeon Boss Room Blueprint Drops**: Defeating Dungeon Keep Boss rooms (every 5th floor) drops rare Kingdom & Realm Tile Blueprints (such as Serene Lake, Waterway Canal, Zen Garden, Astral Citadel) directly into player inventory.
- **Habit Combat Buffs**: Completing today's habits grants immediate combat stat multipliers in the Dungeon Keep (e.g. `Might` habits = +5% ATK per habit up to +25% max; `Knowledge` habits = +5% Spell Power).
- Tile types have specific roles:
  - **Kingdom tiles** → give rewards & taxes
  - **Settlement tiles** (Abbey, Apotheca, Barracks) → user can enter and perform actions
  - **Minigame tiles** → trigger modal with interactive minigames (Plank Labyrinth, Riddles, Tarot) yielding Gold, Essences, and rare Kingdom Tile Blueprints based on puzzle difficulty
  - **Realm tiles** → trigger events
- **Endgame**: Huge, detailed map styled to the player's liking. Activity level determines how much they've built.
- **Realm page**: Friends can visit to see your progress ("showing off")

## Airship Harbor & Real-World Habit Engine

- **Real-World Activity Connection**: Airship voyages are propelled directly by completing daily habits (which generate Ether fuel), NOT passive countdown timers.
- **Voyage Cargo**: Propelling airships to distant trading ports unlocks rare building blueprints, citizen training gear, and alchemy reagents.

## Characters, Citizens & Guardian Pets

- Citizens: **both functional AND narrative** — world feels alive, interactive, explorable. Upgradeable with gold & alchemy essences earned from habits.
- **Combat Class Specialization**: Citizens specialize into distinct combat classes (`Tank`, `Mage`, `Alchemist`, `Scout`) matching habit categories (`Might` habits empower Tanks, `Knowledge` habits empower Mages, `Vitality`/`Wellness` empower Alchemists, `Honor`/`Craft` empower Scouts).
- **Citizen Expedition EXP & Crew Assignment**:
  - Players assign 1 to 3 citizens as the **Expedition Crew** for Airship Harbor voyages and Kingdom Map tile expeditions.
  - Completing expeditions grants **Citizen EXP**, leveling up citizen combat HP/ATK and unlocking class title upgrades (e.g. *Novice Vanguard* → *Master Vanguard*).
  - **Class Matching Synergy**: Matching citizen class to expedition type (e.g., Scout on Airship Voyages, Alchemist on Botanical Expeditions) awards **+50% bonus Citizen EXP** and **+15% Ether fuel efficiency**.
- Guardian pets: **strategic choice with dual mechanics**:
  - **Passive Yields**: Grant passive daily kingdom resource yields (+10% Gold & Essences).
  - **Dungeon Support**: As pets level up alongside player habits, they join Dungeon Keep battles as active support strikers, executing elemental signature moves.
- Mythic cards: **both collectible AND usable as citizens** — make the world feel alive.

## Economy & Progression

- Primary gold sink: **realm tiles** (feels most like a game → wonder & exploration)
- Leveling pace: ~1 month to level 10 with normal activity. Level 1→2 easy, 99→100 very hard
- **Infinite Progression & Prestige System**:
  - Reaching Level 100 unlocks **Prestige Ranks** (Prestige I, II, III...) with distinct Paragon crest borders.
  - Unlocks exclusive **Legendary Realm Tile Blueprints** and **Mythic Pet Evolutions** (e.g. Astral Wyrm, Solar Gryphon).
- **Streak Protection & Rest Days**:
  - **Holiday Mode toggle** (pauses streak decay for vacation/sickness) + **auto-earned Streak Freeze shields** for high consistency — never punish sickness or vacation!

## Social & Alliance Raid Engine

- **Solo must be fun and complete.** But social pressure is scientifically proven to help habits
- Friend quest dynamic: **competition** ("I dare you") + virtue duels for House Cup bonus points
- **Alliance Titan Wyrm Raid Boss**: Shared Alliance health bar where daily habit completions deal raid damage based on quest cadence:
  - **Quest completion (Daily habit)**: 1 damage
  - **Challenge completion (Weekly focus)**: 10 damage
  - **Milestone completion (Cumulative achievement)**: 100 damage
  - Unlocks shared alliance tier chests for all participating allies!

## Page Purposes

| Page | Role & Key Features |
|------|---------------------|
| **Daily hub** | First thing you see every morning — top hero card displays daily streak + habit target (5/10), followed by favorite daily habits checklist and quick links to Kingdom & Dungeon |
| **Chronicle** | **Dual system**: passive journal (auto-generated from habit milestones & season winners archive) + private reflection diary for active writing |
| **Dungeon** | Turn-based elemental mini-game that gets harder floor by floor. Need to train fighters with gold/essences and complete daily habits for combat stat multipliers (+5% ATK/HP) to handle scaling monster rooms |
| **Airship harbor** | Tied directly to **real-world habit activity** (completing habits generates Ether fuel to propel voyages to distant trading ports) |
| **Market** | Royal Exchange & Bazaar with dual tabs: Trading Post (buying/selling construction materials with Gold) and Mystic Shop (opening free Chrono Chests & Mythic Card packs) |
| **Realm** | Creative sandbox + friend-visitable showpiece for custom building layout |
| **Kingdom** | Strategic board + dopamine tile interactions, passive tax collection & settlement tile action drawers (Abbey, Apotheca, Barracks) |
| **Character** | Hero Showcase & Vault — Top Hero Card (Avatar, Level, Title, Sigil Crest, Streak) → 3 Organized Tabs: [Hero Stats & Equipment] [Titles & Badges] [Creatures & Guardian Pets], featuring clickable Title & Crest Vault drawer |

## Data & Sync rules

- **Server is always the source of truth** — localStorage is only a performance cache
- Offline: queue actions and sync later (acceptable if it doesn't cause multi-device issues)
- Sync speed: **within 1 minute** is acceptable
- Admin-only section: show last server-side update timestamps per core system (quests, stats, etc.)
- Restore from cloud: option in settings menu, but not prominent
- The app should "just work" without the user thinking about sync

## Design philosophy

- Critical UI: **straightforward and practical** — no "the server dragon was slain" error messages
- Current direction: **add depth to existing features** rather than building new ones
- Fantasy theme is the wrapper, but UX clarity comes first

## Copywriting rules

- **Sentence case everywhere**: Only the first word of a sentence or a proper name starts capitalized
- No ALL CAPS or Title Case in UI text, badges, headers, toast messages, loading screens
- Potion names: "Gold potion", "Exp potion", "Health potion", "Mana potion", "Water"
- Mythic names: "Green minotaur", "Red cyclops" (color lowercase, creature lowercase)
