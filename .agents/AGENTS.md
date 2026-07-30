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

## House Cup & Seasons

- **Real-time 7 Virtue Hourglasses**: `Might`, `Knowledge`, `Honor`, `Castle`, `Craft`, `Vitality`, `Wellness`.
- **Monthly Recap**: In-between monthly stats displayed in a dedicated recap modal.
- **End of Year Celebration**: Celebratory modal showing house winners and scaling rewards (scaling based on how many allies/circle members participated).
- **Season Transitions & Archival**: When a new season/year starts, standings reset to 0, past winners are permanently archived in the **Chronicle**, and participating players receive permanent **legacy titles & trophy badges**.
- **Friend Dares & Virtue Duels**: "I dare you" friend quests and virtue duels award bonus House Cup virtue points (+10 to both issuer & recipient) and competitive rivalry trophies.

## Daily Opening Routine Sequence

1. **Recap of last day** — Streak status, completed habit count, XP & Gold earned yesterday.
2. **Today's habit focus & target** — Preview fresh habit focus (aim for 5/10 target) and set daily intentions.
3. **House Cup toast, taxes, and pet gift** — Toast virtue standings, collect kingdom tile taxes, and claim daily guardian pet bounty (+50 Gold & +1 Essence).

## Kingdom & Dungeon Loop

- **Visual diary of progress** — real-life growth mirrored in-game
- **Gameplay loop**: Completing habits/quests yields Gold & Essences → used to train citizens/fighters → trained citizens clear higher floors in the Dungeon.
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

## Social

- **Solo must be fun and complete.** But social pressure is scientifically proven to help habits
- Friend quest dynamic: **competition** ("I dare you") + virtue duels for House Cup bonus points
- Alliance system: nice-to-have layer on top with daily alliance chests and Titan Wyrm raid bosses.

## Page Purposes

| Page | Role |
|------|------|
| **Daily hub** | First thing you see every day — the "home" |
| **Chronicle** | **Dual system**: passive journal (auto-generated from habit milestones & season winners archive) + private reflection diary for active writing |
| **Dungeon** | Turn-based elemental mini-game that gets harder. Need to train fighters with gold/essences and complete daily habits for combat buffs to keep up |
| **Airship harbor** | Tied directly to **real-world habit activity** (completing habits generates Ether fuel to propel voyages) |
| **Market** | Mostly shopping (consumables, packs, tiles, material exchange) |
| **Realm** | Creative sandbox + friend-visitable showpiece |
| **Kingdom** | Strategic board + dopamine tile interactions & property timers |

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
