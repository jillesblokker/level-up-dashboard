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

  const getNotificationBgColor = (type: string) => {
    switch (type) {
      case 'achievement': return 'bg-amber-500/10 border-amber-500/20'
      case 'quest': return 'bg-amber-500/10 border-amber-500/20'
      case 'levelup': return 'bg-amber-500/10 border-amber-500/20'
      case 'success': return 'bg-amber-500/10 border-amber-500/20'
      case 'event': return 'bg-gray-500/10 border-gray-500/20'
      case 'discovery': return 'bg-amber-500/10 border-amber-500/20'
      case 'monster': return 'bg-red-500/10 border-red-500/20'
      case 'system': return 'bg-gray-500/10 border-gray-500/20'
      default: return 'bg-amber-500/10 border-amber-500/20'
    }
  }

  const getPriorityBadge = (priority: 'high' | 'medium' | 'low' = 'medium') => {
    // Remove red dots - background already indicates unread status
    return null
  }

  // Enhanced Empty State Component
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
        <Button variant="ghost" size="icon" aria-label="Open notification center" className="relative">
          <Bell className="h-5 w-5" />
          {notificationService.getUnreadCount() > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
              {notificationService.getUnreadCount() > 99 ? '99+' : notificationService.getUnreadCount()}
            </span>
          )}
          <span className="sr-only">Notifications</span>
        </Button>
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
            {notificationService.getUnreadCount() > 0 && (
              <div className="bg-red-500 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center shadow-lg">
                {notificationService.getUnreadCount() > 99 ? '99+' : notificationService.getUnreadCount()}
              </div>
            )}
          </div>
        </div>
        
        {/* Content Area */}
        <div className="flex-1 overflow-y-auto max-h-[calc(100vh-120px)]">
          {notifications.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="divide-y divide-amber-800/10">
              {notifications.map((notification) => (
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
                            onClick={() => handleMarkAsRead(notification.id)}
                            className="text-xs font-medium text-blue-400 hover:text-blue-300 px-3 py-1.5 rounded-md border border-blue-600/30 hover:bg-blue-900/20 hover:border-blue-500/50 transition-all duration-200"
                          >
                            Mark as Read
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(notification.id)}
                          className="text-xs font-medium text-red-400 hover:text-red-300 px-3 py-1.5 rounded-md border border-red-600/30 hover:bg-red-900/20 hover:border-red-500/50 transition-all duration-200"
                          aria-label="Delete notification"
                        >
                          Delete
                        </button>
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




