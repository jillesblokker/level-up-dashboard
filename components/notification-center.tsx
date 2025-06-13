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
import { getNotifications, NotificationLogEntry, clearNotifications } from "@/lib/notification-log"

export function NotificationCenter() {
  const [notifications, setNotifications] = useState<NotificationLogEntry[]>([])
  const [open, setOpen] = useState(false)

  useEffect(() => {
    setNotifications(getNotifications())
    // Listen for storage changes (in case another tab adds a notification)
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'notification-log') {
        setNotifications(getNotifications())
      }
    }
    // Listen for custom event (same tab)
    const handleLogUpdated = () => setNotifications(getNotifications());
    window.addEventListener('storage', handleStorage)
    window.addEventListener('notificationLogUpdated', handleLogUpdated)
    return () => {
      window.removeEventListener('storage', handleStorage)
      window.removeEventListener('notificationLogUpdated', handleLogUpdated)
    }
  }, [])

  // Add a function to delete a notification by id
  const handleDelete = (id: string) => {
    const updated = notifications.filter(n => n.id !== id);
    localStorage.setItem('notification-log', JSON.stringify(updated));
    setNotifications(updated);
    window.dispatchEvent(new Event('notificationLogUpdated'));
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Open notification center">
          <Bell className="h-5 w-5" />
          <span className="sr-only">Notifications</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="right" aria-label="notification-center-sidepanel" className="w-96 max-w-full bg-black border-l border-amber-800/20">
        <SheetHeader>
          <SheetTitle className="text-amber-500">Notifications</SheetTitle>
        </SheetHeader>
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs text-muted-foreground">Realm & Achievement Events</span>
        </div>
        <div className="divide-y divide-amber-800/10 max-h-[80vh] overflow-auto">
          {notifications.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">No notifications</div>
          ) : (
            notifications.map((notification) => (
              <div key={notification.id} className="p-3 relative">
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-sm">{notification.title}</h4>
                      <span className="text-xs text-muted-foreground">{new Date(notification.timestamp).toLocaleString()}</span>
                      <button
                        aria-label="Delete notification"
                        className="ml-2 text-red-500 hover:text-red-700 text-xs"
                        onClick={() => handleDelete(notification.id)}
                      >
                        Delete
                      </button>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{notification.description}</p>
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


