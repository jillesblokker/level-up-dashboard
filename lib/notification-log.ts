// Notification log utility for persistent notifications
export interface NotificationLogEntry {
  id: string;
  type: 'event' | 'achievement' | 'info' | 'error' | 'quest' | 'creature';
  title: string;
  description: string;
  timestamp: string;
}

const STORAGE_KEY = 'notification-log';

export function getNotifications(): NotificationLogEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as NotificationLogEntry[];
  } catch {
    return [];
  }
}

export function addNotification(entry: Omit<NotificationLogEntry, 'id' | 'timestamp'>) {
  if (typeof window === 'undefined') return;
  const notifications = getNotifications();
  const newEntry: NotificationLogEntry = {
    ...entry,
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
  };
  notifications.unshift(newEntry); // newest first
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications.slice(0, 100)));
  // Dispatch a custom event so the notification center updates in the same tab
  window.dispatchEvent(new Event('notificationLogUpdated'));
}

export function clearNotifications() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
} 