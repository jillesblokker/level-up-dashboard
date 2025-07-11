"use client"

import { useEffect, useState } from "react"
import { Bell } from "lucide-react"
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
      default: return 'text-gray-500'
    }
  }

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
      <SheetContent side="right" aria-label="notification-center-sidepanel" className="w-96 max-w-full bg-black border-l border-amber-800/20">
        <SheetHeader>
          <SheetTitle className="text-amber-500">Notifications</SheetTitle>
        </SheetHeader>
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs text-muted-foreground">Game Events & Progress</span>
          {notifications.length > 0 && (
            <button
              onClick={() => {
                notificationService.markAllAsRead()
                setNotifications(notificationService.getNotifications())
              }}
              className="text-xs text-amber-500 hover:text-amber-400"
            >
              Mark all read
            </button>
          )}
        </div>
        <div className="divide-y divide-amber-800/10 max-h-[80vh] overflow-auto">
          {notifications.length === 0 ? (
            <div className="flex justify-center items-center h-full p-8">
              <div className="flex flex-col items-center bg-gray-900/50 rounded-xl border border-gray-800 p-8 w-full max-w-md mx-auto">
                <img
                  src="/images/Notifications/no-mail.png"
                  alt="No mail"
                  className="mx-auto w-full max-w-[320px] aspect-[4/3] object-cover rounded-lg my-4"
                  width={320}
                  height={240}
                  onError={(e) => { e.currentTarget.src = '/images/placeholders/item-placeholder.svg'; e.currentTarget.alt = 'Image not found'; }}
                />
                <p className="text-muted-foreground text-center max-w-xs mx-auto mt-2">
                  You must have just missed the courier. No messages from your loyal subjects at this moment
                </p>
              </div>
            </div>
          ) : (
            notifications.map((notification) => (
              <div key={notification.id} className={cn("p-3 relative", !notification.read && "bg-amber-900/10")}>
                <div className="flex items-start gap-3">
                  <div className="text-lg">{getNotificationIcon(notification.type)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className={cn("font-medium text-sm", getNotificationColor(notification.type))}>
                        {notification.title}
                      </h4>
                      <span className="text-xs text-muted-foreground">
                        {new Date(notification.timestamp).toLocaleString()}
                      </span>
                      <button
                        onClick={() => handleDelete(notification.id)}
                        className="text-red-500 hover:text-red-400 text-lg ml-2"
                        aria-label="Delete notification"
                      >
                        🗑️
                      </button>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1 whitespace-pre-line">
                      {notification.message}
                    </p>
                    {notification.action && (
                      <button
                        onClick={() => {
                          window.location.href = notification.action!.href
                        }}
                        className="text-xs text-amber-500 hover:text-amber-400 mt-2"
                      >
                        {notification.action.label} →
                      </button>
                    )}
                    <div className="flex gap-2 mt-2">
                      {!notification.read && (
                        <button
                          onClick={() => handleMarkAsRead(notification.id)}
                          className="text-xs text-blue-500 hover:text-blue-400"
                        >
                          Mark read
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}


