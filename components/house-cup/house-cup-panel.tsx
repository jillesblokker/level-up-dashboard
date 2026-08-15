import React, { useState, useEffect } from 'react';
import { Hourglass } from './hourglass';
import { CategoryBreakdownModal } from './category-breakdown-modal';
import type { HouseCupStandings } from '@/lib/house-cup-utils';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Trophy, Crown, Users, UserPlus, Shield, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { fetchWithAuth } from '@/lib/fetchWithAuth';
import { logger } from '@/lib/logger';
import { motion, AnimatePresence } from 'framer-motion';

const CATEGORY_META: Record<string, { name: string; emoji: string; color: string }> = {
  might: { name: 'Might', emoji: '💪', color: '#f97316' },
  knowledge: { name: 'Knowledge', emoji: '📚', color: '#38bdf8' },
  honor: { name: 'Honor', emoji: '👑', color: '#eab308' },
  castle: { name: 'Castle', emoji: '🏰', color: '#cbd5e1' },
  craft: { name: 'Craft', emoji: '⚒️', color: '#94a3b8' },
  vitality: { name: 'Vitality', emoji: '❤️', color: '#ef4444' },
  wellness: { name: 'Wellness', emoji: '🌿', color: '#22c55e' },
  exploration: { name: 'Exploration', emoji: '🧭', color: '#a855f7' },
  conquest: { name: 'Conquest', emoji: '🗡️', color: '#06b6d4' },
};

/**
 * 2-Frame Carousel Card for Ally Standings
 * Frame 1: Info & Stats (First name, Title, Total Points, Category Wins)
 * Frame 2: 9 Virtue Hourglasses Grid (3x3)
 */
function AllyCarouselCard({
  ally,
  onSelect,
  onCategoryClick,
}: {
  ally: HouseCupStandings;
  onSelect: (ally: HouseCupStandings) => void;
  onCategoryClick?: (catKey: string, ally: HouseCupStandings) => void;
}) {
  const [frame, setFrame] = useState<'info' | 'virtues'>('info');

  const toggleFrame = (e: React.MouseEvent) => {
    e.stopPropagation();
    setFrame(prev => (prev === 'info' ? 'virtues' : 'info'));
  };

  return (
    <Card className="border-zinc-800 bg-zinc-900/90 hover:border-amber-500/40 p-4 transition-all group hover:shadow-lg relative overflow-hidden flex flex-col justify-between h-[470px] min-h-[470px] max-h-[470px]">
      {/* Top Header bar with Frame Switcher */}
      <div className="flex items-center justify-between mb-2 pb-2 border-b border-zinc-800 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-10 h-10 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold text-sm select-none shrink-0 shadow-inner">
            {ally.display_name.slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="font-semibold text-base text-zinc-100 group-hover:text-amber-300 transition-colors truncate">
              {ally.display_name}
            </div>
            <div className="text-xs text-zinc-400 truncate">{ally.title}</div>
          </div>
        </div>

        {/* Frame Toggle Controls */}
        <div className="flex items-center gap-1.5 shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleFrame}
            className="h-8 px-3 text-xs font-semibold text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 border border-amber-500/20 rounded-lg"
          >
            {frame === 'info' ? '9 Virtues →' : '← Info'}
          </Button>
        </div>
      </div>

      {/* Frame Content */}
      <div className="flex-1 my-1 flex flex-col justify-between overflow-hidden">
        <AnimatePresence mode="wait">
          {frame === 'info' ? (
            <motion.div
              key="info"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.2 }}
              onClick={() => onSelect(ally)}
              className="cursor-pointer flex flex-col justify-between h-full space-y-3 py-1"
            >
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/80 space-y-1">
                    <div className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider">Total score</div>
                    <div className="font-bold text-amber-300 text-lg">{ally.total_points.toLocaleString()} pts</div>
                  </div>
                  <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/80 space-y-1">
                    <div className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider">Virtue wins</div>
                    <div className="font-bold text-emerald-400 text-lg">{ally.categories_won} / 9 Categories</div>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-gradient-to-r from-amber-950/40 via-zinc-900 to-amber-950/40 border border-amber-500/40 text-center space-y-1 relative shadow-md">
                  <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-amber-300 font-serif">
                    <Crown className="w-4 h-4 text-amber-400 animate-pulse" /> House Leader: {ally.display_name}
                  </div>
                  <p className="text-[10px] text-zinc-400 font-mono">👑 Glowing Virtues Leader Active</p>
                </div>

                <div className="p-3.5 rounded-xl bg-zinc-950/40 border border-zinc-800/60 text-xs space-y-1.5 text-zinc-300">
                  <div className="text-[10px] text-amber-400 font-semibold uppercase tracking-wider flex items-center justify-between">
                    <span>Standings breakdown</span>
                    <span className="text-[9px] text-emerald-400 font-mono font-bold">Top Virtues Active</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-500/40 text-[10px] font-mono font-bold">🥇 #1 Might</span>
                    <span className="px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-500/40 text-[10px] font-mono font-bold">🥈 #2 Knowledge</span>
                    <span className="px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-500/40 text-[10px] font-mono font-bold">🥉 #3 Castle</span>
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center group-hover:bg-amber-500/20 transition-all">
                <div className="text-xs font-bold text-amber-300">Tap card for detailed summary →</div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="virtues"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="h-full flex flex-col justify-center py-1 overflow-hidden"
            >
              {/* 9 Hourglasses in 3x3 Grid (Fits 470px height with zero clipping!) */}
              <div className="grid grid-cols-3 gap-2">
                {['might', 'knowledge', 'honor', 'castle', 'craft', 'vitality', 'wellness', 'exploration', 'conquest'].map(catKey => {
                  const meta = CATEGORY_META[catKey];
                  if (!meta) return null;
                  const pts = ally.categories[catKey]?.points || 0;
                  return (
                    <Hourglass
                      key={catKey}
                      categoryId={catKey}
                      categoryName={meta.name}
                      emoji={meta.emoji}
                      color={meta.color}
                      points={pts}
                      variant="compact"
                      onClick={() => onCategoryClick ? onCategoryClick(catKey, ally) : onSelect(ally)}
                    />
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Frame Indicators (Dots) */}
      <div className="flex justify-center items-center gap-1.5 pt-2 shrink-0 border-t border-zinc-800/60">
        <button
          onClick={() => setFrame('info')}
          className={`w-2 h-2 rounded-full transition-all ${frame === 'info' ? 'bg-amber-400 w-4' : 'bg-zinc-700'}`}
        />
        <button
          onClick={() => setFrame('virtues')}
          className={`w-2 h-2 rounded-full transition-all ${frame === 'virtues' ? 'bg-amber-400 w-4' : 'bg-zinc-700'}`}
        />
      </div>
    </Card>
  );
}

export function HouseCupPanel() {
  const [standings, setStandings] = useState<HouseCupStandings[]>([]);
  const [seenMap, setSeenMap] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<HouseCupStandings | null>(null);
  const [selectedCategoryKey, setSelectedCategoryKey] = useState<string | null>(null);
  const [selectedCategoryUserId, setSelectedCategoryUserId] = useState<string | undefined>(undefined);
  const allyCarouselRef = React.useRef<HTMLDivElement>(null);

  const scrollAllyCarousel = (direction: 'left' | 'right') => {
    if (allyCarouselRef.current) {
      const scrollAmount = allyCarouselRef.current.clientWidth * 0.8;
      allyCarouselRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  const loadStandings = async () => {
    try {
      setLoading(true);
      const [resStandings, resSeen] = await Promise.all([
        fetchWithAuth('/api/house-cup/standings'),
        fetchWithAuth('/api/house-cup/seen'),
      ]);

      if (resStandings.ok) {
        const data = await resStandings.json();
        const standingsList = data.standings || data.data?.standings || [];
        setStandings(standingsList);

        if (resSeen.ok) {
          const seenData = await resSeen.json();
          setSeenMap(seenData.seen || {});

          const viewerObj = standingsList.find((s: HouseCupStandings) => s.is_viewer);
          if (viewerObj && viewerObj.categories) {
            const updatedSeenPayload: Record<string, number> = {};
            Object.keys(viewerObj.categories).forEach(cat => {
              updatedSeenPayload[cat] = viewerObj.categories[cat].points || 0;
            });
            setTimeout(() => {
              fetchWithAuth('/api/house-cup/seen', {
                method: 'POST',
                body: JSON.stringify({ seenMap: updatedSeenPayload }),
              }).catch(() => {});
            }, 2500);
          }
        }
      }
    } catch (err) {
      logger.error('[HouseCupPanel] Error loading standings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStandings();
  }, []);

  const viewerStanding = standings.find(s => s.is_viewer) || standings[0];
  const alliesStandings = standings.filter(s => !s.is_viewer);
  const currentYear = new Date().getFullYear();

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <Card className="border-amber-700/30 bg-gradient-to-r from-amber-950/80 via-zinc-900 to-amber-950/80 text-amber-100 shadow-xl overflow-hidden relative">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Trophy className="w-48 h-48 text-amber-400" />
        </div>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl">
                <Trophy className="w-7 h-7 text-amber-400" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold text-amber-300">
                  The House Cup {currentYear}
                </CardTitle>
                <CardDescription className="text-zinc-400 text-sm">
                  Compete with your allies across 9 virtues. Crowned on Jan 1st.
                </CardDescription>
              </div>
            </div>
            {viewerStanding && (
              <div className="text-right">
                <div className="text-xs text-amber-400/80 font-semibold">Your virtues</div>
                <div className="text-lg font-bold text-amber-300 flex items-center gap-1 justify-end">
                  <Crown className="w-4 h-4 text-amber-400" />
                  {viewerStanding.categories_won} / 9 Categories
                </div>
              </div>
            )}
          </div>
        </CardHeader>

        {/* Your 9 Hourglasses (Smart Layout: 3x3 Mobile | 5 Top + 4 Bottom Desktop) */}
        {viewerStanding && (
          <CardContent className="pt-2">
            <div className="p-4 bg-zinc-950/60 rounded-xl border border-amber-900/30 space-y-3">
              <div className="text-xs font-semibold text-amber-400/90 flex items-center justify-between">
                <span>Your Virtue Hourglasses</span>
                <span className="text-zinc-400 font-normal">Total Points: {viewerStanding.total_points.toLocaleString()}</span>
              </div>

              {/* Mobile Viewport (< 640px): 3 Rows of 3 */}
              <div className="grid grid-cols-3 gap-2.5 sm:hidden">
                {Object.entries(CATEGORY_META).map(([catKey, meta], idx) => {
                  const pts = viewerStanding.categories[catKey]?.points || 0;
                  const seenPts = seenMap[catKey] !== undefined ? seenMap[catKey] : pts;
                  return (
                    <Hourglass
                      key={catKey}
                      categoryId={catKey}
                      categoryName={meta.name}
                      emoji={meta.emoji}
                      color={meta.color}
                      points={pts}
                      seenPoints={seenPts}
                      staggerDelayMs={idx * 60}
                      variant="compact"
                      onClick={() => {
                        setSelectedCategoryKey(catKey);
                        setSelectedCategoryUserId(viewerStanding.user_id);
                      }}
                    />
                  );
                })}
              </div>

              {/* Desktop Viewport (>= 640px): 5 on Row 1 + 4 Centered on Row 2 */}
              <div className="hidden sm:space-y-3 sm:block">
                <div className="grid grid-cols-5 gap-3">
                  {['might', 'knowledge', 'honor', 'castle', 'craft'].map((catKey, idx) => {
                    const meta = CATEGORY_META[catKey];
                    if (!meta) return null;
                    const pts = viewerStanding.categories[catKey]?.points || 0;
                    const seenPts = seenMap[catKey] !== undefined ? seenMap[catKey] : pts;
                    return (
                      <Hourglass
                        key={catKey}
                        categoryId={catKey}
                        categoryName={meta.name}
                        emoji={meta.emoji}
                        color={meta.color}
                        points={pts}
                        seenPoints={seenPts}
                        staggerDelayMs={idx * 80}
                        variant="large"
                        onClick={() => {
                          setSelectedCategoryKey(catKey);
                          setSelectedCategoryUserId(viewerStanding.user_id);
                        }}
                      />
                    );
                  })}
                </div>

                <div className="grid grid-cols-4 gap-3 max-w-[84%] mx-auto">
                  {['vitality', 'wellness', 'exploration', 'conquest'].map((catKey, idx) => {
                    const meta = CATEGORY_META[catKey];
                    if (!meta) return null;
                    const pts = viewerStanding.categories[catKey]?.points || 0;
                    const seenPts = seenMap[catKey] !== undefined ? seenMap[catKey] : pts;
                    return (
                      <Hourglass
                        key={catKey}
                        categoryId={catKey}
                        categoryName={meta.name}
                        emoji={meta.emoji}
                        color={meta.color}
                        points={pts}
                        seenPoints={seenPts}
                        staggerDelayMs={(idx + 5) * 80}
                        variant="large"
                        onClick={() => {
                          setSelectedCategoryKey(catKey);
                          setSelectedCategoryUserId(viewerStanding.user_id);
                        }}
                      />
                    );
                  })}
                </div>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* 1v1 Friend Virtue Duels (Daily Habit Races) Widget */}
      <div className="bg-gradient-to-r from-amber-950/70 via-zinc-950 to-purple-950/70 border border-amber-500/30 rounded-2xl p-4 shadow-xl space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-amber-300 font-serif font-bold text-sm">
            <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
            <span>1v1 Virtue Duel Race</span>
          </div>
          <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/30">
            +10 Bonus Virtue Points
          </span>
        </div>
        <p className="text-xs text-zinc-300 leading-relaxed">
          First friend to reach today&apos;s 5/10 daily habit sweet spot wins +10 bonus virtue points for both issuer and recipient!
        </p>
      </div>

      {/* Friends Standings Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-amber-300 flex items-center gap-2">
            <Users className="w-4 h-4 text-amber-400" />
            Friends rankings
          </h3>
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-400">{alliesStandings.length} friends</span>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => scrollAllyCarousel('left')}
                className="h-7 w-7 text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 border border-amber-500/20 rounded-lg"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => scrollAllyCarousel('right')}
                className="h-7 w-7 text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 border border-amber-500/20 rounded-lg"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {alliesStandings.length === 0 ? (
          <Card className="border border-dashed border-amber-900/40 bg-zinc-950/80 p-8 text-center space-y-3 rounded-2xl">
            <div className="text-3xl">🏆</div>
            <h4 className="font-serif text-amber-300 font-bold text-sm">House Cup Standings Active</h4>
            <p className="text-xs text-zinc-400 max-w-sm mx-auto">
              Your virtue hourglasses are tracking your daily habits! Search for friends in the Friend Board to invite allies to your House Cup circle.
            </p>
          </Card>
        ) : (
          <div
            ref={allyCarouselRef}
            className="flex overflow-x-auto snap-x snap-mandatory gap-4 pb-2 custom-scrollbar mobile-scroll-hide"
          >
            {alliesStandings.map(ally => (
              <div
                key={ally.user_id}
                className="snap-start shrink-0 w-full sm:w-[calc(40%-10px)] min-w-full sm:min-w-[calc(40%-10px)] max-w-full sm:max-w-[calc(40%-10px)]"
              >
                <AllyCarouselCard
                  ally={ally}
                  onSelect={setSelectedUser}
                  onCategoryClick={(catKey, a) => {
                    setSelectedCategoryKey(catKey);
                    setSelectedCategoryUserId(a.user_id);
                  }}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Detail Modal (§6 On tap) */}
      <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
        {selectedUser && (
          <DialogContent className="bg-zinc-950 border-amber-900/50 text-zinc-100 max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-amber-300">
                <Trophy className="w-5 h-5 text-amber-400" />
                {selectedUser.display_name}&apos;s House Cup Virtues
              </DialogTitle>
              <DialogDescription className="text-zinc-400 text-xs">
                {selectedUser.title} — {selectedUser.total_points.toLocaleString()} total points in {currentYear}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-2 pt-2">
              <p className="text-[11px] text-amber-400/80 italic mb-1">Tap any virtue below for detailed source breakdown:</p>
              {Object.entries(CATEGORY_META).map(([catKey, meta]) => {
                const pts = selectedUser.categories[catKey]?.points || 0;
                return (
                  <div
                    key={catKey}
                    onClick={() => {
                      setSelectedCategoryKey(catKey);
                      setSelectedCategoryUserId(selectedUser.user_id);
                    }}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 hover:border-amber-500/40 cursor-pointer transition-all group"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-base">{meta.emoji}</span>
                      <span className="font-medium text-zinc-200 group-hover:text-amber-300 transition-colors">{meta.name}</span>
                    </div>
                    <div className="font-bold text-amber-400 flex items-center gap-1 text-xs">
                      {pts.toLocaleString()} pts →
                    </div>
                  </div>
                );
              })}
            </div>
          </DialogContent>
        )}
      </Dialog>

      {/* Focused Virtue Category Breakdown Modal */}
      <CategoryBreakdownModal
        isOpen={!!selectedCategoryKey}
        onClose={() => {
          setSelectedCategoryKey(null);
          setSelectedCategoryUserId(undefined);
        }}
        categoryId={selectedCategoryKey}
        userId={selectedCategoryUserId}
        categoryName={selectedCategoryKey ? CATEGORY_META[selectedCategoryKey]?.name : undefined}
        emoji={selectedCategoryKey ? CATEGORY_META[selectedCategoryKey]?.emoji : undefined}
        color={selectedCategoryKey ? CATEGORY_META[selectedCategoryKey]?.color : undefined}
        points={selectedCategoryKey && viewerStanding ? viewerStanding.categories[selectedCategoryKey]?.points : undefined}
      />
    </div>
  );
}
