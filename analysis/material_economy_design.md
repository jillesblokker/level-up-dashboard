# Material & Token Economy System Design

## Overview

This document outlines the system for integrating Materials and Streak Tokens into the Kingdom Property economy. This system transforms materials from simple loot into essential construction requirements and provides a valuable use for Streak Tokens as a "Wildcard" currency.

## Core Hierarchy

Buildings are divided into **Resource Tiers**.

- **Materials:** Required for construction (alongside Gold).
- **Streak Tokens:** An alternative currency. You can bypass material/gold costs by spending Tokens.

| Tier | Purpose | Cost Requirement | Token Alternative |
| :--- | :--- | :--- | :--- |
| **Tier 0** | **Resource Generation** | 💰 Gold Only | ❌ None (Gold Only) |
| **Tier 1** | **Housing & Infrastructure** | 💰 Gold + 🪵 Basic Materials | 🎟️ **1 Token** |
| **Tier 2** | **Advanced Functionality** | 💰 Gold + 🪵 Basic + 🧱 Refined | 🎟️ **2 Tokens** |
| **Tier 3** | **Prestige & Mastery** | 💰 Gold + 💎 Rare Materials | 🎟️ **3 Tokens** |

## Detailed Kingdom Property Costs

### Tier 0: The Starter Buildings (Resource Generators)

*The foundation of the economy. Must be purchased with Gold.*

| Building | Cost | Production | Token Cost |
| :--- | :--- | :--- | :--- |
| **Sawmill** | 120 Gold | 🪵 **Logs** (Common)<br>🪚 **Planks** (Uncommon) | N/A |
| **Farm** | 150 Gold | 🌾 **Wheat** (Common)<br>🥕 **Vegetables** (Common) | N/A |
| **Fisherman** | 120 Gold | 🐟 **Fish** (Food) | N/A |
| **Stone Quarry** (New) | 200 Gold | 🪨 **Stone** (Common)<br>🧱 **Stone Blocks** (Uncommon) | N/A |
| **Market Stall** | 400 Gold | 💰 **Gold** (Pure economy) | N/A |

### Tier 1: Basic Infrastructure

*Essential for growth. Requires output from Tier 0.*

| Building | Gold + Material Cost | Token Alternative | Benefit |
| :--- | :--- | :--- | :--- |
| **House** | 100 G + 🪵 10 Logs | 🎟️ **1 Token** | Population/Tax |
| **Well** | 100 G + 🪨 5 Stone | 🎟️ **1 Token** | Health Potions |
| **Windmill** | 180 G + 🪵 20 Logs | �️ **1 Token** | Processed Food |
| **Stable** | 120 G + 🪵 30 Logs | 🎟️ **1 Token** | Mounts |
| **Inn** | 220 G + 🪵 40 Logs | 🎟️ **1 Token** | High Gold |

### Tier 2: Advanced Buildings

*Requires processed materials or larger quantities.*

| Building | Gold + Material Cost | Token Alternative | Benefit |
| :--- | :--- | :--- | :--- |
| **Blacksmith** | 200 G + 🪵 20 Logs + 🪨 20 Stone | 🎟️ **2 Tokens** | Weapons/Armor |
| **Library** | 240 G + 🪵 50 Planks | 🎟️ **2 Tokens** | Scrolls |
| **Food Court** | 250 G + 🪵 40 Planks | 🎟️ **2 Tokens** | High Tier Food |
| **Archery** | 150 G + 🪵 40 Logs | �️ **2 Tokens** | Ranged Weapons |

### Tier 3: Prestige Buildings

*End-game dominance.*

| Building | Gold + Material Cost | Token Alternative | Benefit |
| :--- | :--- | :--- | :--- |
| **Mansion** | 1,500 G + 🪵 100 Planks + 🧱 50 Block | 🎟️ **3 Tokens** | Massive Gold |
| **Castle** | 5,000 G + 🧱 200 Block + ⚔️ 50 Steel | 🎟️ **3 Tokens** | Ultimate Status |
| **Wizard** | 2,000 G + 🧱 100 Block + 💎 10 Crystal | 🎟️ **3 Tokens** | Rare Scrolls |
| **Mayor** | 800 G + 🪵 100 Planks + 🧱 20 Block | 🎟️ **3 Tokens** | Politics |

## Implementation Plan

1. **Data Structure**:
    - Add `materialCost` (Item ID + Qty) to `KingdomTile` in `lib/kingdom-tiles.ts`.
    - Add `tokenCost` (Number) to `KingdomTile`.
2. **Item Updates**:
    - Ensure all materials (Logs, Stone, etc.) exist in `comprehensive-items.ts`.
3. **UI Updates**:
    - Modify `KingdomPropertiesInventory` (or the purchase modal) to show two "Buy" buttons:
        - [Buy] (Gold: 100, Logs: 10)
        - [Redeem] (Tokens: 1)
4. **Logic**:
    - Wire up `buyTileWithMaterials` and `buyTileWithTokens` functions.
