"use client"

import { useState, useEffect } from "react"
import { Bell, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"

interface Notification {
    id: string;
    title: string;
    message: string;
    is_read: boolean;
    created_at: string;
    type: string;
}

export function NotificationsBell() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);

    const fetchNotifications = async () => {
        try {
            const res = await fetch('/api/notifications');
            const data = await res.json();
            if (Array.isArray(data)) {
                setNotifications(data);
                setUnreadCount(data.filter(n => !n.is_read).length);
            }
        } catch (error) {
            console.error("Failed to fetch notifications", error);
        }
    };

    useEffect(() => {
        fetchNotifications();
        // Poll every minute
        const interval = setInterval(fetchNotifications, 60000);
        return () => clearInterval(interval);
    }, []);

    const markAsRead = async (ids: string[]) => {
        try {
            await fetch('/api/notifications', {
                method: 'PATCH',
                body: JSON.stringify({ notificationIds: ids })
            });

            // local update
            setNotifications(prev => prev.map(n =>
                ids.includes(n.id) ? { ...n, is_read: true } : n
            ));
            setUnreadCount(prev => Math.max(0, prev - ids.length));
        } catch (error) {
            console.error("Failed to mark read", error);
        }
    };

    const handleOpenChange = (open: boolean) => {
        setIsOpen(open);
        if (open) {
            // Optional: Mark all as read on open? Or let user click?
            // Let's keep it manual for now or mark visible ones as read after a delay.
        }
    };

    const markAllRead = () => {
        const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id);
        if (unreadIds.length > 0) markAsRead(unreadIds);
    };

    return (
        <Popover open={isOpen} onOpenChange={handleOpenChange}>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative text-gray-400 hover:text-white">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <span className="absolute top-1 right-2 h-2 w-2 rounded-full bg-red-500 ring-2 ring-black" />
                    )}
                    <span className="sr-only">Notifications</span>
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0 bg-black/95 border-amber-900/40 text-amber-100" align="end">
                <div className="flex items-center justify-between p-4 border-b border-white/10">
                    <h4 className="font-medieval text-lg text-amber-500">Notifications</h4>
                    {unreadCount > 0 && (
                        <Button variant="ghost" size="sm" onClick={markAllRead} className="h-auto px-2 text-xs text-gray-400 hover:text-white">
                            Mark all read
                        </Button>
                    )}
                </div>
                <ScrollArea className="h-[300px]">
                    {notifications.length === 0 ? (
                        <div className="p-8 text-center text-gray-500 text-sm">
                            No news from the realm...
                        </div>
                    ) : (
                        <div className="divide-y divide-white/5">
                            {notifications.map(notification => (
                                <div
                                    key={notification.id}
                                    className={cn(
                                        "p-4 hover:bg-white/5 transition-colors cursor-pointer",
                                        !notification.is_read && "bg-amber-500/5"
                                    )}
                                    onClick={() => !notification.is_read && markAsRead([notification.id])}
                                >
                                    <div className="flex justify-between items-start gap-3">
                                        <div className="space-y-1">
                                            <p className={cn("text-sm font-medium leading-none", !notification.is_read ? "text-amber-200" : "text-gray-300")}>
                                                {notification.title}
                                            </p>
                                            <p className="text-xs text-gray-500 line-clamp-2">
                                                {notification.message}
                                            </p>
                                            <p className="text-[10px] text-gray-600">
                                                {new Date(notification.created_at).toLocaleDateString()}
                                            </p>
                                        </div>
                                        {!notification.is_read && (
                                            <div className="h-1.5 w-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>
            </PopoverContent>
        </Popover>
    )
}
