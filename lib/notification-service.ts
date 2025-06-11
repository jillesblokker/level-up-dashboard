import { toast } from "@/components/ui/use-toast"

export interface NotificationData {
  id: string
  title: string
  message: string
  type: "achievement" | "quest" | "friend" | "system" | "success" | "warning" | "danger" | "info" | "discovery" | "event" | "levelup"
  read: boolean
  timestamp: string
  action?: { label: string; href: string } | undefined
  image?: string | undefined
}

class NotificationService {
  private static instance: NotificationService | null = null
  private notifications: NotificationData[] = []

  private constructor() {
    if (typeof window !== 'undefined') {
      // Load notifications from localStorage
      const storedNotifications = localStorage.getItem("notifications")
      if (storedNotifications) {
        this.notifications = JSON.parse(storedNotifications)
      }
    }
  }

  public static getInstance(): NotificationService {
    if (typeof window === 'undefined') {
      return {
        notifications: [],
        addNotification: () => {},
        addQuestCompletion: () => {},
        addAchievement: () => {},
        addDiscovery: () => {},
        markAsRead: () => {},
        markAllAsRead: () => {},
        deleteNotification: () => {},
        getNotifications: () => [],
        getUnreadCount: () => 0,
        saveNotifications: () => {},
        dispatchNotificationEvent: () => {},
      } as NotificationService
    }
    
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService()
    }
    return NotificationService.instance
  }

  private saveNotifications() {
    if (typeof window !== 'undefined') {
      localStorage.setItem("notifications", JSON.stringify(this.notifications))
    }
  }

  private dispatchNotificationEvent(notification: NotificationData) {
    if (typeof window !== 'undefined') {
      const event = new CustomEvent("newNotification", { detail: notification })
      window.dispatchEvent(event)
    }
  }

  public addNotification(
    title: string,
    message: string,
    type: NotificationData["type"],
    action?: { label: string; href: string },
    image?: string
  ) {
    const notification: NotificationData = {
      id: Date.now().toString(),
      title,
      message,
      type,
      read: false,
      timestamp: new Date().toISOString(),
      ...(action !== undefined ? { action } : {}),
      ...(image !== undefined ? { image } : {}),
    }

    this.notifications.unshift(notification)
    this.saveNotifications()
    this.dispatchNotificationEvent(notification)

    // Show toast for important notifications
    if (
      type === "achievement" ||
      type === "quest" ||
      type === "discovery" ||
      type === "event" ||
      type === "levelup"
    ) {
      toast({
        title: notification.title,
        description: notification.message,
      })
    }
  }

  public addQuestCompletion(questTitle: string, rewards: { xp: number; gold: number; items?: string[] }) {
    const message = `Completed: ${questTitle}\n+${rewards.xp} XP\n+${rewards.gold} Gold${
      rewards.items ? `\nItems: ${rewards.items.join(", ")}` : ""
    }`

    this.addNotification("Quest Complete!", message, "quest", {
      label: "View Quests",
      href: "/quests",
    })
  }

  public addAchievement(achievementName: string, description: string, rewards: { gold: number; experience: number }) {
    const message = `${description}\n+${rewards.experience} XP\n+${rewards.gold} Gold`

    this.addNotification("Achievement Unlocked!", message, "achievement", {
      label: "View Achievements",
      href: "/character",
    })
  }

  public addDiscovery(title: string, message: string) {
    this.addNotification(title, message, "discovery", {
      label: "View Realm",
      href: "/realm",
    })
  }

  public markAsRead(id: string) {
    this.notifications = this.notifications.map((notification) =>
      notification.id === id ? { ...notification, read: true } : notification
    )
    this.saveNotifications()
  }

  public markAllAsRead() {
    this.notifications = this.notifications.map((notification) => ({ ...notification, read: true }))
    this.saveNotifications()
  }

  public deleteNotification(id: string) {
    this.notifications = this.notifications.filter((notification) => notification.id !== id)
    this.saveNotifications()
  }

  public getNotifications() {
    return this.notifications
  }

  public getUnreadCount() {
    return this.notifications.filter((notification) => !notification.read).length
  }
}

export const notificationService = NotificationService.getInstance() 