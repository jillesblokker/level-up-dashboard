"use client"

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Clock, Castle, Compass, Flame, Sparkles, CheckCircle2, ChevronRight, Zap } from "lucide-react";
import Link from 'next/link';
import Image from 'next/image';

interface ActiveTimerItem {
  id: string;
  name: string;
  category: 'kingdom' | 'expedition' | 'buff' | 'pet' | 'activity' | 'tax-producer';
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
            const rawName = (t.tileId || 'Property').toLowerCase();
            const isMinigame = ['dungeon', 'labyrinth', 'fortune', 'zen'].some(k => rawName.includes(k));

            if (t.endTime && t.endTime > Date.now()) {
              items.push({
                id: `kingdom-${t.x}-${t.y}`,
                name: (t.tileId || 'Property').replace(/-/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()),
                category: isMinigame ? 'activity' : 'tax-producer',
                icon: isMinigame ? (rawName.includes('dungeon') ? '⚔️' : rawName.includes('labyrinth') ? '🧩' : rawName.includes('fortune') ? '🔮' : '🧘') : '🪙',
                endTime: t.endTime,
                location: isMinigame ? 'Daily Attempts Ready' : `Tax Producer (${t.x},${t.y})`,
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
    <Card className="bg-gradient-to-b from-[#18110b] via-[#0f0b07] to-[#0a0705] border-2 border-amber-600/40 rounded-2xl shadow-2xl overflow-hidden relative">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-600/10 via-transparent to-transparent pointer-events-none" />

      <CardHeader className="p-4 sm:p-5 pb-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 relative z-10">
        <div>
          <CardTitle className="text-base sm:text-lg font-serif font-bold text-amber-300 flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-400 shrink-0" />
            <span>Active timers & production ledger</span>
          </CardTitle>
          <CardDescription className="text-amber-200/60 text-xs font-sans mt-0.5">
            Monitor active property timers, airship voyages, and kingdom yields
          </CardDescription>
        </div>
        <Link href="/kingdom" className="w-full sm:w-auto">
          <Button size="sm" variant="outline" className="w-full sm:w-auto text-xs border-amber-500/40 text-amber-200 bg-amber-950/40 hover:bg-amber-900/60 rounded-xl gap-1 shadow-md">
            <span>Manage kingdom</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Button>
        </Link>
      </CardHeader>

      <CardContent className="p-4 sm:p-5 pt-2 relative z-10">
        {loading ? (
          <div className="py-6 text-center text-xs text-amber-500/60 font-serif animate-pulse">Reading kingdom sundials...</div>
        ) : activeTimers.length === 0 ? (
          <div className="py-6 px-4 text-center bg-[#130e09]/90 rounded-2xl border border-amber-900/40 shadow-inner space-y-3">
            <div className="flex items-center justify-center">
              <div className="relative w-14 h-14 rounded-2xl border-2 border-blue-500/40 bg-zinc-950/90 shadow-xl overflow-hidden shrink-0">
                <Image
                  src="/images/creatures/Divero.webp"
                  alt="Divero"
                  fill
                  className="object-contain p-1"
                  unoptimized
                />
              </div>
            </div>
            <div className="space-y-1 max-w-sm mx-auto">
              <div className="text-sm font-serif font-bold text-amber-200">All timers ready or inactive</div>
              <p className="text-xs text-amber-300/80 leading-relaxed font-sans">
                Divero inspects the harbor slips: &quot;All airships are moored and workshops quiet. Construct new tiles or dispatch an airship crew to begin production!&quot;
              </p>
            </div>
            <div className="pt-1">
              <Link href="/kingdom" className="inline-block">
                <Button className="btn-primary-cta text-xs px-5 py-2 h-auto shadow-md font-serif font-bold flex items-center gap-1.5">
                  <span>🏰</span> Construct kingdom tiles
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-2.5">
            {activeTimers.slice(0, 4).map(timer => {
              const isReady = Date.now() >= timer.endTime;
              return (
                <div key={timer.id} className="flex items-center justify-between p-3 rounded-xl bg-[#1b140e]/90 border border-amber-800/40 hover:border-amber-500/50 transition-all shadow-md text-xs">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{timer.icon}</span>
                    <div>
                      <div className="font-serif font-bold text-amber-200 flex items-center gap-2">
                        {timer.name}
                        <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-amber-700/50 text-amber-300/80 bg-amber-950/40 font-mono">
                          {timer.category}
                        </Badge>
                      </div>
                      <div className="text-[10px] text-amber-400/60 font-sans">{timer.location}</div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className={isReady ? "text-emerald-400 font-serif font-bold animate-pulse" : "text-amber-300 font-mono font-bold"}>
                      {isReady ? '✨ Ready!' : formatRemaining(timer.endTime)}
                    </span>
                    <Link href={timer.linkHref} className="block text-[10px] text-amber-400/70 hover:text-amber-200 underline font-serif">
                      Inspect ↗
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
