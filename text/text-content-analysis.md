# Text Content Analysis by Page

This document contains all user-facing text content from each page, grouped by page for easy review and identification of strings that need updating or changing.

## **Home Page (`app/page.tsx`)**
- Redirects to `/kingdom` - no user-facing text

## **Kingdom Page (`app/kingdom/page.tsx`)**
- **Loading message**: "Loading your kingdom…"

## **Kingdom Client (`app/kingdom/kingdom-client.tsx`)**
- **Potion Perk Names**:
  - "Elixir of Strength"
  - "Elixir of Wisdom" 
  - "Elixir of Fortitude"
- **Perk Effects**:
  - "Might Mastery" - "+10% XP & gold from Might activities per level"
  - "Vitality Sage" - "+10% XP & gold from Vitality activities per level"
  - "Knowledge Seeker" - "+10% XP & gold from Knowledge activities per level"
  - "Honor Guard" - "+10% XP & gold from Honor activities per level"
  - "Castle Steward" - "+10% XP & gold from Castle activities per level"
  - "Craft Artisan" - "+10% XP & gold from Craft activities per level"

## **Quests Page (`app/quests/page.tsx`)**
*[Content too large - would need separate extraction]*

## **Realm Page (`app/realm/page.tsx`)**
*[Content too large - would need separate extraction]*

## **Character Page (`app/character/page.tsx`)**

### **Page Title & Header**
- "Character"
- "Character Overview" - "Your current progress, title, and active bonuses"
- "Level {level}"
- "Title"
- "Active Bonuses"

### **Title System**
- **Title Names**:
  - "Novice Adventurer" - "A beginner on the path to greatness."
  - "Iron-Willed" - "One who has shown exceptional determination."
  - "Strength Seeker" - "A dedicated practitioner of physical power."
  - "Knowledge Keeper" - "A scholar who values wisdom above all."
  - "Winter Warrior" - "One who thrives in the coldest season."
  - "Legendary Hero" - "A true legend whose deeds will be remembered."

### **Perk System**
- **Perk Names**:
  - "Might Mastery" - "Increase XP and gold from Might quests and milestones."
  - "Knowledge Seeker" - "Increase XP and gold from Knowledge quests and milestones."
  - "Honor Guard" - "Increase XP and gold from Honor quests and milestones."
  - "Castle Steward" - "Increase XP and gold from Castle quests and milestones."
  - "Craft Artisan" - "Increase XP and gold from Craft activities per level."
  - "Vitality Sage" - "Increase XP and gold from Vitality activities per level."

### **Strength System**
- **Strength Categories**:
  - "Might" - "Physical strength and combat prowess"
  - "Knowledge" - "Intellectual wisdom and learning"
  - "Honor" - "Noble character and integrity"
  - "Castle" - "Leadership and governance"
  - "Craft" - "Artisan skills and craftsmanship"
  - "Vitality" - "Health, endurance, and life force"
  - "Wellness" - "Mental and physical well-being"
  - "Exploration" - "Discovery and adventure"

### **UI Messages**
- "No enchanted blessings active. Seek the mystic arts to unlock your true potential."
- "Perk Locked" - "This perk requires level {level} to unlock."
- "Cannot Activate" - "This perk can only be activated once per week."
- "Insufficient Gold" - "You need {cost} gold to activate this perk."
- "Perk Activated" - "{name} is now active for 24 hours!"
- "Perk Deactivated" - "{name} has been deactivated."
- "Max Level Reached" - "This perk is already at maximum level."
- "Perk Upgraded" - "{name} is now level {level}!"
- "Character Page Error"
- "Reload Page"
- "Loading character data..."
- "Current Title"
- "Achieved"
- "Locked"
- "Requires Level {level}"
- "Unlocked"
- "Active"
- "Deactivate"
- "Activate ({cost} gold)"
- "Upgrade ({cost} gold)"
- "Reach Lvl {level} to unlock"
- "Mastery"

## **Achievements Page (`app/achievements/page.tsx`)**

### **Page Header**
- "Creature Collection"
- "No achievements unlocked yet. Start exploring to discover creatures!"

### **Section Headers**
- "Creatures"
- "Monster Battles"

### **Achievement Names**
- "Ancient Dragon Slayer" - "Defeat Dragoni in a Simon Says battle"
- "Goblin Hunter" - "Defeat Orci in a Simon Says battle"
- "Troll Crusher" - "Defeat Trollie in a Simon Says battle"
- "Dark Wizard Vanquisher" - "Defeat Sorcero in a Simon Says battle"
- "Pegasus Tamer" - "Defeat Peggie in a Simon Says battle"
- "Fairy Friend" - "Defeat Fairiel in a Simon Says battle"

### **UI Controls**
- "Hide unlocked" / "Show unlocked"
- "Loading Clerk..."
- "No creatures defined."

### **Stats Display**
- "HP", "Attack", "Defense", "Speed", "Type", "Description"

## **Inventory Page (`app/inventory/page.tsx`)**

### **Page Header**
- "Inventory" - "Manage your collected items, equipment, and resources"

### **Item Types**
- "Resources" 🌿
- "Items" 📦
- "Creatures" 🐉
- "Scrolls" 📜
- "Equipment" ⚔️
- "Artifacts" 🏺
- "Books" 📚
- "Mounts" 🐎
- "Weapons" 🗡️
- "Shields" 🛡️
- "Armor" 🦺

### **UI Messages**
- "Loading Inventory..." - "Fetching your items from the database"
- "Your Items" - "{count} items found"
- "🔄 Refresh"
- "All"
- "No items found"
- "Your inventory is empty. Start collecting items by completing quests and exploring the realm!"
- "No {type} items found. Try completing quests or exploring different areas."
- "Equipped" / "{type}"
- "Quantity: {count}"

## **Market Page (`app/market/page.tsx`)**

### **Page Header**
- "Market" - "Purchase tiles to expand your kingdom"
- "Back to Kingdom"
- "Checkout ({count})"

### **Tile Types**
- "Grassland" - "A simple grassy plain."
- "Forest" - "A dense forest with tall trees."
- "Lake" - "A serene body of water with gentle waves."
- "Mountain" - "A tall, rocky mountain peak."
- "Desert" - "A hot, sandy desert landscape."
- "Ancient Temple" - "A mysterious temple from a forgotten era."
- "Desert Oasis" - "A lush oasis in the middle of the desert."
- "Coastal Village" - "A small fishing village by the sea."

### **Rarity Levels**
- "Common", "Uncommon", "Rare", "Epic"

### **Categories**
- "Terrain", "Special"

### **UI Messages**
- "Search tiles..."
- "All"
- "Filters"
- "Cart" - "{count} items"
- "Your cart is empty"
- "Total" - "{cost} Gold"
- "Purchase"
- "Available Tiles" - "{count} tiles"
- "Add to Cart"
- "Added to cart" - "{name} has been added to your cart."
- "Removed from cart" - "Item has been removed from your cart."
- "Cart is empty" - "Add some tiles to your cart before checking out."
- "Not enough gold" - "You need {cost} gold to purchase these tiles."
- "Purchase successful" - "You've purchased {count} tiles for {cost} gold."

## **Notifications Page (`app/notifications/page.tsx`)**

### **Page Header**
- "Notifications" - "Kingdom Messages & Updates"
- "Back to Kingdom"

### **Sample Notifications**
- "New achievement" - "You've earned the 'Early Riser' achievement for completing 5 tasks before 9 AM."
- "Quest Completed" - "You've successfully completed the 'Strength Foundation' quest and earned 50 gold!"
- "Friend Request" - "Michael Chen has sent you a friend request."
- "New Challenge Available" - "A new seasonal challenge 'Spring Renewal' is now available!"
- "Daily Streak Bonus" - "You've maintained a 7-day streak! You've earned a bonus of 25 gold."
- "New Challenge" - "Sarah has challenged you to a 'Push-up Challenge'!"

### **Notification Types**
- "Achievements" 🏆
- "Quests" 💰
- "Friends" 🔔
- "System" ✅

### **UI Controls**
- "Search Messages"
- "Search notifications..."
- "Message Type"
- "All Messages"
- "Unread Messages"
- "Mark All as Read"
- "Clear All Messages"
- "All notifications marked as read" - "You've caught up on all your kingdom's news!"
- "Notification deleted" - "The message has been removed from your inbox."
- "All notifications cleared" - "Your inbox is now empty and ready for new messages."

### **Empty States**
- "No Messages Await" - "The courier has not yet arrived with news from your kingdom."
- "Complete quests and explore your realm to receive notifications from your loyal subjects."
- "All Messages Read" - "You've caught up on all your kingdom's news and updates."
- "Continue your adventures to receive new notifications from your realm."

### **Time Formatting**
- "Just now"
- "{minutes} minute(s) ago"
- "{hours} hour(s) ago"
- "{days} day(s) ago"

## **Profile Page (`app/profile/page.tsx`)**

### **Page Header**
- "Join the Kingdom" - "Access your realm, customize your avatar, and track your progress by signing in."
- "Sign In to Your Realm"

### **Profile Info**
- "Realm Explorer"
- "Active"
- "Avatar Customization"
- "Profile Information"
- "Avatar Appearance"

### **Avatar Types**
- "Initial" - "Use initial avatar"
- "Default" - "Use default avatar"
- "Custom" - "Use uploaded avatar"

### **Form Labels**
- "Choose Avatar Type"
- "Upload New Image"
- "Display Name"
- "Email Address"
- "Background Color"
- "Text Color"
- "Preview"

### **UI Messages**
- "Loading your profile..."
- "File size must be less than 5MB"
- "File must be an image"
- "Avatar updated successfully"
- "Failed to update avatar"
- "Profile updated successfully"
- "Failed to update profile"
- "Recommended: Square image, max 5MB. Your image will be cropped to fit."
- "Email address is managed by your authentication provider."
- "This is how your avatar will appear in the realm."
- "Appearance customization is only available for initial avatars."
- "Switch to "Initial" avatar type to customize colors."
- "Save Changes"
- "Saving Changes..."
- "Crop Avatar" - "Crop your profile image to the perfect size"
- "Cancel"
- "Save Avatar" / "Saving..."

## **Settings Page (`app/settings/page.tsx`)**

### **Page Header**
- "Settings" - "Manage your account and preferences"
- "Back to Kingdom"

### **Tab Labels**
- "Profile"
- "Account"

### **Profile Section**
- "Character Profile" - "Update your character information"
- "Character Name"
- "Email Address"
- "Your email is used for notifications and account recovery"
- "Save Changes"

### **Account Section**
- "Tutorial & Onboarding" - "Manage tutorial and onboarding settings"
- "Show the tutorial again to refresh your knowledge of the game."
- "Show Tutorial"
- "Reset the tutorial to show it automatically on your next visit."
- "Reset Tutorial"

### **GitHub Connection**
- "GitHub Connection"
- "Your account is connected to GitHub" / "Connect your account to GitHub to sync your data"
- "Connected as: GitHub User"

### **UI Messages**
- "Profile Updated" - "Your profile information has been saved."
- "Error" - "Failed to save profile information."
- "Onboarding Reset" - "The tutorial will be shown again on your next visit."

## **Account Page (`app/account/page.tsx`)**

### **Page Header**
- "Account Settings" - "Manage your profile and preferences"

### **Menu Items**
- "Profile" - "Manage your profile and personal information"
- "Monitoring" - "View performance metrics and system health"
- "Stored Data" - "Manage your local data and preferences"
- "Settings" - "Configure app preferences and options"
- "Guide" - "Open tutorial and learn the basics"

## **Restore Progress Page (`app/restore-progress/page.tsx`)**

### **Page Header**
- "Restore Quest Progress" - "Restore your quest completion progress and rewards from the database."
- "Back to Quests"

### **Main Content**
- "Quest Progress Restore"
- "This will restore your quest completion progress and add the corresponding XP and gold rewards to your character."
- "The system will find all completed quests in your database and restore the rewards."
- "Restore Quest Progress" / "Restoring Progress..."

### **Success Messages**
- "Progress Restored!" - "Successfully restored {count} quest completions with {xp} XP and {gold} gold!"
- "Restore Successful!"
- "• Restored {count} quest completions"
- "• Added {xp} XP to your character"
- "• Added {gold} gold to your character"
- "• New total: {xp} XP, {gold} gold"

### **Error Messages**
- "Restore Failed" - "Failed to restore progress"

## **Restore Stats Page (`app/restore-stats/page.tsx`)**

### **Page Header**
- "Restore Character Stats" - "Restore your character stats from localStorage to the database"

### **Debug Information**
- "Debug Information"
- "localStorage Available: Yes/No"
- "Character Stats Found: Yes/No"
- "Kingdom Expansions Found: Yes/No"
- "User Authenticated: Yes/No"
- "API Endpoint: /api/restore-stats"

### **Actions**
- "Test Database Connection"
- "Local Storage Data Found:"
- "Restore to Database" / "Restoring..."

### **Stats Display**
- "Gold: {amount}"
- "Experience: {amount}"
- "Level: {amount}"
- "Health: {current}/{max}"
- "Build Tokens: {amount}"
- "Kingdom Expansions: {amount}"

### **Success/Error Messages**
- "Stats restored successfully!"
- "Database connection test completed"
- "Failed to restore stats"
- "Network error while restoring stats"
- "No Local Storage Data Found"
- "No character stats found in localStorage. This means either:"
- "• Your stats were already cleared"
- "• You haven't played the game yet"
- "• The data is stored differently"

### **Help Text**
- "What this does:"
- "• Reads your character stats from localStorage"
- "• Saves them to the database permanently"
- "• Creates transaction records for audit trail"
- "• Updates all game components automatically"

---

## **Key Areas for Text Review**

### **1. Medieval/Fantasy Theme Consistency**
- Many pages use modern language that could be more thematic
- Consider replacing "Settings" with "Realm Configuration"
- "Profile" could be "Character Scroll"
- "Notifications" could be "Kingdom Messages"

### **2. Toast Messages (Already Improved)**
- ✅ Realm page toast messages have been updated with medieval theme
- Consider applying similar improvements to other pages

### **3. Button Text**
- Many buttons use generic text like "Save Changes", "Cancel", "Delete"
- Could be more thematic: "Seal the Scroll", "Abandon Quest", "Banish Item"

### **4. Error Messages**
- Current error messages are technical and not user-friendly
- Could be more thematic: "The realm's magic has failed" instead of "Network error"

### **5. Loading States**
- "Loading..." could be "Consulting the ancient scrolls..."
- "Saving..." could be "Inscribing to the realm's records..."

### **6. Empty States**
- Some empty states are good (like notifications page)
- Others could be more engaging and thematic

### **7. Form Labels**
- Technical labels like "Display Name" could be "Realm Name"
- "Email Address" could be "Scroll Delivery Address"

This analysis provides a comprehensive view of all text content that could benefit from theming improvements to create a more cohesive medieval/fantasy experience.
