'use client'

import React, { useState } from 'react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Bell, Swords, Trophy, Users, ShieldAlert, Sparkles, Check } from 'lucide-react'

export interface AppNotification {
  id: string
  title: string
  message: string
  type: 'dare' | 'duel' | 'alliance' | 'system'
  timestamp: string
  read: boolean
}

const INITIAL_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'n-1',
    title: 'Friend Dare Issued!',
    message: 'Friend Sir Gareth dared you to complete 10 push-ups today for +10 Virtue Points!',
    type: 'dare',
    timestamp: '10m ago',
    read: false
  },
  {
    id: 'n-2',
    title: 'Fellowship Titan Wyrm Raid',
    message: 'Titan Wyrm HP dropped to 45%! Victory Chest Tier Silver unlocked.',
    type: 'alliance',
    timestamp: '1h ago',
    read: false
  },
  {
    id: 'n-3',
    title: 'Virtue Duel Challenge',
    message: 'Lady Guinevere challenged your Knowledge Hourglass standing.',
    type: 'duel',
    timestamp: '3h ago',
    read: true
  }
]

export function NotificationBellDrawer() {
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS)

  // Enforce High-Value Action Filtering (Suppresses routine +10 XP logs)
  const filteredNotifications = notifications.filter(n =>
    ['dare', 'duel', 'alliance', 'protection', 'level_up'].includes(n.type) || !n.read
  )

  const unreadCount = filteredNotifications.filter(n => !n.read).length

  const markAllRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })))
  }

  const getIcon = (type: AppNotification['type']) => {
    switch (type) {
      case 'dare': return <Swords className="w-4 h-4 text-amber-400" />
      case 'duel': return <Trophy className="w-4 h-4 text-purple-400" />
      case 'alliance': return <ShieldAlert className="w-4 h-4 text-cyan-400" />
      default: return <Sparkles className="w-4 h-4 text-blue-400" />
    }
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="relative bg-zinc-950 border-zinc-800 text-zinc-300 hover:text-white hover:border-amber-500/50 w-9 h-9 rounded-xl"
          aria-label="Open notifications"
        >
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 text-zinc-950 font-bold text-[9px] rounded-full flex items-center justify-center animate-pulse">
              {unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-80 sm:w-96 bg-zinc-950 border border-zinc-800 text-white rounded-2xl p-4 shadow-2xl z-50">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div className="flex items-center gap-2 text-amber-400">
            <Bell className="w-4 h-4" />
            <h4 className="font-bold text-xs tracking-wide">In-app notifications</h4>
          </div>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllRead}
              className="h-6 text-[10px] text-zinc-400 hover:text-white"
            >
              Mark all read
            </Button>
          )}
        </div>

        <div className="my-2 space-y-2 max-h-72 overflow-y-auto pr-1">
          {notifications.length === 0 ? (
            <p className="text-center text-zinc-500 text-xs py-6">No new notifications</p>
          ) : (
            notifications.map(n => (
              <div
                key={n.id}
                className={`p-3 rounded-xl border transition-all text-xs space-y-1 ${
                  n.read
                    ? 'border-zinc-900 bg-zinc-900/30 text-zinc-400'
                    : 'border-amber-500/40 bg-amber-950/20 text-zinc-100'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold flex items-center gap-1.5 text-zinc-200">
                    {getIcon(n.type)} {n.title}
                  </span>
                  <span className="text-[10px] text-zinc-500 font-mono">{n.timestamp}</span>
                </div>
                <p className="text-[11px] text-zinc-400 leading-snug">{n.message}</p>
              </div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
