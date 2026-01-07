# Mastery Ledger: Unified Habit & Goal System

## Overview

Transform the current quest and challenge system into a **Mastery-focused habit engine**. This combines the existing global streak rewards (Kingdom economy) with granular, individual habit tracking (The Mastery Ledger).

## 1. Database & API Changes

- **Table: `quests` & `custom_challenges`**
  - Add `mandate_period`: enum('daily', 'weekly', 'monthly') - Default: 'daily'
  - Add `mandate_count`: integer - Default: 1 (e.g., if period is weekly, count=3 means 3 times a week).
- **API: `GET /api/mastery/history`**
  - New endpoint to return a 7-day completion grid for all active habits.
- **API: `POST /api/quests` & `POST /api/challenges/custom`**
  - Support the new mandate fields.

## 2. Mastery Ledger Component (UI/UX)

- **7-Day Execution Grid**: A horizontal row of "Action Slots" for each habit.
  - Completed days show a color-coded **"Hero's Seal"**.
  - Streaks within the week (3+ days) cause the slots to **ignite** with a premium flame glow.
- **Weekly Progress Tracker**: A fraction (e.g., `2/4`) showing status against the weekly mandate.
- **Hall of Mastery Stats** (Right Pane):
  - **Monthly Goal %**: A luxurious progress bar (Iron -> Gold) showing fulfillment for the 30-day moon cycle.
  - **Completion Volumes**:
    - "Moon Cycles" (Monthly total completions).
    - "Eternal Record" (Lifetime total completions).
- **Ranking Crowns**: The top 3 most consistent habits automatically get Crown badges (Gold, Silver, Bronze).

## 3. Form Enhancements

- **Quest Creation**:
  - Add "The Strategic Mandate" section.
  - Simplified selectors for Frequency (Daily, Weekly) and Target Count.
- **Challenge Creation**:
  - Align with the Quest mandate logic for consistency.

## 4. Navigation & Integration

- **Quests Page**:
  - Add a "Progress" or "Mastery" toggle at the top level to switch between the **Daily Board** and the **Mastery Ledger**.
- **Kingdom Integration**:
  - Global Streak (Login Streak) remains at the top level, providing the multiplier for Kingdom property discounts.
  - Premium "Mastery Titles" earned in the Ledger will eventually unlock exclusive land plots.

## 5. Implementation Steps

1. Create SQL migration for mandate columns.
2. Update Zod schemas and TypeScript types.
3. Update API endpoints to handle mandate persistence.
4. Build the `MasteryLedger` UI component.
5. Integrate the ledger into `app/quests/page.tsx`.
6. Final polish on animations and responsiveness.
