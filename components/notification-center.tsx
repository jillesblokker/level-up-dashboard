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
import { NotificationData, notificationService } from "@/lib/notification-service"

export function NotificationCenter() {
  const [notifications, setNotifications] = useState<NotificationData[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    // Initial load
    setNotifications(notificationService.getNotifications())
    setUnreadCount(notificationService.getUnreadCount())

    // Listen for new notifications
    const handleNewNotification = (_event: CustomEvent<NotificationData>) => {
      // Unused function
    }

    window.addEventListener("newNotification", handleNewNotification as EventListener)

    return () => {
      window.removeEventListener("newNotification", handleNewNotification as EventListener)
    }
  }, [])

  const handleMarkAsRead = (id: string) => {
    notificationService.markAsRead(id)
    setNotifications(notificationService.getNotifications())
    setUnreadCount(notificationService.getUnreadCount())
  }

  const handleMarkAllAsRead = () => {
    notificationService.markAllAsRead()
    setNotifications(notificationService.getNotifications())
    setUnreadCount(notificationService.getUnreadCount())
  }

  const handleDelete = (id: string) => {
    notificationService.deleteNotification(id)
    setNotifications(notificationService.getNotifications())
    setUnreadCount(notificationService.getUnreadCount())
  }

  // Only show high-level notifications
  const highLevelTypes = ["achievement", "quest", "discovery", "event", "levelup"]
  const filteredNotifications = notifications.filter(n => highLevelTypes.includes(n.type))

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Open notification center">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white">
              {unreadCount}
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
          <span className="text-xs text-muted-foreground">Realm & Achievement Events</span>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={handleMarkAllAsRead} className="h-8 px-2 text-xs">
              Mark all read
            </Button>
          )}
        </div>
        <div className="divide-y divide-amber-800/10 max-h-[80vh] overflow-auto">
          {filteredNotifications.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">No notifications</div>
          ) : (
            filteredNotifications.map((notification) => (
              <div key={notification.id} className={cn("p-3 relative", notification.read ? "opacity-70" : "")}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    {notification.image && (
                      <img
                        src={notification.image}
                        alt={notification.title + ' image'}
                        aria-label="notification-image"
                        className="w-16 h-16 object-cover rounded-md mb-2 border border-amber-800/40"
                      />
                    )}
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-sm">{notification.title}</h4>
                      <span className="text-xs text-muted-foreground">{new Date(notification.timestamp).toLocaleString()}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
                  </div>
                </div>
                <div className="mt-2 flex justify-end gap-2">
                  {!notification.read && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleMarkAsRead(notification.id)}
                      className="h-7 px-2 text-xs"
                    >
                      Mark as read
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(notification.id)}
                    className="h-7 px-2 text-xs text-red-500 hover:text-red-600"
                  >
                    Delete
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}

