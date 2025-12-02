"use client"

import { useState, useEffect } from 'react';

export function useNotifications() {
    const [permission, setPermission] = useState<NotificationPermission>('default');

    useEffect(() => {
        if (typeof window !== 'undefined' && 'Notification' in window) {
            setPermission(Notification.permission);
        }
    }, []);

    const requestPermission = async () => {
        if (typeof window === 'undefined' || !('Notification' in window)) return false;

        try {
            const result = await Notification.requestPermission();
            setPermission(result);
            return result === 'granted';
        } catch (error) {
            console.error('Error requesting notification permission:', error);
            return false;
        }
    };

    const sendNotification = (title: string, options?: NotificationOptions) => {
        if (permission === 'granted') {
            try {
                // Try to use Service Worker registration if available (for mobile support)
                if ('serviceWorker' in navigator) {
                    navigator.serviceWorker.ready.then(registration => {
                        registration.showNotification(title, {
                            icon: '/icons/icon-192x192.png',
                            badge: '/icons/icon-72x72.png',
                            ...options
                        });
                    }).catch(() => {
                        // Fallback if SW fails
                        new Notification(title, {
                            icon: '/icons/icon-192x192.png',
                            ...options
                        });
                    });
                } else {
                    // Fallback to standard Notification API
                    new Notification(title, {
                        icon: '/icons/icon-192x192.png',
                        ...options
                    });
                }
            } catch (error) {
                console.error('Error sending notification:', error);
            }
        }
    };

    return { permission, requestPermission, sendNotification };
}
