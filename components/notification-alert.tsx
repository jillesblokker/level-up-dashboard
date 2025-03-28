"use client"

import { useEffect, useState } from "react"
import { X, Bell, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

interface Notification {
  id: string
  title: string
  message: string
  type: string
  read: boolean
  timestamp: string
}

export function NotificationAlert() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [showNotifications, setShowNotifications] = useState(false)

  // Load notifications from localStorage
  useEffect(() => {
    const storedNotifications = localStorage.getItem("notifications")
    if (storedNotifications) {
      setNotifications(JSON.parse(storedNotifications))
    }

    // Listen for new notifications
    const handleNewNotification = (event: CustomEvent) => {
      setNotifications((prev) => [event.detail, ...prev])
    }

    window.addEventListener("newNotification", handleNewNotification as EventListener)

    return () => {
      window.removeEventListener("newNotification", handleNewNotification as EventListener)
    }
  }, [])

  // Save notifications to localStorage when they change
  useEffect(() => {
    localStorage.setItem("notifications", JSON.stringify(notifications))
  }, [notifications])

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((notification) => (notification.id === id ? { ...notification, read: true } : notification)),
    )
  }

  const deleteNotification = (id: string) => {
    setNotifications((prev) => prev.filter((notification) => notification.id !== id))
  }

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((notification) => ({ ...notification, read: true })))
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case "success":
        return "bg-green-500"
      case "warning":
        return "bg-amber-500"
      case "danger":
        return "bg-red-500"
      case "info":
        return "bg-blue-500"
      case "achievement":
        return "bg-purple-500"
      case "quest":
        return "bg-amber-500"
      case "discovery":
        return "bg-cyan-500"
      default:
        return "bg-gray-500"
    }
  }

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.round(diffMs / 60000)

    if (diffMins < 1) return "Just now"
    if (diffMins < 60) return `${diffMins}m ago`

    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours}h ago`

    const diffDays = Math.floor(diffHours / 24)
    if (diffDays < 7) return `${diffDays}d ago`

    return date.toLocaleDateString()
  }

  const unreadCount = notifications.filter((n) => !n.read).length

  return (
    <div className="relative">
      <Button variant="ghost" size="icon" onClick={() => setShowNotifications(!showNotifications)} className="relative">
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white">
            {unreadCount}
          </span>
        )}
        <span className="sr-only">Notifications</span>
      </Button>

      {showNotifications && (
        <Card className="absolute right-0 mt-2 w-80 max-h-[80vh] overflow-auto z-50 bg-black border-amber-800/20">
          <div className="p-4 border-b border-amber-800/20 flex items-center justify-between">
            <h3 className="font-medium">Notifications</h3>
            <div className="flex gap-2">
              {unreadCount > 0 && (
                <Button variant="ghost" size="sm" onClick={markAllAsRead} className="h-8 px-2 text-xs">
                  <Check className="h-3 w-3 mr-1" />
                  Mark all read
                </Button>
              )}
              <Button variant="ghost" size="icon" onClick={() => setShowNotifications(false)} className="h-6 w-6">
                <X className="h-4 w-4" />
                <span className="sr-only">Close</span>
              </Button>
            </div>
          </div>

          <div className="divide-y divide-amber-800/10">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">No notifications</div>
            ) : (
              notifications.map((notification) => (
                <div key={notification.id} className={`p-3 relative ${notification.read ? "opacity-70" : ""}`}>
                  <div className="flex items-start gap-3">
                    <div className={`w-2 h-2 mt-1.5 rounded-full ${getTypeColor(notification.type)}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-sm">{notification.title}</h4>
                        <span className="text-xs text-muted-foreground">{formatTime(notification.timestamp)}</span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
                    </div>
                  </div>
                  <div className="mt-2 flex justify-end gap-2">
                    {!notification.read && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => markAsRead(notification.id)}
                        className="h-7 px-2 text-xs"
                      >
                        Mark as read
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteNotification(notification.id)}
                      className="h-7 px-2 text-xs text-red-500 hover:text-red-600"
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      )}
    </div>
  )
}

