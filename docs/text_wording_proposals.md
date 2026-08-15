# 📜 Text Wording Proposals — Point 1 Review

Here is the proposed list of text rewrites across `lib/text-content.ts` and core UI elements. They convert title-cased technobabble and high-fantasy jargon into **sentence case, low-barrier, friendly, and quirky text**.

> **Please review and modify any strings below before we apply them to the codebase!**

---

## 1. System & Quest Titles

| Current Text | Proposed Friendly Text | Reason |
|---|---|---|
| `Rebuilding Thrivehaven...` | `Rebuilding Thrivehaven` | Remove trailing dots, sentence case |
| `Execute Consumable Restoration` | `Drink health potion (+30% HP)` | Low-barrier, clear direct action |
| `Mystic Bazaar Card Shop` | `Mystic bazaar card shop` | Sentence case |
| `Ether-Voyage Fuel Engine` | `Airship voyage fuel` | Friendly, direct |
| `Overdrive Streak Recovery (0/2)` | `Streak recovery (0/2)` | Direct, low-barrier |

---

## 2. Daily Habit Deeds (Fun & Quirky Framing)

| Habit Action | Current Notification | Proposed Quirky Text |
|---|---|---|
| **Brush Teeth** | `Daily Task Completed (+10 Gold)` | `Praise the light! You outran the Tooth Goblin! (+10 Gold)` |
| **10 Push-Ups** | `Habit Logged: 10 Push-ups` | `10 push-ups! Bulky Orc can smell the gains from Castle Valoreth!` |
| **Drink Water** | `Hydration Task Complete` | `Glug glug! You are 100% hydrated and ready for victory!` |
| **Wake Before 8:00 AM** | `Early Riser Milestone Met` | `Woke up before 8:00 AM? You outran the Sleep Demon!` |

---

## 3. Consumables & Item Descriptions

| Item | Current Description | Proposed Friendly Description |
|---|---|---|
| **Health Potion** | `Restores 30% of max health capacity.` | `Tastes like boiled spinach and victory. Restores +30% health!` |
| **Streak Freeze** | `Protects habit streak from daily reset.` | `Puts your habit streak in a magical refrigerator so yesterday doesn't melt.` |
| **Botanical Essence** | `Reagent for potion synthesis.` | `Freshly picked leaves and blossoms used for potion brewing.` |

---

## 4. House Cup & Virtues

| Virtue | Current Label | Proposed Sentence Case Label |
|---|---|---|
| **Might** 💪 | `MIGHT VIRTUE` | `Might virtue (+15% ATK)` |
| **Knowledge** 📖 | `KNOWLEDGE VIRTUE` | `Knowledge virtue (+10% magic)` |
| **Honor** 👑 | `HONOR VIRTUE` | `Honor virtue (+10 House Cup pts)` |

---

> **Instructions for User**: If you want to modify any of these strings, let me know or edit them, and I will apply them to `lib/text-content.ts`!
