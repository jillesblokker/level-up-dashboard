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

export function NotificationCenter() {
  const [notifications, setNotifications] = useState<NotificationData[]>([])
  const [open, setOpen] = useState(false)

  useEffect(() => {
    setNotifications(notificationService.getNotifications())
    
    // Listen for new notifications
    const handleNewNotification = () => {
      setNotifications(notificationService.getNotifications())
    }
    
    window.addEventListener('newNotification', handleNewNotification)
    
    return () => {
      window.removeEventListener('newNotification', handleNewNotification)
    }
  }, [])

  // Add a function to delete a notification by id
  const handleDelete = (id: string) => {
    notificationService.deleteNotification(id)
    setNotifications(notificationService.getNotifications())
  };

  // Add a function to mark notification as read
  const handleMarkAsRead = (id: string) => {
    notificationService.markAsRead(id)
    setNotifications(notificationService.getNotifications())
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'achievement': return '🏆'
      case 'quest': return '📜'
      case 'levelup': return '🎉'
      case 'success': return '✅'
      case 'event': return '🎯'
      case 'discovery': return '🔍'
      default: return '📢'
    }
  }

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'achievement': return 'text-yellow-500'
      case 'quest': return 'text-blue-500'
      case 'levelup': return 'text-green-500'
      case 'success': return 'text-green-500'
      case 'event': return 'text-purple-500'
      case 'discovery': return 'text-orange-500'
      case 'monster': return 'text-red-500'
      case 'system': return 'text-gray-500'
      default: return 'text-gray-500'
    }
  }

  const getPriorityBadge = (priority: 'high' | 'medium' | 'low' = 'medium') => {
    switch (priority) {
      case 'high': return <span className="inline-block w-2 h-2 bg-red-500 rounded-full mr-2" />
      case 'medium': return <span className="inline-block w-2 h-2 bg-amber-500 rounded-full mr-2" />
      case 'low': return <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-2" />
      default: return <span className="inline-block w-2 h-2 bg-amber-500 rounded-full mr-2" />
    }
  }

  // Enhanced Empty State Component
  const EmptyState = () => (
    <div className="flex flex-col items-center justify-center h-full p-6 relative overflow-hidden">
      {/* Background with medieval theme */}
      <div className="absolute inset-0 bg-gradient-to-br from-amber-900/5 via-transparent to-amber-900/5" />
      
      {/* Main content */}
      <div className="relative z-10 text-center w-full max-w-sm mx-auto">
        {/* Original image */}
        <div className="relative mb-8">
          <img
            src="/images/Notifications/no-mail.png"
            alt="No mail"
            className="mx-auto w-full h-full max-h-[280px] object-cover rounded-lg"
            width={320}
            height={340}
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
        <Button variant="ghost" size="icon" aria-label="Open notification center" className="relative">
          <Bell className="h-5 w-5" />
          {notificationService.getUnreadCount() > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
              {notificationService.getUnreadCount()}
            </span>
          )}
          <span className="sr-only">Notifications</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="right" aria-label="notification-center-sidepanel" className="w-96 max-w-full bg-black border-l border-amber-800/20 max-w-[90vw] p-0" aria-modal="true">
        {/* Enhanced Header */}
        <div className="relative p-6 border-b border-amber-800/20">
          <div className="absolute inset-0 bg-gradient-to-r from-amber-900/10 via-transparent to-amber-900/10"></div>
          <div className="relative flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-amber-700 rounded-lg flex items-center justify-center shadow-lg">
                <Mail className="w-5 h-5 text-white" />
              </div>
              <div>
                <SheetTitle className="text-xl font-bold text-amber-400 font-serif">Notifications</SheetTitle>
                <p className="text-gray-400 text-sm font-medium">Kingdom Messages & Updates</p>
              </div>
            </div>
            {notifications.length > 0 && (
              <button
                onClick={() => {
                  notificationService.markAllAsRead()
                  setNotifications(notificationService.getNotifications())
                }}
                className="text-xs text-amber-500 hover:text-amber-400 min-w-[44px] min-h-[44px] px-2 py-1 rounded border border-amber-800/30 hover:bg-amber-900/20 transition-colors"
                aria-label="Mark all notifications as read"
              >
                Mark all read
              </button>
            )}
          </div>
        </div>
        
        {/* Content Area */}
        <div className="flex-1 overflow-auto">
          {notifications.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="divide-y divide-amber-800/10">
              {notifications.map((notification) => (
                <div key={notification.id} className={cn("p-4 relative hover:bg-gray-900/30 transition-colors", !notification.read && "bg-amber-900/10")}>
                  <div className="flex items-start gap-3">
                    <div className="text-lg mt-1">{getNotificationIcon(notification.type)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className={cn("font-medium text-sm flex items-center", getNotificationColor(notification.type))}>
                          {getPriorityBadge(notification.priority)}
                          {notification.title}
                        </h4>
                        <span className="text-xs text-muted-foreground">
                          {new Date(notification.timestamp).toLocaleString()}
                        </span>
                        <button
                          onClick={() => handleDelete(notification.id)}
                          className="text-red-500 hover:text-red-400 text-lg ml-2 p-1 rounded hover:bg-red-900/20 transition-colors"
                          aria-label="Delete notification"
                        >
                          🗑️
                        </button>
                      </div>
                      <p className="text-sm text-muted-foreground mt-2 whitespace-pre-line leading-relaxed">
                        {notification.message}
                      </p>
                      {notification.action && (
                        <button
                          onClick={() => {
                            window.location.href = notification.action!.href
                          }}
                          className="text-xs text-amber-500 hover:text-amber-400 mt-3 px-3 py-1 rounded border border-amber-800/30 hover:bg-amber-900/20 transition-colors"
                        >
                          {notification.action.label} →
                        </button>
                      )}
                      <div className="flex gap-2 mt-3">
                        {!notification.read && (
                          <button
                            onClick={() => handleMarkAsRead(notification.id)}
                            className="text-xs text-blue-500 hover:text-blue-400 px-2 py-1 rounded border border-blue-800/30 hover:bg-blue-900/20 transition-colors"
                          >
                            Mark read
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


