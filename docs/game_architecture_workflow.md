# Game Architecture & Core Loop Workflow

This document details how the real-life productivity habits, active kingdom simulation, passive idle citizens, card collections, and turn-based combat systems operate together as a single, unified gamification loop.

---

## 1. High-Level System Architecture

```mermaid
graph TD
    %% Real Life Layer
    subgraph Real_Life ["Real-Life Input"]
        A[Real-Life Habit / Task] -->|Complete Quest| B[Quest Engine]
    end

    %% Economy & Progression Layer
    subgraph Economy ["Progression & Economy"]
        B -->|Awards| C[Gold]
        B -->|Awards| D[XP]
        D -->|Level Up| E[Character Level]
    end

    %% Active Gameplay (Kingdom Building)
    subgraph Kingdom ["Kingdom Simulation (Active)"]
        C -->|Purchase Tiles| F[Tile Grid Placement]
        F -->|Destroy/Place| G[Harvestable Materials: Logs, Water, etc.]
        F -->|Milestones Achieved| H[Unlock Creatures / Citizens]
    end

    %% Idle Loop (Citizens)
    subgraph Citizens ["Citizens & Card Economy (Passive/Idle)"]
        H -->|Activate up to 12| I[Citizens on Map]
        J[Market Packs] -->|Unlock| K[Mythic Cards]
        K -->|Activate| I
        I -->|Requires Nourishment| L[Feed Citizens: Fish, Water]
        G & M[Market Items] -->|Provide| L
        I -->|24h Cooldown| N[Harvest Coins & Items]
        N -->|Generate| C
    end

    %% Tactical Combat Loop
    subgraph Combat ["Dungeon Battle (Active Utility)"]
        I -->|Draft 6 Squad Members| O[Combat Encounter]
        O -->|Defeat Monsters| P[Unlock Combat Achievements / Rare Loot]
        P -->|Provides| C
        P -->|Provides| D
    end
    
    style Real_Life fill:#1a1c23,stroke:#7c3aed,stroke-width:2px,color:#fff
    style Economy fill:#1e1b4b,stroke:#d97706,stroke-width:2px,color:#fff
    style Kingdom fill:#064e3b,stroke:#10b981,stroke-width:2px,color:#fff
    style Citizens fill:#172554,stroke:#3b82f6,stroke-width:2px,color:#fff
    style Combat fill:#450a0a,stroke:#ef4444,stroke-width:2px,color:#fff
```

---

## 2. Core Gameplay Loops

### A. The Primary Hook: Real-Life to Gold & XP
1. **Input**: The player performs real-life self-improvement habits (e.g., studying, exercising, reading).
2. **Action**: Completes associated Quests/Tasks in the daily hub.
3. **Reward**: Earns **XP** (character growth) and **Gold** (gameplay currency).

### B. The Active Gameplay Loop: Kingdom Placement & Discoveries
1. **Action**: The player spends earned **Gold** to buy land tiles (Forest, Mountain, Water, Ice, Snow).
2. **Construction**: Places tiles on the realm map. Roads and infrastructure can be rotated/connected.
3. **Discovery**: Reaching specific tile counts triggers milestones, unlocking new species (e.g., placing 5 water tiles triggers the achievement unlocking **Divero**).
4. **Material Generation**: Forest and Water tiles slowly produce materials (e.g., wood logs, clean water).

### C. The Passive/Idle Loop: Citizen Nourishment
1. **Activation**: Discovered creatures are set as active **Citizens** wandering the map (up to 12).
2. **Nourishment**: Citizens require feeding (e.g., Red Fish from inventory, Water from tile collections) to stay active.
3. **Passive Harvest**: Every 24 hours, healthy, active citizens generate a passive gold output and random material bundles, which the player harvests to feed back into the Gold loop.

### D. The Collectible Card Engine: Mythic Cards
1. **Action**: Spending Gold on booster packs in the Market.
2. **Opening**: Opening packs unlocks rare, variants of cards (with holographic/color variants).
3. **Citizen Integration**: Mythics can be deployed as Citizens on the map, boasting higher base passive gold generation rates and rarer drop tables.

### E. The Active Battle Loop: Dungeon Crawling
1. **Preparation**: Draft a squad of up to 6 unlocked citizens/creatures.
2. **Adventure**: Battle monsters in dungeon rooms. Active fighters take damage; fainted characters must be swapped for survivors.
3. **Combat Drops**: Defeating dungeon challenges rewards gold, high-tier consumables (food/potions), and combat achievements.

---

## 3. Psychological Retention Anchors

| System | Psychological Driver | Game Realization |
| :--- | :--- | :--- |
| **Habit Engine** | Immediate gratification | Real-life tasks yield instantly spendable gold coins and visual level-ups. |
| **Kingdom Grid** | Ownership & Creativity | Placing and designing a personalized realm map gives visual permanence to hard work. |
| **Citizens** | Nurturing & Loss Aversion | Feeding virtual companions triggers daily responsibility; neglecting them pauses resource gains. |
| **Booster Packs** | Variable Rewards (Gacha) | Opening card packs satisfies collection desires and offers chance highlights. |
| **Dungeons** | Competence & Challenge | Assembling squads to overcome combat rooms validates the player's unlocked rosters. |
