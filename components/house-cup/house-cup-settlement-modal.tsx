import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Trophy, Crown, Gift, Coins, Sparkles, Shield } from 'lucide-react';
import { fetchWithAuth } from '@/lib/fetchWithAuth';
import { logger } from '@/lib/logger';

export function HouseCupSettlementModal() {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<any>(null);
  const [claiming, setClaiming] = useState(false);

  useEffect(() => {
    const checkSettlement = async () => {
      try {
        const res = await fetchWithAuth('/api/house-cup/settlement');
        if (res.ok) {
          const body = await res.json();
          if (body.unclaimed && body.targetYear) {
            setData(body);
            setOpen(true);
          }
        }
      } catch (err) {
        logger.error('[HouseCupSettlementModal] Check error:', err);
      }
    };
    checkSettlement();
  }, []);

  const handleClaim = async () => {
    try {
      setClaiming(true);
      const res = await fetchWithAuth('/api/house-cup/settlement', { method: 'POST' });
      if (res.ok) {
        setOpen(false);
      }
    } catch (err) {
      logger.error('[HouseCupSettlementModal] Claim error:', err);
    } finally {
      setClaiming(false);
    }
  };

  if (!data) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="bg-zinc-950 border-amber-500/50 text-zinc-100 max-w-lg text-center p-6 space-y-4">
        <DialogHeader>
          <div className="w-16 h-16 rounded-full bg-amber-500/10 border-2 border-amber-400 flex items-center justify-center mx-auto mb-2 shadow-[0_0_25px_rgba(245,158,11,0.3)]">
            <Trophy className="w-8 h-8 text-amber-400 animate-pulse" />
          </div>
          <DialogTitle className="text-2xl font-bold text-amber-300">
            House Cup {data.targetYear} Concluded!
          </DialogTitle>
          <DialogDescription className="text-zinc-400 text-sm">
            The hourglasses have been settled. Here are your final circle standings and rewards!
          </DialogDescription>
        </DialogHeader>

        {/* Category Wins Summary */}
        <div className="p-4 rounded-xl bg-gradient-to-r from-amber-950/40 via-zinc-900 to-amber-950/40 border border-amber-800/40">
          <div className="text-xs uppercase tracking-wider font-semibold text-amber-400 mb-1">
            Category Victories
          </div>
          <div className="text-3xl font-extrabold text-amber-300 flex items-center justify-center gap-2">
            <Crown className="w-7 h-7 text-amber-400" />
            {data.viewerStanding?.categories_won || 0} / 7 Virtues Won
          </div>
          <div className="text-xs text-zinc-400 mt-1">
            Total Points: {(data.viewerStanding?.total_points || 0).toLocaleString()}
          </div>
        </div>

        {/* Claim Rewards CTA */}
        <Button
          onClick={handleClaim}
          disabled={claiming}
          className="w-full bg-amber-500 hover:bg-amber-600 text-black font-bold py-3 text-base shadow-[0_0_20px_rgba(245,158,11,0.4)]"
        >
          <Gift className="w-5 h-5 mr-2" />
          {claiming ? 'Claiming Rewards...' : 'Claim House Cup Rewards'}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
