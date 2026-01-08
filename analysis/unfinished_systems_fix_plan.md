---
description: Plan to fix unfinished systems and secure the admin dashboard.
---

# Plan: Fix Unfinished Systems & Secure Admin Dashboard

## Objective

Address the "Unfinished Systems" identified in the audit, specifically securing the Admin Dashboard for `jillesblokker@gmail.com` and fleshing out placeholder features.

## 1. Secure Admin Dashboard

**Current State:** `app/admin/page.tsx` is protected by `auth.protect()` in middleware but accessible to *any* logged-in user.
**Goal:** Restrict access to `jillesblokker@gmail.com` only.

**Steps:**

1. **Modify `app/admin/page.tsx`:**
    * Add a server-side or client-side check for `user.emailAddresses.includes('jillesblokker@gmail.com')`.
    * Since `page.tsx` is a Client Component (`use client`), we can check `useUser()`.
    * Ideally, we should also check on the usage of any admin APIs (`/api/admin/...`), but for now, we will focus on the UI access as requested.
    * If the user is not authorized, redirect to `/` or show an "Access Denied" message.

## 2. Implement Unfinished Admin Features

**Current State:**

* "Realm Map" tab -> "Coming soon..."
* "Quest Manager" tab -> "Coming soon..."

**Goal:** Provide basic functionality to remove the "unfinished" state.

**Steps:**

1. **Realm Map Editor (Basic):**
    * Replace the placeholder with a basic list of User's tiles or a simple form to "Add Tile" to a user (mocked or real if API exists).
    * Since a full Map Editor is complex, we will implement a "Tile Assigner" allowing the admin to give specific tiles to a user.
2. **Quest Manager (Basic):**
    * Replace the placeholder with a simple "Add Quest" form that calls the `POST /api/quests` endpoint (or a new admin endpoint if needed) to create global or user-specific quests.
    * This ensures the tab is functional, even if simple.

## 3. Address `challenges-ultra-simple` API

**Current State:** `POST` and `PATCH` return 501 Not Implemented.
**Goal:** Determine usage and fix or implement.

**Analysis:**

* It is used in `app/quests/page.tsx` and `app/kingdom/kingdom-client.tsx`.
* It seems to be a key endpoint for fetching challenges.
* **Fix:** Implement the `POST` and `PATCH` methods if they are actually called, or properly deprecate them.
  * If `page.tsx` calls them (e.g. for creating custom challenges?), we need them.
  * *Correction:* The grep showed usage. I'll stick to making sure they return meaningful errors or basics.
  * Actually, `PUT` is implemented for toggling completion. `POST` might be for *creating* challenges. I will implement a basic `POST` to insert a new challenge into the `challenges` table.

## 4. Fix UI Placeholders

**Current State:** `item-placeholder.svg` is used for default avatars in `components/account-menu.tsx`.
**Goal:** Use a better default or ensure the fallback logic is robust.

**Steps:**

1. **Account Menu:**
    * Ensure that if `user.imageUrl` is missing, we fall back to a generated avatar (e.g. initials) or a better static asset if available.
    * If `item-placeholder.svg` allows for a "broken" look, we will replace it with a generic "Knight" or "User" icon from Lucide or a specialized asset.

## Execution Order

1. **Security First:** Lock down `app/admin/page.tsx`.
2. **API Fixes:** Implement `POST` in `challenges-ultra-simple` to support the Quest Manager.
3. **Admin Features:** Build the simple Quest Manager and Tile Assigner in the Admin Dashboard.
4. **UI Polish:** Fix the avatar placeholder.
