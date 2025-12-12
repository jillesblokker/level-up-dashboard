"use client"

import { useEffect, useState } from "react"
import { Bell, Mail, Trophy, MessageSquare } from "lucide-react"
import { Button } from "@/components/ui/button"
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

  const fetchServerNotifications = async () => {
    try {
      const res = await fetch('/api/notifications');
      const data = await res.json();
      if (res.ok) {
        setServerNotifications(data.notifications || []);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
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
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id, action: 'mark_read' })
        });
        fetchServerNotifications();
      } catch (error) {
        console.error("Error marking as read:", error);
      }
    } else {
      notificationService.markAsRead(id)
      setNotifications(notificationService.getNotifications())
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
      console.error("Error responding to friend request:", error);
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
      console.error("Error responding to quest:", error);
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
      case 'event': return 'text-gray-400'
      case 'discovery': return 'text-amber-500'
      case 'monster': return 'text-red-600'
      case 'system': return 'text-gray-400'
      default: return 'text-amber-400'
    }
  }

  // ... (keep existing helper functions)

  const EmptyState = () => (
    <div className="flex flex-col items-center justify-center h-full p-6 relative overflow-hidden">
      {/* Background with medieval theme */}
      <div className="absolute inset-0 bg-black" />

      {/* Main content */}
      <div className="relative z-10 text-center w-full max-w-sm mx-auto">
        {/* Original image */}
        <div className="relative mb-8">
          <img
            src="/images/Notifications/no-mail.png"
            alt="No mail"
            className="mx-auto w-full h-auto max-h-[400px] object-contain rounded-lg"
            width={320}
            height={400}
            onError={(e) => { e.currentTarget.src = '/images/placeholders/item-placeholder.svg'; e.currentTarget.alt = 'Image not found'; }}
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
            <p className="text-gray-200 leading-relaxed font-medium">
              The courier has not yet arrived with news from your kingdom.
            </p>
            <p className="text-gray-400 text-sm leading-relaxed">
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
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
            <span className="sr-only">Notifications</span>
          </Button>
        )}
      </SheetTrigger>
      <SheetContent side="right" aria-label="notification-center-sidepanel" className="w-[95vw] md:w-96 bg-black border-l border-amber-800/20 p-0" aria-modal="true">
        {/* Enhanced Header */}
        <div className="relative p-6 border-b border-amber-800/20 bg-gradient-to-r from-gray-900 to-gray-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl flex items-center justify-center shadow-lg">
                <Mail className="w-6 h-6 text-white" />
              </div>
              <div>
                <SheetTitle className="text-xl font-bold text-amber-400 font-serif tracking-wide">Notifications</SheetTitle>
                <p className="text-gray-400 text-sm font-medium">Kingdom Messages & Updates</p>
              </div>
            </div>
            {unreadCount > 0 && (
              <div className="bg-red-500 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center shadow-lg">
                {unreadCount > 99 ? '99+' : unreadCount}
              </div>
            )}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto max-h-[calc(100vh-120px)]">
          {allNotifications.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="divide-y divide-amber-800/10">
              {allNotifications.map((notification) => (
                <div key={notification.id} className={cn("p-4 relative hover:bg-gray-900/50 transition-all duration-200", !notification.read && "bg-gray-800/30")}>
                  <div className="flex items-start gap-4">
                    <div className={cn("text-2xl mt-1 flex-shrink-0", getNotificationColor(notification.type))}>
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className={cn("font-semibold text-sm flex items-center text-white leading-tight", getNotificationColor(notification.type))}>
                          {notification.title}
                        </h4>
                        <span className="text-xs text-gray-500 font-medium">
                          {new Date(notification.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-line">
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
              ))}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}




