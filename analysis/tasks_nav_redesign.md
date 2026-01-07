# UX/UI & Information Architecture Blueprint: Unified Task Navigation

## 1. The Core Problem: "Tab-in-Tab" Paralysis

The current navigation uses 3 distinct layers of selection to reach content:

* **Layer 1:** View Toggle (Board vs Ledger)
* **Layer 2:** Primary Tabs (Daily vs Kingdom vs Milestones)
* **Layer 3:** Sub-categories (Active vs Available)

This creates **"hidden silos"**—where a user might forget to check their Kingdom Challenges because they are visually partitioned away from their Daily Deeds.

## 2. Proposed Architecture: The "Three Pillars" Approach

We will collapse the multi-layer tabs into **three high-level perspectives** accessible via a single, premium navigation bar.

### A. The Forge (The Active Board)

* **Concept:** A unified hub for "What must be done now."
* **Structure:** A single, vertically scrolling view containing:
  * **Strategic Mandates (Dailies):** Persistent habit tracking.
  * **Kingdom Quests (Challenges):** One-off or epic tasks.
  * *Note: Use collapsible section headers to keep it organized.*
* **Benefit:** Zero switching required to see all immediate obligations.

### B. The Ledger (The Mastery View)

* **Concept:** "How am I progressing long-term?"
* **Structure:**
  * Performance grids (7-day/Yearly views).
  * Strategic fulfillment stats.
* **Benefit:** Separates "Doing" from "Analyzing."

### C. The Sanctuary (The Milestones)

* **Concept:** "What am I building toward?"
* **Structure:** Legacy milestones and ultimate trophies.
* **Benefit:** Keeps long-term achievements distinct from daily chores.

---

## 3. UI Implementation Plan

### 1. The "Perspective Switcher" (Single Layer)

Replace the current toggle and tabs with a **custom segmented control** at the top of the page:
`[ ⚔️ THE FORGE ] [ 📜 THE LEDGER ] [ 🏛️ THE SANCTUARY ]`

* **Max 1 Layer:** No sub-tabs allowed.
* **Visual Priority:** Highlighting the current "Perspective" with ambient glows (Orange for Forge, Amber for Ledger, Blue for Sanctuary).

### 2. The Unified Feed (The Forge)

Inside "The Forge," instead of tabs, we use **Dynamic Sections**:

* **Section 1: Daily Edicts** (Previously 'Daily Deeds')
* **Section 2: Kingdom Decrees** (Previously 'Kingdom Challenges')
* **Section 3: Errands** (Minor tasks)
* *Implementation:* Use a "Filter Chip" row (Small pills: All, Combat, Knowledge, etc.) to narrow the feed if it gets too long, rather than hard tabs.

### 3. Smart Filtering (The "Aura" System)

Instead of "Active/Available" tabs, use a subtle **State Filter** or group them by priority.

* **High Priority:** Strategic Mandates that need fulfillment today.
* **Secondary:** Available challenges you can embark on.

---

## 4. Expected Outcomes

* **Reduced Friction:** One click to see everything that matters.
* **Increased Engagement:** Users see "Available Challenges" as they scroll past their "Dailies," encouraging them to take on more.
* **Premium Feel:** The "Three Pillars" naming convention (Forge/Ledger/Sanctuary) enhances the medieval RPG immersion.
