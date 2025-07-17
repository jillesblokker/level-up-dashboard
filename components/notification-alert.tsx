"use client"

import { useState, useEffect } from "react"
import { Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
// import { storageService } from '@/lib/storage-service' // Removed

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
    // const storedNotifications = storageService.get<Notification[]>('notifications', []) // Removed
    const storedNotifications: Notification[] = []; // Temporary
    setNotifications(storedNotifications)

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
    // storageService.set('notifications', notifications) // Removed
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

  return (
    <DropdownMenu open={showNotifications} onOpenChange={setShowNotifications}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
          <Bell className="h-5 w-5" />
          {notifications.filter((n) => !n.read).length > 0 && (
            <Badge
              className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 flex items-center justify-center bg-blue-900 text-white"
              aria-label={`${notifications.filter((n) => !n.read).length} unread notifications`}
            >
              {notifications.filter((n) => !n.read).length}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80" aria-label="Notifications menu">
        <div className="flex items-center justify-between p-2">
          <h4 className="font-medium">Notifications</h4>
          {notifications.length > 0 && (
            <Button variant="ghost" size="sm" onClick={markAllAsRead} aria-label="Mark all notifications as read">
              Mark all as read
            </Button>
          )}
        </div>
        <ScrollArea className="h-[300px]" aria-label="Notifications scroll area">
          {notifications.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No notifications
            </div>
          ) : (
            notifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className="flex flex-col items-start p-4 gap-2"
                onSelect={(e) => {
                  e.preventDefault()
                  markAsRead(notification.id)
                }}
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2">
                    <div className={`h-2 w-2 rounded-full ${getTypeColor(notification.type)}`} />
                    <span className="font-medium">{notification.title}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={(e) => {
                      e.stopPropagation()
                      deleteNotification(notification.id)
                    }}
                    aria-label={`Delete notification: ${notification.title}`}
                  >
                    ×
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">{notification.message}</p>
                <span className="text-xs text-muted-foreground">{formatTime(notification.timestamp)}</span>
              </DropdownMenuItem>
            ))
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

