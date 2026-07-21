"use client"

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Clock, Castle, Compass, Flame, Sparkles, CheckCircle2, ChevronRight, Zap } from "lucide-react";
import Link from 'next/link';

interface ActiveTimerItem {
  id: string;
  name: string;
  category: 'kingdom' | 'expedition' | 'buff' | 'pet';
  icon: string;
  endTime: number;
  location: string;
  linkHref: string;
}

export function ActiveTimersLedger() {
  const [activeTimers, setActiveTimers] = useState<ActiveTimerItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTimers = async () => {
      try {
        const items: ActiveTimerItem[] = [];

        // 1. Fetch kingdom property timers
        const kingdomRes = await fetch('/api/property-timers');
        if (kingdomRes.ok) {
          const data = await kingdomRes.json();
          const timersMap = data.timers || {};
          Object.values(timersMap).forEach((t: any) => {
            if (t.endTime && t.endTime > Date.now()) {
              items.push({
                id: `kingdom-${t.x}-${t.y}`,
                name: (t.tileId || 'Property').replace(/-/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()),
                category: 'kingdom',
                icon: '🏰',
                endTime: t.endTime,
                location: `Kingdom (${t.x},${t.y})`,
                linkHref: '/kingdom'
              });
            }
          });
        }

        // 2. Fetch active expeditions from local storage / preferences
        const expPref = localStorage.getItem('active_expeditions');
        if (expPref) {
          try {
            const exp = JSON.parse(expPref);
            if (exp.active && exp.endTime && exp.endTime > Date.now()) {
              items.push({
                id: 'expedition-active',
                name: `${exp.name || 'Airship Voyage'} (${exp.category || 'Might'})`,
                category: 'expedition',
                icon: '⚓',
                endTime: exp.endTime,
                location: 'Airship Harbor',
                linkHref: '/kingdom'
              });
            }
          } catch (e) { }
        }

        // Sort by ending soonest
        items.sort((a, b) => a.endTime - b.endTime);
        setActiveTimers(items);
      } catch (e) {
        // Fallback gracefully
      } finally {
        setLoading(false);
      }
    };

    loadTimers();
    const interval = setInterval(loadTimers, 10000);
    return () => clearInterval(interval);
  }, []);

  const formatRemaining = (endTime: number) => {
    const diffMs = endTime - Date.now();
    if (diffMs <= 0) return 'Ready to Collect!';
    const mins = Math.floor(diffMs / (60 * 1000));
    const secs = Math.floor((diffMs % (60 * 1000)) / 1000);
    if (mins >= 60) {
      const hrs = Math.floor(mins / 60);
      return `${hrs}h ${mins % 60}m remaining`;
    }
    return `${mins}m ${secs}s remaining`;
  };

  return (
    <Card className="bg-gradient-to-br from-zinc-950 via-amber-950/20 to-zinc-950 border-amber-900/40 shadow-lg">
      <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-lg font-serif font-bold text-amber-300 flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-400" /> Active Timers & Production Ledger
          </CardTitle>
          <CardDescription className="text-zinc-400 text-xs">
            Monitor all active property timers, airship voyages, and production ledgers
          </CardDescription>
        </div>
        <Link href="/kingdom">
          <Button size="sm" variant="outline" className="text-xs border-amber-500/30 text-amber-300 hover:bg-amber-500/10 gap-1">
            <span>Manage Kingdom</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Button>
        </Link>
      </CardHeader>

      <CardContent className="p-4 pt-2">
        {loading ? (
          <div className="py-4 text-center text-xs text-zinc-500 animate-pulse">Loading active timers...</div>
        ) : activeTimers.length === 0 ? (
          <div className="py-5 text-center bg-zinc-900/40 rounded-xl border border-zinc-800/80 space-y-1">
            <CheckCircle2 className="w-6 h-6 text-emerald-400 mx-auto opacity-80" />
            <div className="text-sm font-semibold text-zinc-300">All Timers Ready or Inactive</div>
            <div className="text-xs text-zinc-500">Construct new properties in `/kingdom` to begin passive production.</div>
          </div>
        ) : (
          <div className="space-y-2.5">
            {activeTimers.slice(0, 4).map(timer => {
              const isReady = Date.now() >= timer.endTime;
              return (
                <div key={timer.id} className="flex items-center justify-between p-3 rounded-lg bg-zinc-900/60 border border-zinc-800/80 hover:border-amber-500/30 transition-all text-xs">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{timer.icon}</span>
                    <div>
                      <div className="font-semibold text-zinc-200 flex items-center gap-2">
                        {timer.name}
                        <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-zinc-700 text-zinc-400 uppercase">
                          {timer.category}
                        </Badge>
                      </div>
                      <div className="text-[10px] text-zinc-500">{timer.location}</div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className={isReady ? "text-emerald-400 font-bold animate-pulse" : "text-amber-400 font-mono"}>
                      {formatRemaining(timer.endTime)}
                    </span>
                    <Link href={timer.linkHref} className="block text-[10px] text-zinc-400 hover:text-amber-300 underline">
                      View
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
