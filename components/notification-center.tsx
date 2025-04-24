"use client"

import { useEffect, useState } from "react"
import { Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { NotificationData, notificationService } from "@/lib/notification-service"
import { useRouter } from "next/navigation"

export function NotificationCenter() {
  const [notifications, setNotifications] = useState<NotificationData[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [open, setOpen] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // Initial load
    setNotifications(notificationService.getNotifications())
    setUnreadCount(notificationService.getUnreadCount())

    // Listen for new notifications
    const handleNewNotification = (event: CustomEvent<NotificationData>) => {
      setNotifications(notificationService.getNotifications())
      setUnreadCount(notificationService.getUnreadCount())
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

  const handleAction = (notification: NotificationData) => {
    if (notification.action) {
      handleMarkAsRead(notification.id)
      setOpen(false)
      router.push(notification.action.href)
    }
  }

  const getNotificationIcon = (type: NotificationData["type"]) => {
    switch (type) {
      case "achievement":
        return "🏆"
      case "quest":
        return "⚔️"
      case "friend":
        return "👥"
      case "discovery":
        return "🔍"
      case "success":
        return "✅"
      case "warning":
        return "⚠️"
      case "danger":
        return "❌"
      case "info":
        return "ℹ️"
      default:
        return "📢"
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" className="relative" size="icon">
          <Bell className="h-[1.2rem] w-[1.2rem]" />
          {unreadCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] text-white">
              {unreadCount}
            </span>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Notifications</DialogTitle>
          <DialogDescription>
            {notifications.length === 0
              ? "No notifications yet"
              : `You have ${unreadCount} unread notification${unreadCount !== 1 ? "s" : ""}`}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          {notifications.length > 0 && (
            <Button
              variant="outline"
              className="w-full"
              onClick={handleMarkAllAsRead}
              disabled={unreadCount === 0}
            >
              Mark all as read
            </Button>
          )}
          <ScrollArea className="h-[300px] w-full rounded-md border p-4">
            <div className="grid gap-4">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={cn(
                    "grid gap-1 rounded-lg border p-4 transition-colors",
                    !notification.read && "bg-muted/50"
                  )}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="grid gap-1">
                      <div className="flex items-center gap-2">
                        <span>{getNotificationIcon(notification.type)}</span>
                        <h4 className="font-semibold">{notification.title}</h4>
                      </div>
                      <p className="text-sm text-muted-foreground whitespace-pre-line">
                        {notification.message}
                      </p>
                      {notification.action && (
                        <Button
                          variant="link"
                          className="px-0 text-sm"
                          onClick={() => handleAction(notification)}
                        >
                          {notification.action.label}
                        </Button>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => handleDelete(notification.id)}
                    >
                      ✕
                    </Button>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{new Date(notification.timestamp).toLocaleString()}</span>
                    {!notification.read && (
                      <Button
                        variant="ghost"
                        className="h-auto px-2 py-1 text-xs"
                        onClick={() => handleMarkAsRead(notification.id)}
                      >
                        Mark as read
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  )
}

