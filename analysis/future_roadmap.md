# Future Development Roadmap

This document outlines extensive implementation plans for the next three major features: **The Marketplace**, **Dungeons**, and the **Admin Panel**.

---

## 🏗️ Option 1: The Marketplace (Economy System)

**Goal:** Create a player-driven economy where users can buy and sell items or purchase exclusive system items with Gold.

### Phase 1: Database Architecture

* **Table: `market_listings`**
  * `id` (UUID)
  * `seller_id` (UUID, refers to User)
  * `item_type` (String: 'tile', 'consumable', 'equipment')
  * `item_id` (String, specific item identifier e.g., 'tile_mountain')
  * `price` (Integer, gold cost)
  * `status` (String: 'active', 'sold', 'cancelled')
  * `created_at` (Timestamp)

### Phase 2: Backend API (`/api/market`)

* **GET `/`**: Fetch active listings. Filters: `type`, `price_min`, `price_max`.
* **POST `/list`**: Create a new listing.
  * *Validation:* Check if user actually owns the item/tile. Deduct item from their inventory immediately (escrow).
* **POST `/buy`**: Purchase an item.
  * *Transaction:* Atomic transaction. Check Buyer Gold >= Price. Transfer Gold from Buyer to Seller. Transfer Item from Escrow to Buyer. Mark listing as 'sold'.

### Phase 3: Frontend UI (`app/market`)

* **Browse Tab**: Grid view of items. Sort by "Newest" or "Lowest Price".
* **Sell Tab**: specific UI showing your inventory with "Sell" buttons.
* **My Listings**: Dashboard to cancel unsold listings or claim earnings (if not auto-transferred).

---

## 🐉 Option 2: Dungeons (Gameplay Loop)

**Goal:** A simplified "Roguelike" minigame where users spend energy/health to fight a series of encounters for loot.

### Phase 1: Mechanics Design

* **Structure:** A Dungeon is a sequence of 5-10 "Rooms".
* **Rooms:** Can be `Combat` (vs Monster), `Treasure` (Free loot), or `Event` (Riddle/Choice).
* **Stats:** Uses the user's `Might`, `Vitality` (Health), and `Knowledge` (for riddles).

### Phase 2: Database Schema

* **Table: `dungeon_runs`**
  * `id`, `user_id`, `start_time`, `end_time`
  * `current_room` (Integer)
  * `current_hp` (Integer)
  * `status` ('in_progress', 'completed', 'died')
  * `loot_collected` (JSONB array of items found)

### Phase 3: Implementation

* **API `/api/dungeon/start`**: Dedicates Energy/Gold to begin. Generates a random seed for the run.
* **API `/api/dungeon/action`**: Inputs: `action` ('attack', 'flee', 'solve'). Calculates result based on stats vs monster difficulty. Updates `current_hp`.
* **Victory/Defeat**: If HP <= 0, run ends (maybe lose some loot). If Room 10 cleared, grand prize awarded.

---

## 🛡️ Option 3: Admin General (Management)

**Goal:** A robust tool for you (the developer) to manage users, fix data issues, and monitor game health without using SQL directly.

### Phase 1: Security & Auth

* **Role Management**: Add `role` column to `user_preferences` or separate `admins` table.
* **Middleware**: STRICT protection on `/api/admin/*`. checks if `user.role === 'admin'`.

### Phase 2: User Management Tab

* **Search**: Find user by Email/Username.
* **Edit Stats**: Simple form to Set Gold, XP, or Level manually (e.g., to reimburse a bugged quest).
* **Ban/Mute**: Flags to prevent login or social posting.

### Phase 3: Game Management

* **Item Spawner**: "Give Item" to specific user ID.
* **Announcement System**: Create a "System Notification" sent to ALL users (e.g., "Server maintenance in 10 mins").

---

## 💡 Recommendation

Start with **Option 1 (Marketplace)**. It connects nicely with the work you just did on Inventory and Social, and gives immediate value to the Gold players are earning from Challenges!
