import React, { useState, useEffect } from 'react';
import { Hourglass } from './hourglass';
import { HouseCupStandings } from '@/lib/house-cup-service';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Trophy, Crown, Users, UserPlus, Shield, Sparkles } from 'lucide-react';
import { fetchWithAuth } from '@/lib/fetchWithAuth';
import { logger } from '@/lib/logger';

const CATEGORY_META: Record<string, { name: string; emoji: string; color: string }> = {
  might: { name: 'Might', emoji: '💪', color: '#ef4444' },
  knowledge: { name: 'Knowledge', emoji: '📚', color: '#3b82f6' },
  honor: { name: 'Honor', emoji: '👑', color: '#eab308' },
  castle: { name: 'Castle', emoji: '🏰', color: '#a855f7' },
  craft: { name: 'Craft', emoji: '⚒️', color: '#f97316' },
  vitality: { name: 'Vitality', emoji: '❤️', color: '#ec4899' },
  wellness: { name: 'Wellness', emoji: '🌿', color: '#10b981' },
};

export function HouseCupPanel() {
  const [standings, setStandings] = useState<HouseCupStandings[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<HouseCupStandings | null>(null);

  const loadStandings = async () => {
    try {
      setLoading(true);
      const res = await fetchWithAuth('/api/house-cup/standings');
      if (res.ok) {
        const data = await res.json();
        setStandings(data.standings || []);
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
                  Compete with your allies across 7 virtues. Crowned on Jan 1st.
                </CardDescription>
              </div>
            </div>
            {viewerStanding && (
              <div className="text-right">
                <div className="text-xs text-amber-400/80 uppercase tracking-wider font-semibold">Your Virtues</div>
                <div className="text-lg font-bold text-amber-300 flex items-center gap-1 justify-end">
                  <Crown className="w-4 h-4 text-amber-400" />
                  {viewerStanding.categories_won} / 7 Categories
                </div>
              </div>
            )}
          </div>
        </CardHeader>

        {/* Your 7 Hourglasses */}
        {viewerStanding && (
          <CardContent className="pt-2">
            <div className="p-4 bg-zinc-950/60 rounded-xl border border-amber-900/30">
              <div className="text-xs font-semibold text-amber-400/90 mb-3 flex items-center justify-between">
                <span>Your Hourglasses</span>
                <span className="text-zinc-400 font-normal">Total Points: {viewerStanding.total_points.toLocaleString()}</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
                {Object.entries(CATEGORY_META).map(([catKey, meta]) => {
                  const pts = viewerStanding.categories[catKey]?.points || 0;
                  return (
                    <Hourglass
                      key={catKey}
                      categoryId={catKey}
                      categoryName={meta.name}
                      emoji={meta.emoji}
                      color={meta.color}
                      points={pts}
                      variant="large"
                      onClick={() => setSelectedUser(viewerStanding)}
                    />
                  );
                })}
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Allies Standings Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-amber-300 flex items-center gap-2">
            <Users className="w-4 h-4 text-amber-400" />
            Ally Circle Standings
          </h3>
          <span className="text-xs text-zinc-400">{alliesStandings.length} Allies</span>
        </div>

        {alliesStandings.length === 0 ? (
          /* Empty State (No Allies) §6 */
          <Card className="border-amber-800/30 bg-zinc-900/80 p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto">
              <UserPlus className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <h4 className="text-lg font-bold text-amber-300">The Cup is Uncontested</h4>
              <p className="text-sm text-zinc-400 max-w-md mx-auto mt-1">
                Recruit allies to compete in the House Cup! Higher ally tiers unlock Mythic Cards, thousands of Gold, and Gems at year end.
              </p>
            </div>

            {/* Reward Tier Unlocks */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-lg mx-auto text-left text-xs">
              <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800">
                <div className="font-semibold text-amber-400 mb-1">Solo Tier</div>
                <div className="text-zinc-400">1 Gem + 100 Gold</div>
              </div>
              <div className="p-3 rounded-lg bg-zinc-950 border border-amber-500/30">
                <div className="font-semibold text-amber-300 mb-1">3+ Allies Tier</div>
                <div className="text-zinc-400">20 Gems + 5,000 Gold + 1 Mythic Pack</div>
              </div>
              <div className="p-3 rounded-lg bg-zinc-950 border border-amber-400/50">
                <div className="font-semibold text-amber-200 mb-1">10+ Allies Tier</div>
                <div className="text-zinc-400">30 Gems + 10,000 Gold + 2 Mythic Packs</div>
              </div>
            </div>

            <Button
              onClick={() => window.location.href = '/social'}
              className="bg-amber-500 hover:bg-amber-600 text-black font-semibold mt-2"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Invite an Ally
            </Button>
          </Card>
        ) : (
          /* Ally Cards List */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {alliesStandings.map(ally => (
              <Card
                key={ally.user_id}
                onClick={() => setSelectedUser(ally)}
                className="border-zinc-800 bg-zinc-900/90 hover:border-amber-500/40 p-4 transition-all cursor-pointer group hover:shadow-lg"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-amber-400" />
                    <div>
                      <div className="font-semibold text-zinc-100 group-hover:text-amber-300 transition-colors">
                        {ally.display_name}
                      </div>
                      <div className="text-xs text-zinc-400">{ally.title}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                      {ally.categories_won} Wins
                    </span>
                    <div className="text-[11px] text-zinc-500 mt-0.5">{ally.total_points.toLocaleString()} pts</div>
                  </div>
                </div>

                {/* 7 Compact Hourglasses Row */}
                <div className="flex items-center justify-between gap-1.5 pt-2 border-t border-zinc-800">
                  {Object.entries(CATEGORY_META).map(([catKey, meta]) => {
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
                      />
                    );
                  })}
                </div>
              </Card>
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

            <div className="space-y-3 pt-2">
              {Object.entries(CATEGORY_META).map(([catKey, meta]) => {
                const pts = selectedUser.categories[catKey]?.points || 0;
                return (
                  <div key={catKey} className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-base">{meta.emoji}</span>
                      <span className="font-medium text-zinc-200">{meta.name}</span>
                    </div>
                    <div className="font-bold text-amber-400">
                      {pts.toLocaleString()} pts
                    </div>
                  </div>
                );
              })}
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
