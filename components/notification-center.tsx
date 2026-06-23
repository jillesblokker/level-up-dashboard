"use client"

import { logger } from "@/lib/logger";

import { useEffect, useState } from "react"
import Image from "next/image"
import { Bell, Mail, Trophy, MessageSquare, CheckCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { cn } from "@/lib/utils"
import { notificationService, NotificationData } from "@/lib/notification-service"

interface NotificationCenterProps {
  children?: React.ReactNode
}

interface ExtendedNotification {
  id: string;
  title: string;
  message: string;
  type: string;
  timestamp: string | Date;
  read: boolean;
  isServer: boolean;
  original?: any;
  action?: { href: string; label: string };
}

export function NotificationCenter({ children }: NotificationCenterProps = {}) {
  const [notifications, setNotifications] = useState<NotificationData[]>([])
  const [open, setOpen] = useState(false)
  const [serverNotifications, setServerNotifications] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchServerNotifications = async () => {
    try {
      const res = await fetch('/api/notifications');
      const data = await res.json();
      if (res.ok) {
        setServerNotifications(data.notifications || []);
      }
    } catch (error) {
      logger.error("Error fetching notifications:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setNotifications(notificationService.getNotifications())
    fetchServerNotifications();

    // Listen for new notifications
    const handleNewNotification = () => {
      setNotifications(notificationService.getNotifications())
      fetchServerNotifications();
    }

    window.addEventListener('newNotification', handleNewNotification)
    // Also listen for friend updates to refresh notifications
    window.addEventListener('friend-update', fetchServerNotifications)

    return () => {
      window.removeEventListener('newNotification', handleNewNotification)
      window.removeEventListener('friend-update', fetchServerNotifications)
    }
  }, [])

  // Add a function to delete a notification by id
  const handleDelete = (id: string) => {
    notificationService.deleteNotification(id)
    setNotifications(notificationService.getNotifications())
  };

  // Add a function to mark notification as read
  const handleMarkAsRead = async (id: string, isServer = false) => {
    if (isServer) {
      try {
        await fetch('/api/notifications', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ notificationIds: [id] })
        });
        fetchServerNotifications();
      } catch (error) {
        logger.error("Error marking as read:", error);
      }
    } else {
      notificationService.markAsRead(id)
      setNotifications(notificationService.getNotifications())
    }
  };

  const handleMarkAllRead = async () => {
    try {
      // Server
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationIds: 'all' })
      });
      fetchServerNotifications();

      // Local
      notificationService.markAllAsRead();
      setNotifications(notificationService.getNotifications());
    } catch (error) {
      logger.error("Error marking all as read:", error);
    }
  };

  const handleDeleteAll = async () => {
    try {
      // Server
      await fetch('/api/notifications', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationIds: 'all' })
      });
      fetchServerNotifications();

      // Local
      notificationService.clearAll();
      setNotifications([]);
    } catch (error) {
      logger.error("Error deleting all notifications:", error);
    }
  };

  const handleFriendAction = async (notification: any, action: 'accept' | 'reject') => {
    try {
      const friendshipId = notification.data.friendshipId;
      const res = await fetch(`/api/friends/${friendshipId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });

      if (res.ok) {
        // Mark notification as read
        handleMarkAsRead(notification.id, true);
        // Refresh notifications
        fetchServerNotifications();
        // Dispatch event to update friend list if needed
        window.dispatchEvent(new Event('friend-update'));
      }
    } catch (error) {
      logger.error("Error responding to friend request:", error);
    }
  };

  const handleQuestAction = async (notification: any, action: 'accept' | 'reject') => {
    try {
      const res = await fetch('/api/quests/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId: notification.id, action })
      });

      if (res.ok) {
        // Mark notification as read
        handleMarkAsRead(notification.id, true);
        // Refresh notifications
        fetchServerNotifications();
        // Trigger quest update
        window.dispatchEvent(new Event('quest-update'));
      }
    } catch (error) {
      logger.error("Error responding to quest:", error);
    }
  };

  // Merge local and server notifications for display
  const allNotifications: any[] = [
    ...serverNotifications.map(n => ({
      id: n.id,
      title: n.type === 'friend_request' ? 'New Friend Request' :
        n.type === 'friend_quest_received' ? 'New Quest Received' :
          n.type === 'friend_request_accepted' ? 'Friend Request Accepted' : 'Notification',
      message: n.type === 'friend_request' ? `${n.data.senderName} wants to be your ally!` :
        n.type === 'friend_quest_received' ? `${n.data.senderName} sent you a quest: "${n.data.questTitle}"` :
          n.type === 'friend_request_accepted' ? `${n.data.accepterName} is now your ally!` : '',
      type: 'social',
      timestamp: n.created_at,
      read: n.is_read,
      isServer: true,
      original: n
    })),
    ...notifications.map(n => ({ ...n, isServer: false }))
  ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const unreadCount = allNotifications.filter(n => !n.read).length;

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'social': return '👥'
      case 'achievement': return '🏆'
      case 'quest': return '📜'
      case 'levelup': return '⭐'
      case 'success': return '✅'
      case 'event': return '🎉'
      case 'discovery': return '🔍'
      case 'monster': return '👹'
      case 'system': return '⚙️'
      default: return '📢'
    }
  }

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'social': return 'text-blue-400'
      case 'achievement': return 'text-amber-400'
      case 'quest': return 'text-amber-400'
      case 'levelup': return 'text-amber-500'
      case 'success': return 'text-amber-400'
      case 'event': return 'text-zinc-400'
      case 'discovery': return 'text-amber-500'
      case 'monster': return 'text-red-600'
      case 'system': return 'text-zinc-400'
      default: return 'text-amber-400'
    }
  }

  // ... (keep existing helper functions)

  const EmptyState = () => (
    <div className="flex flex-col items-center justify-center h-full p-6 relative overflow-hidden">
      {/* Background with medieval theme */}
      <div className="absolute inset-0 bg-black" />

      {/* Main content */}
      <div className="relative z-10 text-center w-full px-4 mx-auto">
        {/* Original image */}
        <div className="relative mb-8 w-full aspect-[4/5] max-h-[45vh]">
          <Image
            src="/images/Notifications/no-mail.webp"
            alt="No mail"
            fill
            className="object-contain"
            priority
          />
        </div>

        {/* Text content */}
        <div className="space-y-4">
          <div className="space-y-2">
            <h3 className="text-xl font-bold text-amber-400 font-serif tracking-wide">
              No Messages Await
            </h3>
            <div className="w-16 h-0.5 bg-gradient-to-r from-transparent via-amber-500 to-transparent mx-auto"></div>
          </div>

          <div className="space-y-2">
            <p className="text-zinc-200 leading-relaxed font-medium">
              The courier has not yet arrived with news from your kingdom.
            </p>
            <p className="text-zinc-400 text-sm leading-relaxed">
              Complete quests and explore your realm to receive notifications from your loyal subjects.
            </p>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {children || (
          <Button variant="ghost" size="icon" aria-label="Open notification center" className="relative">
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-green-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
            <span className="sr-only">Notifications</span>
          </Button>
        )}
      </SheetTrigger>
      <SheetContent side="right" aria-label="notification-center-sidepanel" className="w-[95vw] md:w-96 bg-black border-l border-amber-800/20 p-0" aria-modal="true">
        {/* Enhanced Header */}
        <div className="relative p-6 border-b border-amber-800/20 bg-gradient-to-r from-zinc-900 to-zinc-800">
          <div className="flex flex-col gap-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
                  <Mail className="w-6 h-6 text-white" />
                </div>
                <div>
                  <SheetTitle className="text-xl font-bold text-amber-400 font-serif tracking-wide">Notifications</SheetTitle>
                  <p className="text-zinc-400 text-sm font-medium line-clamp-1">Kingdom Messages & Updates</p>
                </div>
              </div>

              {unreadCount > 0 && (
                <div className="bg-green-500 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center shadow-lg flex-shrink-0">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </div>
              )}
            </div>

            {unreadCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleMarkAllRead}
                className="w-full border-amber-800/20 text-amber-500 hover:text-amber-400 hover:bg-amber-900/20 hover:border-amber-500/50"
              >
                <CheckCheck className="h-4 w-4" />
                Mark All as Read
              </Button>
            )}

            {allNotifications.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDeleteAll}
                className="w-full text-red-400/70 hover:text-red-400 hover:bg-red-900/10"
              >
                Delete All
              </Button>
            )}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto max-h-[calc(100vh-120px)]">
          {isLoading ? (
            <div className="p-4 space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex gap-4 p-2">
                  <Skeleton className="h-10 w-10 rounded-lg bg-zinc-800" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4 bg-zinc-800" />
                    <Skeleton className="h-3 w-1/2 bg-zinc-800/50" />
                  </div>
                </div>
              ))}
            </div>
          ) : allNotifications.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="divide-y divide-amber-800/10">
              {(() => {
                // Group notifications
                const groupedNotifications = allNotifications.reduce((acc: any[], current) => {
                  const date = new Date(current.timestamp);
                  const isToday = date.toDateString() === new Date().toDateString();
                  const isYesterday = date.toDateString() === new Date(Date.now() - 86400000).toDateString();
                  const dayString = isToday ? 'Today' : isYesterday ? 'Yesterday' : date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
                  
                  const titleLower = (current.title || '').toLowerCase();
                  const messageLower = (current.message || '').toLowerCase();
                  
                  // Check if this notification is special and must stay individual:
                  // level up, new title unlocked, meditation complete, dungeon completed, mystery event rewards.
                  const isKeptSpecial = 
                    titleLower.includes('level up') ||
                    titleLower.includes('title earned') ||
                    titleLower.includes('meditation') ||
                    titleLower.includes('dungeon') ||
                    titleLower.includes('shrine') || 
                    titleLower.includes('discovery') ||
                    titleLower.includes('scroll') ||
                    messageLower.includes('meditation') ||
                    messageLower.includes('dungeon') ||
                    current.type === 'levelup' ||
                    current.type === 'monster' ||
                    current.type === 'social';

                  if (isKeptSpecial) {
                    acc.push(current);
                    return acc;
                  }

                  // Check if it's achievement
                  if (current.type === 'achievement') {
                    const achievementGroup = acc.find(n => n.type === 'achievement_group');
                    if (achievementGroup) {
                      achievementGroup.items.push(current);
                      if (new Date(current.timestamp) > new Date(achievementGroup.timestamp)) {
                        achievementGroup.timestamp = current.timestamp;
                      }
                      current.read = true;
                    } else {
                      acc.push({
                        type: 'achievement_group',
                        id: 'achievement-group',
                        title: 'Achievements Unlocked',
                        timestamp: current.timestamp,
                        items: [current]
                      });
                    }
                    return acc;
                  }

                  // Check for gold candidates
                  const isGold = messageLower.includes('gold') || titleLower.includes('gold');
                  if (isGold) {
                    const goldGroupKey = `gold-group-${dayString}`;
                    const goldGroup = acc.find(n => n.id === goldGroupKey);
                    
                    // Parse gold amount
                    const goldMatch = current.message.match(/(\d+)\s*gold/i) || current.title.match(/(\d+)\s*gold/i);
                    const amount = goldMatch ? parseInt(goldMatch[1]) : 0;

                    if (goldGroup) {
                      goldGroup.items.push(current);
                      goldGroup.totalGold += amount;
                      goldGroup.message = `Earned a total of +${goldGroup.totalGold} gold.`;
                      if (new Date(current.timestamp) > new Date(goldGroup.timestamp)) {
                        goldGroup.timestamp = current.timestamp;
                      }
                    } else {
                      acc.push({
                        type: 'gold_group',
                        id: goldGroupKey,
                        title: `Gold Gained (${dayString}) 💰`,
                        message: `Earned +${amount} gold.`,
                        timestamp: current.timestamp,
                        totalGold: amount,
                        items: [current]
                      });
                    }
                    return acc;
                  }

                  // Check for item candidates
                  const isItem = messageLower.includes('item') || messageLower.includes('items:') || messageLower.includes('artifact') || messageLower.includes('scroll');
                  if (isItem) {
                    const itemGroupKey = `item-group-${dayString}`;
                    const itemGroup = acc.find(n => n.id === itemGroupKey);
                    
                    // Parse items
                    const parsedItems = extractItems(current.message);

                    if (itemGroup) {
                      itemGroup.items.push(current);
                      parsedItems.forEach(pItem => {
                        const existing = itemGroup.itemsList.find((i: any) => i.name === pItem.name);
                        if (existing) {
                          existing.quantity += pItem.quantity;
                        } else {
                          itemGroup.itemsList.push(pItem);
                        }
                      });
                      
                      itemGroup.message = `Gained items:\n${itemGroup.itemsList.map((it: any) => `- ${it.name} (x${it.quantity})`).join('\n')}`;
                      if (new Date(current.timestamp) > new Date(itemGroup.timestamp)) {
                        itemGroup.timestamp = current.timestamp;
                      }
                    } else {
                      acc.push({
                        type: 'item_group',
                        id: itemGroupKey,
                        title: `Items Gained (${dayString}) 📦`,
                        message: parsedItems.length > 0 
                          ? `Gained items:\n${parsedItems.map(it => `- ${it.name} (x${it.quantity})`).join('\n')}`
                          : `Gained items from your adventures.`,
                        timestamp: current.timestamp,
                        itemsList: parsedItems,
                        items: [current]
                      });
                    }
                    return acc;
                  }

                  // Fallback: individual notification
                  acc.push(current);
                  return acc;
                }, []);

                return groupedNotifications.map((notification) => {
                  if (notification.type === 'achievement_group') {
                    return (
                      <AchievementGroup
                        key={notification.id}
                        notification={notification}
                        handleDelete={handleDelete}
                      />
                    );
                  }

                  if (notification.type === 'gold_group') {
                    return (
                      <GoldGroup
                        key={notification.id}
                        notification={notification}
                        handleMarkAsRead={handleMarkAsRead}
                        handleDelete={handleDelete}
                      />
                    );
                  }

                  if (notification.type === 'item_group') {
                    return (
                      <ItemGroup
                        key={notification.id}
                        notification={notification}
                        handleMarkAsRead={handleMarkAsRead}
                        handleDelete={handleDelete}
                      />
                    );
                  }

                  return (
                    <NotificationItem
                      key={notification.id}
                      notification={notification}
                      handleMarkAsRead={handleMarkAsRead}
                      handleDelete={handleDelete}
                      handleFriendAction={handleFriendAction}
                      handleQuestAction={handleQuestAction}
                    />
                  );
                })
              })()}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}

// Sub-components to avoid Rule of Hooks violations in loops

function extractItems(message: string): { name: string; quantity: number }[] {
  const items: { name: string; quantity: number }[] = [];
  
  if (!message) return items;

  // 1. Check for "Items: <item1>, <item2>, ..."
  const itemsMatch = message.match(/Items:\s*(.+)/i);
  if (itemsMatch && itemsMatch[1]) {
    const list = itemsMatch[1].split(',').map(s => s.trim());
    list.forEach(itemName => {
      if (itemName) {
        items.push({ name: itemName, quantity: 1 });
      }
    });
    return items;
  }
  
  // 2. Check for "You found the ancient scroll "<name>""
  const scrollMatch = message.match(/ancient scroll "([^"]+)"/i);
  if (scrollMatch && scrollMatch[1]) {
    items.push({ name: `Ancient Scroll: ${scrollMatch[1]}`, quantity: 1 });
    return items;
  }
  
  // 3. Check for "You found a mysterious artifact"
  if (message.includes('mysterious artifact')) {
    items.push({ name: 'Mysterious Artifact', quantity: 1 });
    return items;
  }
  
  // 4. Check for "You found an ancient artifact"
  if (message.includes('ancient artifact')) {
    items.push({ name: 'Ancient Artifact', quantity: 1 });
    return items;
  }

  // 5. Check for "You discovered <CreatureName>"
  const discoverMatch = message.match(/You've discovered ([^!]+)/i);
  if (discoverMatch && discoverMatch[1]) {
    items.push({ name: `${discoverMatch[1]} (Creature Card)`, quantity: 1 });
    return items;
  }
  
  return items;
}

function GoldGroup({ notification, handleMarkAsRead, handleDelete }: { notification: any, handleMarkAsRead: (id: string, isServer?: boolean) => void, handleDelete: (id: string) => void }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const unreadCount = notification.items.filter((n: any) => !n.read).length;

  const handleMarkGroupRead = (e: React.MouseEvent) => {
    e.stopPropagation();
    notification.items.forEach((item: any) => {
      if (!item.read) {
        handleMarkAsRead(item.id, item.isServer);
      }
    });
  };

  const handleGroupDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    notification.items.forEach((item: any) => {
      handleDelete(item.id);
    });
  };

  return (
    <div className="border-b border-amber-800/10">
      <div
        className={cn(
          "p-4 hover:bg-zinc-900 transition-all duration-200 cursor-pointer flex items-center justify-between",
          unreadCount > 0 && "bg-zinc-800/30"
        )}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-4">
          <div className="text-2xl mt-1 text-amber-500">💰</div>
          <div>
            <h4 className="font-semibold text-sm text-amber-400">{notification.title}</h4>
            <p className="text-sm text-zinc-300">{notification.message}</p>
            <span className="text-xs text-zinc-500 mt-1 block">
              {notification.items.length} gold transaction{notification.items.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={handleMarkGroupRead}
              className="text-[10px] uppercase font-bold tracking-wider text-blue-400 hover:text-blue-300 px-2 py-1 rounded border border-blue-600/30 hover:bg-blue-900/20"
            >
              Read All
            </button>
          )}
          <button
            onClick={handleGroupDelete}
            className="text-sm text-zinc-500 hover:text-red-400 p-1"
          >
            🗑️
          </button>
          <Button variant="ghost" size="sm" className="text-zinc-400 p-0 w-8 h-8">
            {isExpanded ? '▲' : '▼'}
          </Button>
        </div>
      </div>

      {isExpanded && (
        <div className="bg-zinc-900/30 divide-y divide-amber-800/10">
          {notification.items.map((item: any) => (
            <div key={item.id} className="p-4 pl-12 relative hover:bg-zinc-900 transition-all duration-200">
              <div className="flex justify-between items-start">
                <div>
                  <h5 className="font-medium text-white text-sm">{item.title}</h5>
                  <p className="text-sm text-zinc-300 mt-1">{item.message}</p>
                  <span className="text-xs text-zinc-500 mt-2 block">{new Date(item.timestamp).toLocaleString()}</span>
                </div>
                <div className="flex gap-2 items-center">
                  {!item.read && (
                    <button
                      onClick={() => handleMarkAsRead(item.id, item.isServer)}
                      className="text-xs text-blue-400 hover:underline"
                    >
                      Read
                    </button>
                  )}
                  {!item.isServer && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(item.id);
                      }}
                      className="text-zinc-500 hover:text-red-400 text-sm"
                    >
                      🗑️
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ItemGroup({ notification, handleMarkAsRead, handleDelete }: { notification: any, handleMarkAsRead: (id: string, isServer?: boolean) => void, handleDelete: (id: string) => void }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const unreadCount = notification.items.filter((n: any) => !n.read).length;

  const handleMarkGroupRead = (e: React.MouseEvent) => {
    e.stopPropagation();
    notification.items.forEach((item: any) => {
      if (!item.read) {
        handleMarkAsRead(item.id, item.isServer);
      }
    });
  };

  const handleGroupDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    notification.items.forEach((item: any) => {
      handleDelete(item.id);
    });
  };

  return (
    <div className="border-b border-amber-800/10">
      <div
        className={cn(
          "p-4 hover:bg-zinc-900 transition-all duration-200 cursor-pointer flex items-center justify-between",
          unreadCount > 0 && "bg-zinc-800/30"
        )}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-4">
          <div className="text-2xl mt-1 text-amber-500">📦</div>
          <div>
            <h4 className="font-semibold text-sm text-amber-400">{notification.title}</h4>
            <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-line">{notification.message}</p>
            <span className="text-xs text-zinc-500 mt-1 block">
              {notification.items.length} item event{notification.items.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={handleMarkGroupRead}
              className="text-[10px] uppercase font-bold tracking-wider text-blue-400 hover:text-blue-300 px-2 py-1 rounded border border-blue-600/30 hover:bg-blue-900/20"
            >
              Read All
            </button>
          )}
          <button
            onClick={handleGroupDelete}
            className="text-sm text-zinc-500 hover:text-red-400 p-1"
          >
            🗑️
          </button>
          <Button variant="ghost" size="sm" className="text-zinc-400 p-0 w-8 h-8">
            {isExpanded ? '▲' : '▼'}
          </Button>
        </div>
      </div>

      {isExpanded && (
        <div className="bg-zinc-900/30 divide-y divide-amber-800/10">
          {notification.items.map((item: any) => (
            <div key={item.id} className="p-4 pl-12 relative hover:bg-zinc-900 transition-all duration-200">
              <div className="flex justify-between items-start">
                <div>
                  <h5 className="font-medium text-white text-sm">{item.title}</h5>
                  <p className="text-sm text-zinc-300 mt-1">{item.message}</p>
                  <span className="text-xs text-zinc-500 mt-2 block">{new Date(item.timestamp).toLocaleString()}</span>
                </div>
                <div className="flex gap-2 items-center">
                  {!item.read && (
                    <button
                      onClick={() => handleMarkAsRead(item.id, item.isServer)}
                      className="text-xs text-blue-400 hover:underline"
                    >
                      Read
                    </button>
                  )}
                  {!item.isServer && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(item.id);
                      }}
                      className="text-zinc-500 hover:text-red-400 text-sm"
                    >
                      🗑️
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AchievementGroup({ notification, handleDelete }: { notification: any, handleDelete: (id: string) => void }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const unreadCount = notification.items.filter((n: any) => !n.read).length;

  return (
    <div className="border-b border-amber-800/10">
      <div
        className={cn(
          "p-4 hover:bg-zinc-900 transition-all duration-200 cursor-pointer flex items-center justify-between",
          unreadCount > 0 && "bg-zinc-800/30"
        )}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-4">
          <div className="text-2xl mt-1 text-amber-400">🏆</div>
          <div>
            <h4 className="font-semibold text-sm text-white">Achievements</h4>
            <p className="text-sm text-zinc-400">
              {notification.items.length} new achievement{notification.items.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <Button variant="ghost" size="sm" className="text-zinc-400">
          {isExpanded ? 'Collapse' : 'Expand'}
        </Button>
      </div>

      {isExpanded && (
        <div className="bg-zinc-900/30 divide-y divide-amber-800/10">
          {notification.items.map((item: any) => (
            <div key={item.id} className="p-4 pl-12 relative hover:bg-zinc-900 transition-all duration-200">
              <div className="flex justify-between items-start">
                <div>
                  <h5 className="font-medium text-amber-400 text-sm">{item.title}</h5>
                  <p className="text-sm text-zinc-300 mt-1">{item.message}</p>
                  <span className="text-xs text-zinc-500 mt-2 block">{new Date(item.timestamp).toLocaleString()}</span>
                </div>
                {!item.isServer && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(item.id);
                    }}
                    className="text-zinc-500 hover:text-red-400"
                  >
                    <span className="sr-only">Delete</span>
                    🗑️
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function NotificationItem({
  notification,
  handleMarkAsRead,
  handleDelete,
  handleFriendAction,
  handleQuestAction
}: {
  notification: any,
  handleMarkAsRead: (id: string, isServer?: boolean) => void,
  handleDelete: (id: string) => void,
  handleFriendAction: (notification: any, action: 'accept' | 'reject') => void,
  handleQuestAction: (notification: any, action: 'accept' | 'reject') => void
}) {
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'social': return '👥'
      case 'achievement': return '🏆'
      case 'quest': return '📜'
      case 'levelup': return '⭐'
      case 'success': return '✅'
      case 'event': return '🎉'
      case 'discovery': return '🔍'
      case 'monster': return '👹'
      case 'system': return '⚙️'
      default: return '📢'
    }
  }

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'social': return 'text-blue-400'
      case 'achievement': return 'text-amber-400'
      case 'quest': return 'text-amber-400'
      case 'levelup': return 'text-amber-500'
      case 'success': return 'text-amber-400'
      case 'event': return 'text-zinc-400'
      case 'discovery': return 'text-amber-500'
      case 'monster': return 'text-red-600'
      case 'system': return 'text-zinc-400'
      default: return 'text-amber-400'
    }
  }

  return (
    <div className={cn("p-4 relative hover:bg-zinc-900 transition-all duration-200", !notification.read && "bg-zinc-800/30")}>
      <div className="flex items-start gap-4">
        <div className={cn("text-2xl mt-1 flex-shrink-0", getNotificationColor(notification.type))}>
          {getNotificationIcon(notification.type)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <h4 className={cn("font-semibold text-sm flex items-center text-white leading-tight", getNotificationColor(notification.type))}>
              {notification.title}
            </h4>
            <span className="text-xs text-zinc-500 font-medium">
              {new Date(notification.timestamp).toLocaleString()}
            </span>
          </div>
          <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-line">
            {notification.message}
          </p>

          {/* Action Buttons for Friend Requests */}
          {notification.isServer && notification.original.type === 'friend_request' && !notification.read && (
            <div className="flex gap-2 mt-3">
              <Button size="sm" onClick={() => handleFriendAction(notification.original, 'accept')}>Accept</Button>
              <Button size="sm" variant="outline" onClick={() => handleFriendAction(notification.original, 'reject')}>Decline</Button>
            </div>
          )}

          {/* Action Buttons for Quest Requests */}
          {notification.isServer && notification.original.type === 'friend_quest_received' && !notification.read && (
            <div className="flex gap-2 mt-3">
              <Button size="sm" onClick={() => handleQuestAction(notification.original, 'accept')} className="bg-amber-600 hover:bg-amber-700 text-white border-none">Accept Quest</Button>
              <Button size="sm" variant="outline" onClick={() => handleQuestAction(notification.original, 'reject')} className="border-amber-600/50 text-amber-200 hover:bg-amber-900/30">Decline</Button>
            </div>
          )}

          <div className="flex flex-wrap gap-2 mt-4">
            {notification.action && (
              <button
                onClick={() => {
                  window.location.href = notification.action!.href
                }}
                className="text-xs font-medium text-amber-400 hover:text-amber-300 px-3 py-1.5 rounded-md border border-amber-600/30 hover:bg-amber-900/20 hover:border-amber-500/50 transition-all duration-200"
              >
                View Details →
              </button>
            )}
            {!notification.read && (
              <button
                onClick={() => handleMarkAsRead(notification.id, notification.isServer)}
                className="text-xs font-medium text-blue-400 hover:text-blue-300 px-3 py-1.5 rounded-md border border-blue-600/30 hover:bg-blue-900/20 hover:border-blue-500/50 transition-all duration-200"
              >
                Mark as Read
              </button>
            )}
            {!notification.isServer && (
              <button
                onClick={() => handleDelete(notification.id)}
                className="text-sm px-2 py-1.5 rounded-md border border-red-600/30 hover:bg-red-900/20 hover:border-red-500/50 transition-all duration-200"
                aria-label="Delete notification"
              >
                🗑️
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}





