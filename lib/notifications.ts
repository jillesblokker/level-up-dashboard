interface Notification {
  id: string
  title: string
  message: string
  type: "achievement" | "quest" | "friend" | "system"
  read: boolean
  timestamp: string
  action?: {
    label: string
    href: string
  }
}

export function createAchievementNotification(achievementName: string) {
  const notification: Notification = {
    id: `achievement-${Date.now()}`,
    title: "Achievement Unlocked!",
    message: `You've earned the '${achievementName}' achievement!`,
    type: "achievement",
    read: false,
    timestamp: new Date().toISOString(),
    action: {
      label: "View Achievement",
      href: "/character",
    },
  }

  dispatchNotification(notification)
}

export function createQuestNotification(questName: string, goldReward: number) {
  const notification: Notification = {
    id: `quest-${Date.now()}`,
    title: "Quest Completed",
    message: `You've successfully completed '${questName}' and earned ${goldReward} gold!`,
    type: "quest",
    read: false,
    timestamp: new Date().toISOString(),
    action: {
      label: "View Rewards",
      href: "/quests",
    },
  }

  dispatchNotification(notification)
}

function dispatchNotification(notification: Notification) {
  // Save to localStorage
  const savedNotifications = JSON.parse(localStorage.getItem("notifications") || "[]")
  const updatedNotifications = [notification, ...savedNotifications]
  localStorage.setItem("notifications", JSON.stringify(updatedNotifications))

  // Dispatch event for real-time updates
  const event = new CustomEvent("newNotification", { detail: notification })
  window.dispatchEvent(event)
} 