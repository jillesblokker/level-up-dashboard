"use client"

import React, { useState, useEffect, useRef, useMemo } from 'react'
import Image from "next/image"
import { cn } from '@/lib/utils'
import { Tile } from '@/types/tiles'
import { ArrowRightLeft, Clock, RotateCw, Sparkles, Trash2, Check } from 'lucide-react'

interface KingdomTileItemProps {
  x: number
  y: number
  tile: Tile
  timer?: {
    endTime: number
    isReady: boolean
  } | undefined
  kingdomTile?: any
  currentTier: number
  placementMode: boolean
  readOnly: boolean
  focusCategory: string | null
  pendingHabits: string[]
  hasChaosRift?: boolean
  onClick: (x: number, y: number, tile: Tile) => void
  onMove: (x: number, y: number, tile: Tile) => void
  onDelete: (x: number, y: number, tile: Tile) => void
  onRotate: (x: number, y: number, tile: Tile) => void
  formatTimeRemaining: (endTime: number) => string
}

import { KINGDOM_TILES } from '@/lib/kingdom-tiles'

export const KingdomTileItem = React.memo(({
  x,
  y,
  tile,
  timer,
  kingdomTile,
  currentTier,
  placementMode,
  readOnly,
  focusCategory,
  pendingHabits,
  hasChaosRift = false,
  onClick,
  onMove,
  onDelete,
  onRotate,
  formatTimeRemaining
}: KingdomTileItemProps) => {
  const isReady = timer?.isReady || false
  const isKingdomTile = tile.type !== 'vacant'
  const type = tile.type?.toLowerCase()

  const [isNewlyPlaced, setIsNewlyPlaced] = useState(false)
  const prevTypeRef = useRef(tile.type)

  useEffect(() => {
    let timeoutId: NodeJS.Timeout | undefined
    if (tile.type !== 'vacant' && prevTypeRef.current === 'vacant') {
      setIsNewlyPlaced(true)
      timeoutId = setTimeout(() => setIsNewlyPlaced(false), 500)
    }
    prevTypeRef.current = tile.type
    return () => {
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [tile.type])
  
  // Use KINGDOM_TILES as the source of truth for the image to bypass stale paths in DB
  const libraryTile = KINGDOM_TILES.find(t => t.id === type)
  const actualImage = libraryTile?.image || tile.image || ''

  const isNonProducerTile = useMemo(() => {
    if (tile.type === 'vacant' || tile.type === 'empty') return true;
    if (libraryTile && libraryTile.timerMinutes === 0) return true;
    if (kingdomTile && kingdomTile.timerMinutes === 0) return true;
    const t = tile.type?.toLowerCase() || '';
    return t.includes('road') || t.includes('path') || t.includes('cobble') || t.includes('dirt') || t === 'water' || t === 'grass' || t === 'wall';
  }, [tile.type, libraryTile, kingdomTile]);

  // Synergy Aura logic hoisted for efficiency
  let auraColor = ''
  let synergyLabel = ''
  if (type === 'library') { auraColor = 'blue'; synergyLabel = '+10% Knowledge XP'; }
  else if (type === 'training-grounds') { auraColor = 'red'; synergyLabel = '+10% Might XP'; }
  else if (type === 'zen-garden' || type === 'temple') { auraColor = 'emerald'; synergyLabel = '+10% Wellness XP'; }
  else if (type === 'castle') { auraColor = 'amber'; synergyLabel = '+10% Honor XP'; }

  const isPending = pendingHabits.includes(type)
  const isFocused = focusCategory && (
    (focusCategory === 'might' && ['training-grounds', 'blacksmith', 'archery', 'jousting', 'watchtower'].includes(type)) ||
    (focusCategory === 'knowledge' && ['library', 'wizard', 'temple', 'monument'].includes(type)) ||
    (focusCategory === 'wellness' && ['zen-garden', 'temple', 'fountain', 'well', 'pond', 'park'].includes(type)) ||
    (focusCategory === 'honor' && ['castle', 'mansion', 'mayor', 'monument'].includes(type))
  )

  return (
    <button
      onClick={() => onClick(x, y, tile)}
      className={cn(
        "relative aspect-square border group transition-all duration-200 ease-out overflow-hidden shadow-sm hover:-translate-y-0.5 hover:shadow-[0_8px_20px_rgba(245,158,11,0.25)] touch-manipulation select-none active:scale-95 active:brightness-125 active:border-amber-400 active:ring-2 active:ring-amber-400/80",
        tile.type === 'vacant' 
          ? "bg-zinc-900 border-white/5 hover:bg-zinc-800/60" 
          : "bg-zinc-800 border-white/10 hover:border-amber-500/50",
        isNewlyPlaced && "animate-building-drop",
        isReady && "animate-harvest-glow-subtle",
        placementMode && tile.type === 'vacant' && "ring-2 ring-amber-500 animate-pulse bg-amber-500/10",
        isFocused && "ring-2 ring-amber-400 z-10 shadow-[0_0_15px_rgba(245,158,11,0.4)]",
        focusCategory && !isFocused && "opacity-40 grayscale-[0.5]"
      )}
      style={{ willChange: 'transform, opacity' }} // GPU Acceleration
    >
      <div 
        className="absolute inset-0 flex items-center justify-center p-0.5 md:p-1 transition-transform duration-500"
        style={{ transform: `rotate(${tile.rotation || 0}deg)` }}
      >
        {actualImage && (
          <Image
            src={actualImage.startsWith('/') ? actualImage : `/images/kingdom-tiles/${actualImage}`}
            alt={tile.name || tile.type}
            fill
            sizes="(max-width: 768px) 10vw, 5vw"
            className="object-cover transition-transform duration-500 group-hover:scale-110"
            unoptimized={true}
          />
        )}
      </div>

      {/* Castle Story Overlay (Desktop Only) */}
      {type === 'castle' && (
        <div className="absolute inset-0 bg-zinc-950 hidden md:flex flex-col items-center justify-center p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-50 pointer-events-none">
          <p className="text-[10px] text-amber-200 text-center font-serif leading-tight">
            &quot;The world fell to ruin, but with Necrion&apos;s aid, the King&apos;s legacy shall be rebuilt.&quot;
          </p>
        </div>
      )}

      {/* Efficiency Badge */}
      {tile.type !== 'vacant' && !['path', 'dirt-path', 'road', 'cobblestone', 'water', 'grass', 'crossroad', 'straightroad', 'cornerroad', 'tsplitroad'].includes(tile.type) && (
        <div className="absolute bottom-1 right-1 bg-zinc-950 px-1 rounded border border-white/10 text-[7px] font-bold text-amber-500/90 tracking-tighter z-40">
          {currentTier > 2 ? 'III' : currentTier > 1 ? 'II' : 'I'}
        </div>
      )}

      {/* Aura Effect */}
      {auraColor && (
        <div className={cn(
          "absolute inset-0 transition-opacity duration-1000",
          auraColor === 'blue' ? "bg-blue-400/5 shadow-[inset_0_0_20px_rgba(59,130,246,0.1)]" :
          auraColor === 'red' ? "bg-red-400/5 shadow-[inset_0_0_20px_rgba(239,68,68,0.1)]" :
          auraColor === 'emerald' ? "bg-emerald-400/5 shadow-[inset_0_0_20px_rgba(16,185,129,0.1)]" :
          auraColor === 'amber' ? "bg-amber-400/5 shadow-[inset_0_0_20px_rgba(245,158,11,0.1)]" : ""
        )} />
      )}

      {/* Pending Habit Indicator */}
      {isPending && (
        <div className="absolute top-1 left-1 animate-bounce z-40 bg-white/90 rounded-full w-4 h-4 flex items-center justify-center shadow-lg border border-amber-200">
           <span className="text-[8px]">📜</span>
        </div>
      )}

      {/* Ruins Overlay - triggered when >10 daily habits are missed */}
      {hasChaosRift && (
        <>
          {/* Dark pulsing vignette */}
          <div
            className="absolute inset-0 z-30 pointer-events-none animate-pulse"
            style={{
              background: 'radial-gradient(ellipse at center, rgba(88,28,135,0.7) 0%, rgba(15,5,35,0.85) 70%)',
              boxShadow: 'inset 0 0 20px rgba(139,0,255,0.6), inset 0 0 40px rgba(80,0,180,0.4)'
            }}
          />
          {/* Rift cracks (CSS-drawn via borders) */}
          <div
            className="absolute inset-0 z-31 pointer-events-none"
            style={{
              background:
                'repeating-linear-gradient(45deg, transparent, transparent 4px, rgba(200,100,255,0.15) 4px, rgba(200,100,255,0.15) 5px)',
            }}
          />
          {/* Ruins icon badge */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-40 flex flex-col items-center">
            <span
              className="text-base md:text-lg drop-shadow-[0_0_8px_rgba(200,0,255,1)] animate-pulse select-none"
              title="The Ruins creep in! Complete your daily habits to restore order."
            >
              🌀
            </span>
          </div>
          {/* Tooltip on hover */}
          <div className="absolute inset-x-0 bottom-0 z-50 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <div className="bg-purple-950/95 border border-purple-500/40 rounded-t px-1 py-0.5 text-[8px] text-purple-200 text-center leading-tight">
              ⚠️ The Ruins<br/>
              <span className="text-purple-400">Complete 10+ habits</span>
            </div>
          </div>
        </>
      )}

      {/* Hover Info-Card (Desktop Only) */}
      {(['daily-hub', 'dailyhub', 'daily_hub', 'quest-board', 'market', 'market-stalls', 'dungeon', 'dungeon-keep', 'monument', 'mystic_bazaar', 'airship_harbor', 'housecup', 'observatory', 'hall_of_champions', 'titan_watchtower', 'castle', 'library', 'training-grounds', 'serene_lake'].includes(type) || auraColor) && (
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-zinc-950/80 transition-all pointer-events-none hidden md:flex flex-col items-center justify-center p-1 z-50">
            <div className="bg-zinc-900/95 border border-white/10 rounded-lg p-2 shadow-2xl scale-75 group-hover:scale-100 opacity-0 group-hover:opacity-100 transition-all duration-300 ">
              <p className="text-[10px] font-bold text-amber-100 uppercase tracking-tighter text-center">{libraryTile?.name || kingdomTile?.name || tile.name || tile.type}</p>
              <div className="h-px bg-white/10 my-1 w-full" />
              <p className="text-[8px] text-zinc-400 text-center italic">
                {type.includes('daily') ? 'Portal: Habit Dashboard' :
                 type === 'quest-board' ? 'Portal: Tasks & Milestones' :
                 type === 'market' || type === 'market-stalls' ? 'Portal: Royal Exchange' :
                 type.includes('mystic') ? 'Portal: Mystic Bazaar' :
                 type === 'dungeon' || type === 'dungeon-keep' ? 'Portal: Combat Depths' :
                 type === 'monument' ? 'Statue: Achievements' :
                 type === 'airship_harbor' ? 'Portal: Skydock Voyages' :
                 type === 'housecup' ? 'Portal: Hourglass Spire' :
                 type === 'observatory' ? 'Portal: Cartography Spire' :
                 type === 'hall_of_champions' ? 'Portal: Hall of Champions' :
                 type === 'titan_watchtower' ? 'Portal: Titan Raid' :
                 type === 'castle' ? 'Portal: Royal Castle' :
                 type === 'library' ? 'Portal: Archives & Lore' :
                 type === 'training-grounds' ? 'Portal: Barracks Vault' :
                 auraColor ? synergyLabel : 'Waypoint Available'}
              </p>
              
              <div className="flex items-center justify-between text-[10px] text-zinc-400 border-t border-white/5 pt-2 mt-2">
                <span>Current Tier</span>
                <span className="text-amber-500">Tier {currentTier}</span>
              </div>
            </div>
          </div>
      )}

      {/* Move/Rotate/Delete Controls - Desktop Hover & Edit Overlay */}
      {isKingdomTile && !placementMode && !readOnly && (
        <div className="absolute top-1 right-1 flex gap-1 z-[60] opacity-0 group-hover:opacity-100 transition-opacity hidden md:flex">
          <div
            role="button"
            title="Rotate 90°"
            className="bg-amber-600 text-white p-1 rounded hover:bg-amber-700 shadow-md transform hover:scale-110 transition-transform cursor-pointer"
            onClick={(e) => {
              e.stopPropagation()
              onRotate(x, y, tile)
            }}
          >
            <RotateCw className="w-3 h-3" />
          </div>
          <div
            role="button"
            title="Move Tile"
            className="bg-blue-600 text-white p-1 rounded hover:bg-blue-700 shadow-md transform hover:scale-110 transition-transform cursor-pointer"
            onClick={(e) => {
              e.stopPropagation()
              onMove(x, y, tile)
            }}
          >
            <ArrowRightLeft className="w-3 h-3" />
          </div>
          <div
            role="button"
            title="Store in Inventory"
            className="bg-red-600 text-white p-1 rounded hover:bg-red-700 shadow-md transform hover:scale-110 transition-transform cursor-pointer"
            onClick={(e) => {
              e.stopPropagation()
              onDelete(x, y, tile)
            }}
          >
            <Trash2 className="w-3 h-3" />
          </div>
        </div>
      )}

      {/* Minigame Attempt Badge (Always visible on minigame tiles) */}
      {(() => {
        if (!isKingdomTile) return null;
        const isNonProducer = (libraryTile && libraryTile.timerMinutes === 0) ||
          (kingdomTile && kingdomTile.timerMinutes === 0) ||
          ['vacant', 'empty', 'path', 'dirt-path', 'road', 'cobblestone', 'water', 'grass', 'crossroad', 'straightroad', 'cornerroad', 'tsplitroad', 'wall', 'fountain', 'monument', 'statue'].includes(type) ||
          type.includes('road') ||
          type.includes('path') ||
          type.includes('cobble') ||
          type.includes('dirt');

        if (isNonProducer) return null;

        const getMinigameBadgeState = (t: string) => {
          if (typeof window === 'undefined') return { badge: '1/1', isClosed: false };
          const today = new Date().toISOString().split('T')[0];
          const now = new Date();
          const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0);
          const msRemaining = Math.max(0, midnight.getTime() - now.getTime());
          const hours = Math.floor(msRemaining / (1000 * 60 * 60));
          const minutes = Math.floor((msRemaining % (1000 * 60 * 60)) / (1000 * 60));
          const timerStr = `⏳ ${hours}h ${minutes}m`;

          if (t === 'dungeon' || t === 'dungeon-keep') {
            try {
              const storage = localStorage.getItem('dungeon_daily_limit');
              let data = storage ? JSON.parse(storage) : { date: today, count: 0 };
              if (data.date !== today) data = { date: today, count: 0 };
              const remaining = Math.max(0, 3 - (data.count || 0));
              if (remaining <= 0) return { badge: '0/3', isClosed: true, formattedTimer: timerStr };
              return { badge: `${remaining}/3`, isClosed: false };
            } catch {
              return { badge: '3/3', isClosed: false };
            }
          }

          if (t === 'fortune_teller' || t === 'fortune-teller') {
            try {
              const lastDrawDate = localStorage.getItem('tarot-last-draw-date');
              const drawnToday = lastDrawDate === today;
              if (drawnToday) return { badge: '0/1', isClosed: true, formattedTimer: timerStr };
              return { badge: '1/1', isClosed: false };
            } catch {
              return { badge: '1/1', isClosed: false };
            }
          }

          if (t === 'plank-labyrinth' || t === 'labyrinth' || t === 'plank_labyrinth') {
            try {
              const storage = localStorage.getItem('labyrinth_daily_limit');
              let data = storage ? JSON.parse(storage) : { date: today, count: 0 };
              if (data.date !== today) data = { date: today, count: 0 };
              const remaining = Math.max(0, 1 - (data.count || 0));
              if (remaining <= 0) return { badge: '0/1', isClosed: true, formattedTimer: timerStr };
              return { badge: `${remaining}/1`, isClosed: false };
            } catch {
              return { badge: '1/1', isClosed: false };
            }
          }

          if (t === 'zen-garden' || t === 'zen_garden') {
            try {
              const storage = localStorage.getItem('zen_daily_limit');
              let data = storage ? JSON.parse(storage) : { date: today, count: 0 };
              if (data.date !== today) data = { date: today, count: 0 };
              const remaining = Math.max(0, 1 - (data.count || 0));
              if (remaining <= 0) return { badge: '0/1', isClosed: true, formattedTimer: timerStr };
              return { badge: '1/1', isClosed: false };
            } catch {
              return { badge: '1/1', isClosed: false };
            }
          }

          return { badge: '1/1', isClosed: false };
        };

        if (type === 'dungeon' || type === 'dungeon-keep') {
          const state = getMinigameBadgeState(type);
          return (
            <div className={cn(
              "absolute top-1 left-1 z-40 px-1 py-0.5 rounded-md border text-[8px] font-mono font-black flex items-center gap-0.5 shadow-md",
              state.isClosed ? "bg-red-950/90 border-red-500/50 text-red-300" : "bg-purple-950/90 border-purple-500/50 text-purple-200"
            )}>
              <span>⚔️</span>
              <span>{state.badge}</span>
            </div>
          );
        }
        if (type === 'plank-labyrinth' || type === 'labyrinth' || type === 'plank_labyrinth') {
          const state = getMinigameBadgeState(type);
          return (
            <div className={cn(
              "absolute top-1 left-1 z-40 px-1 py-0.5 rounded-md border text-[8px] font-mono font-black flex items-center gap-0.5 shadow-md",
              state.isClosed ? "bg-red-950/90 border-red-500/50 text-red-300" : "bg-cyan-950/90 border-cyan-500/50 text-cyan-200"
            )}>
              <span>🧩</span>
              <span>{state.badge}</span>
            </div>
          );
        }
        if (type === 'fortune_teller' || type === 'fortune-teller') {
          const state = getMinigameBadgeState(type);
          return (
            <div className={cn(
              "absolute top-1 left-1 z-40 px-1 py-0.5 rounded-md border text-[8px] font-mono font-black flex items-center gap-0.5 shadow-md",
              state.isClosed ? "bg-red-950/90 border-red-500/50 text-red-300" : "bg-fuchsia-950/90 border-fuchsia-500/50 text-fuchsia-200"
            )}>
              <span>🔮</span>
              <span>{state.badge}</span>
            </div>
          );
        }
        if (type === 'zen-garden' || type === 'zen_garden') {
          const state = getMinigameBadgeState(type);
          return (
            <div className={cn(
              "absolute top-1 left-1 z-40 px-1 py-0.5 rounded-md border text-[8px] font-mono font-black flex items-center gap-0.5 shadow-md",
              state.isClosed ? "bg-red-950/90 border-red-500/50 text-red-300" : "bg-emerald-950/90 border-emerald-500/50 text-emerald-200"
            )}>
              <span>🧘</span>
              <span>{state.badge}</span>
            </div>
          );
        }
        return null;
      })()}

      {/* Timer overlay */}
      {isKingdomTile && (
        (() => {
          const isRoadOrTerrain = ['vacant', 'empty', 'path', 'dirt-path', 'road', 'cobblestone', 'water', 'grass', 'crossroad', 'straightroad', 'cornerroad', 'tsplitroad', 'wall'].includes(type) ||
            type.includes('road') ||
            type.includes('path') ||
            type.includes('cobble') ||
            type.includes('dirt');

          const isMinigame = ['dungeon', 'dungeon-keep', 'plank-labyrinth', 'labyrinth', 'plank_labyrinth', 'fortune_teller', 'fortune-teller', 'zen-garden', 'zen_garden'].includes(type);

          const isNonProducer = ((libraryTile && libraryTile.timerMinutes === 0) ||
            (kingdomTile && kingdomTile.timerMinutes === 0) ||
            isRoadOrTerrain) && !isMinigame;

          if (isNonProducer) {
            if (isRoadOrTerrain) return null;
            const landmarkName = libraryTile?.name || kingdomTile?.name || (type === 'daily-hub' ? 'Daily Hub' : type === 'monument' ? 'Hall of Fame' : '');
            if (!landmarkName) return null;

            return (
              <div className="transition-opacity duration-200 absolute bottom-1 left-1/2 -translate-x-1/2 w-max max-w-[90%] pointer-events-none group-hover:opacity-100 opacity-100 md:opacity-0 z-30">
                <div className="text-[9px] md:text-xs px-2 py-0.5 rounded text-center font-mono font-bold shadow-md min-h-[16px] md:min-h-[20px] flex items-center justify-center shrink-0 border bg-zinc-950/90 border-amber-500/40 text-amber-200 truncate w-auto inline-flex">
                  <span className="truncate">{landmarkName}</span>
                </div>
              </div>
            );
          }
          
          if (!timer && !isMinigame) return null;

          const getMinigameBadgeState = (t: string) => {
            if (typeof window === 'undefined') return { badge: '1/1', isClosed: false };
            const today = new Date().toISOString().split('T')[0];
            const now = new Date();
            const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0);
            const msRemaining = Math.max(0, midnight.getTime() - now.getTime());
            const hours = Math.floor(msRemaining / (1000 * 60 * 60));
            const minutes = Math.floor((msRemaining % (1000 * 60 * 60)) / (1000 * 60));
            const timerStr = `⏳ ${hours}h ${minutes}m`;

            if (t === 'dungeon' || t === 'dungeon-keep') {
              try {
                const storage = localStorage.getItem('dungeon_daily_limit');
                let data = storage ? JSON.parse(storage) : { date: today, count: 0 };
                if (data.date !== today) data = { date: today, count: 0 };
                const remaining = Math.max(0, 3 - (data.count || 0));
                if (remaining <= 0) return { badge: '0/3', isClosed: true, formattedTimer: timerStr };
                return { badge: `${remaining}/3`, isClosed: false };
              } catch {
                return { badge: '3/3', isClosed: false };
              }
            }

            if (t === 'fortune_teller' || t === 'fortune-teller') {
              try {
                const lastDrawDate = localStorage.getItem('tarot-last-draw-date');
                const drawnToday = lastDrawDate === today;
                if (drawnToday) return { badge: '0/1', isClosed: true, formattedTimer: timerStr };
                return { badge: '1/1', isClosed: false };
              } catch {
                return { badge: '1/1', isClosed: false };
              }
            }

            if (t === 'plank-labyrinth' || t === 'labyrinth' || t === 'plank_labyrinth') {
              try {
                const storage = localStorage.getItem('labyrinth_daily_limit');
                let data = storage ? JSON.parse(storage) : { date: today, count: 0 };
                if (data.date !== today) data = { date: today, count: 0 };
                const remaining = Math.max(0, 1 - (data.count || 0));
                if (remaining <= 0) return { badge: '0/1', isClosed: true, formattedTimer: timerStr };
                return { badge: `${remaining}/1`, isClosed: false };
              } catch {
                return { badge: '1/1', isClosed: false };
              }
            }

            if (t === 'zen-garden' || t === 'zen_garden') {
              try {
                const storage = localStorage.getItem('zen_daily_limit');
                let data = storage ? JSON.parse(storage) : { date: today, count: 0 };
                if (data.date !== today) data = { date: today, count: 0 };
                const remaining = Math.max(0, 1 - (data.count || 0));
                if (remaining <= 0) return { badge: '0/1', isClosed: true, formattedTimer: timerStr };
                return { badge: '1/1', isClosed: false };
              } catch {
                return { badge: '1/1', isClosed: false };
              }
            }

            return { badge: '1/1', isClosed: false };
          };

          return (
            <div className={cn(
              "transition-opacity duration-200 absolute bottom-1 left-1/2 -translate-x-1/2 w-max max-w-[90%] pointer-events-none group-hover:opacity-100 z-30",
              timer && (timer.endTime - Date.now() > 3 * 60 * 1000 && !isReady) ? "opacity-0 md:opacity-0" : "opacity-100 md:opacity-0"
            )}>
              <div className={cn(
                "text-[9px] md:text-xs px-2 py-0.5 rounded text-center font-mono shadow-md min-h-[16px] md:min-h-[20px] flex items-center justify-center shrink-0 border w-auto inline-flex gap-1",
                isMinigame
                  ? (type === 'dungeon' || type === 'dungeon-keep'
                      ? "bg-gradient-to-r from-red-900 via-purple-900 to-indigo-900 border-purple-400/60 text-purple-100 font-bold"
                      : type.includes('fortune')
                      ? "bg-gradient-to-r from-purple-900 via-fuchsia-900 to-pink-900 border-fuchsia-400/60 text-fuchsia-100 font-bold"
                      : type.includes('zen')
                      ? "bg-gradient-to-r from-emerald-900 via-teal-900 to-cyan-900 border-emerald-400/60 text-emerald-100 font-bold"
                      : "bg-gradient-to-r from-cyan-900 via-teal-900 to-emerald-900 border-cyan-400/60 text-cyan-100 font-bold")
                  : (isReady 
                      ? "bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 text-zinc-950 font-black border-yellow-300 shadow-[0_0_12px_rgba(245,158,11,0.6)]" 
                      : "bg-zinc-950/90 border-amber-900/40 text-amber-200")
              )}>
                {isMinigame ? (
                  <div className="flex items-center justify-center gap-1">
                    {(() => {
                      const state = getMinigameBadgeState(type);
                      if (type.includes('dungeon')) {
                        return (
                          <span>
                            ⚔️ {state.badge} {state.isClosed ? `(${state.formattedTimer || 'Reset at Midnight'})` : 'Attempts'}
                          </span>
                        );
                      }
                      if (type.includes('labyrinth')) {
                        return (
                          <span>
                            🧩 {state.badge} {state.isClosed ? `(${state.formattedTimer || 'Reset at Midnight'})` : 'Attempts'}
                          </span>
                        );
                      }
                      if (type.includes('fortune')) {
                        return (
                          <span>
                            🔮 {state.badge} {state.isClosed ? `(${state.formattedTimer || 'Reset at Midnight'})` : 'Cards'}
                          </span>
                        );
                      }
                      if (type.includes('zen')) {
                        return (
                          <span>
                            🧘 {state.badge} {state.isClosed ? `(${state.formattedTimer || 'Reset at Midnight'})` : 'Attempts'}
                          </span>
                        );
                      }
                      return <span>{state.badge} {state.isClosed ? `(${state.formattedTimer})` : 'Ready'}</span>;
                    })()}
                  </div>
                ) : isReady ? (
                  <div className="flex items-center justify-center gap-1 relative">
                    {type === 'bakery' && <span className="absolute -top-8 text-3xl drop-shadow-[0_0_12px_rgba(251,191,36,0.8)] z-50 animate-pulse">🍞</span>}
                    {type === 'blacksmith' && <span className="absolute -top-8 text-3xl drop-shadow-[0_0_12px_rgba(156,163,175,0.8)] z-50 animate-pulse">🔨</span>}
                    <Check className="w-3 h-3 md:hidden" />
                    <Sparkles className="hidden md:block w-3 h-3 sm:w-4 sm:h-4 text-zinc-950" />
                    <span className="whitespace-nowrap font-extrabold text-[10px] md:text-xs">
                      {type === 'bakery' ? 'Food Ready!' : 
                       type === 'blacksmith' ? 'Crafting Ready!' : 
                       '🪙 Collect Taxes!'}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-0.5 md:gap-1">
                    <Clock className="w-2.5 h-2.5 md:w-3.5 md:h-3.5 opacity-70 text-amber-400" />
                    <span className="whitespace-nowrap font-bold tracking-tighter">
                      {timer ? formatTimeRemaining(timer.endTime) : ''}
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })()
      )}
    </button>
  )
})

KingdomTileItem.displayName = 'KingdomTileItem'
