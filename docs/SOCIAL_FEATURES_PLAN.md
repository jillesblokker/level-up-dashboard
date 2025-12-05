# Social Features Implementation Plan

## 1. Database Schema Updates
We need new tables to manage relationships and interactions between users.

### 1.1 Friends Table
- **`friends` table**:
    - `id` (UUID, PK)
    - `user_id` (TEXT, FK to users) - The requester
    - `friend_id` (TEXT, FK to users) - The recipient
    - `status` (TEXT: 'pending', 'accepted', 'rejected')
    - `created_at` (TIMESTAMP)
    - `updated_at` (TIMESTAMP)
- **Indexes**: On `user_id` and `friend_id` for fast lookups.

### 1.2 Notifications Table
- **`notifications` table**:
    - `id` (UUID, PK)
    - `user_id` (TEXT, FK to users) - Recipient of the notification
    - `type` (TEXT: 'friend_request', 'friend_quest_received', 'friend_quest_completed', 'friend_request_accepted')
    - `data` (JSONB) - Stores relevant details (e.g., sender_name, quest_id)
    - `is_read` (BOOLEAN)
    - `created_at` (TIMESTAMP)

### 1.3 Friend Quests
- **Update `quests` table** (or new `friend_quests` table):
    - Add `is_friend_quest` (BOOLEAN)
    - Add `sender_id` (TEXT, FK to users)
    - Add `recipient_id` (TEXT, FK to users)
    - Friend quests will appear in the recipient's quest log with a special "Friend Quest" label.

---

## 2. API Endpoints

### 2.1 Friend Management (`/api/friends`)
- **`GET /api/friends`**: List all accepted friends with their basic stats.
- **`POST /api/friends/request`**: Send a friend request by username.
    - *Logic*: Search user by username -> Check if exists -> Create 'pending' record in `friends` table -> Create notification.
- **`PUT /api/friends/respond`**: Accept or Reject a request.
    - *Logic*: Update status in `friends` table -> Create "accepted" notification for sender.
- **`DELETE /api/friends/remove`**: Unfriend a user.

### 2.2 User Search (`/api/users/search`)
- **`GET /api/users/search?query=username`**: Find users to add.
    - *Privacy*: Only return exact matches or safe partial matches.

### 2.3 Friend Stats (`/api/friends/stats`)
- **`GET /api/friends/stats?friendId=...`**: Fetch detailed stats for a friend.
    - Level, Gold, XP.
    - Counts of completed Quests, Challenges, Milestones (broken down by category).

### 2.4 Friend Quests (`/api/quests/friend`)
- **`POST /api/quests/friend`**: Create and assign a quest to a friend.
    - Validates that users are friends.
    - Creates a quest record assigned to the `recipient_id`.
    - triggers a notification.

---

## 3. "Allies" Page (`/allies`)

### 3.1 Friends List & Management
- **My Allies Section**:
    - Grid/List view of all accepted friends.
    - **Quick Stats Card**: Shows Avatar, Name, Level, and a "Compare" button.
- **Add Friend Section**:
    - Search bar to find users by username.
    - "Send Request" button.
- **Pending Requests**:
    - Distinct section for incoming friend requests with "Accept" and "Decline" buttons.

### 3.2 Detailed Comparison View
- **Comparison Modal/Page**:
    - Side-by-side comparison of You vs. Friend.
    - **Metrics**:
        - Total Gold Earned
        - Current Level & XP
        - **Progress Bars**:
            - Quests Completed (Physical, Mental, etc.)
            - Challenges Completed
            - Milestones Achieved

---

## 4. Friend Quests Feature

### 4.1 Sending a Quest
- **"Send Quest" Button** on the Allies page (on a friend's card).
- **Creation Modal**:
    - Title & Description.
    - Difficulty (Easy, Medium, Hard).
    - Category (Physical, Mental, etc.).
    - **Rewards**: Sender can optionally "pledge" gold/items? (Or system generates standard rewards).
    - *Note*: User requested "requirements of an add quest", implying standard quest creation fields.

### 4.2 Receiving & Viewing
- **Quest Log**:
    - Friend Quests appear in the main Quest Log.
    - **Visual Distinction**: Gold border or "Friend Quest" badge.
    - **Sender Info**: "Sent by [FriendName]".
- **Notifications**:
    - "New Quest from [FriendName]!" notification in the top bar.

---

## 5. Notification System UI

### 5.1 Top Navigation Update
- Add a **Bell Icon** to the top navigation bar.
- **Dropdown/Popover**:
    - Shows recent friend requests and quest notifications.
    - Quick actions (Accept Request) directly from the dropdown.
    - "Mark all as read" button.

---

## 6. Privacy & Settings
- **Privacy Settings**:
    - Toggle: "Allow others to find me by username".
    - Toggle: "Allow friends to see my detailed stats".
