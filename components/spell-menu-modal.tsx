'use client';

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { getManaSync, spendMana } from '@/lib/mana-manager';
import { gainGold } from '@/lib/gold-manager';
import { toast } from '@/components/ui/use-toast';
import { hapticSuccess, hapticError } from '@/lib/haptics';
import { Hourglass, ShieldCheck, Sparkles, Crown } from 'lucide-react';

interface SpellMenuModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SpellMenuModal({ isOpen, onClose }: SpellMenuModalProps) {
  const [mana, setManaState] = React.useState(100);

  React.useEffect(() => {
    if (isOpen) {
      setManaState(getManaSync());
    }
  }, [isOpen]);

  const handleCastSpell = (spellName: string, cost: number, action: () => void) => {
    if (spendMana(cost)) {
      hapticSuccess();
      action();
      setManaState(getManaSync());
      onClose();
    } else {
      hapticError();
      toast({
        title: "Insufficient Mana! 🔮",
        description: `You need ${cost} Mana to cast ${spellName}. Complete daily focus habits to restore Mana!`,
        variant: "destructive"
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="border-2 border-cyan-500/50 bg-[#0b1329]/95 text-white max-w-md backdrop-blur-xl shadow-[0_0_50px_rgba(6,182,212,0.3)] rounded-2xl">
        <DialogHeader className="text-center items-center pb-2">
          <div className="w-12 h-12 rounded-full border-2 border-cyan-400 bg-radial from-cyan-500 via-cyan-900 to-[#041a24] flex items-center justify-center text-xl shadow-[0_0_20px_rgba(6,182,212,0.8)] mb-2">
            🔮
          </div>
          <DialogTitle className="font-serif text-2xl text-cyan-200">
            Arcane Realm Spells
          </DialogTitle>
          <DialogDescription className="text-xs text-cyan-300/80">
            Channel real-life focus habits to cast powerful instant realm magic.
          </DialogDescription>
        </DialogHeader>

        {/* Mana Meter */}
        <div className="bg-cyan-950/40 border border-cyan-500/30 rounded-xl p-3 flex flex-col gap-1.5 my-2">
          <div className="flex justify-between items-center text-xs font-serif font-bold">
            <span className="text-cyan-300 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-pulse" /> Willpower Mana
            </span>
            <span className="text-cyan-200 font-mono">{mana} / 100 MP</span>
          </div>
          <div className="w-full bg-cyan-950/80 h-3 rounded-full overflow-hidden border border-cyan-500/30">
            <div
              className="h-full bg-gradient-to-r from-cyan-600 via-blue-500 to-cyan-300 transition-all duration-500 shadow-[0_0_12px_rgba(6,182,212,0.9)]"
              style={{ width: `${mana}%` }}
            />
          </div>
        </div>

        {/* Spells List */}
        <div className="flex flex-col gap-3 py-1">
          {/* Spell 1: Chrono-Accelerate */}
          <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-gradient-to-r from-cyan-950/60 to-zinc-950 border border-cyan-500/30 hover:border-cyan-400/60 transition-all">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-cyan-900/50 border border-cyan-400/50 flex items-center justify-center shrink-0">
                <Hourglass className="w-5 h-5 text-cyan-300" />
              </div>
              <div className="flex flex-col">
                <span className="font-serif font-bold text-sm text-cyan-200">Chrono-Accelerate</span>
                <span className="text-[11px] text-zinc-400">Accelerate airship voyages & kingdom timers by 2h</span>
              </div>
            </div>
            <Button
              size="sm"
              disabled={mana < 50}
              onClick={() =>
                handleCastSpell('Chrono-Accelerate', 50, () => {
                  toast({
                    title: "⌛ Chrono-Accelerate Cast!",
                    description: "Time warped forward by 2 hours across all active kingdom timers!"
                  });
                })
              }
              className="bg-cyan-600 hover:bg-cyan-500 text-white font-serif text-xs px-3 border border-cyan-300/40 shrink-0"
            >
              50 MP
            </Button>
          </div>

          {/* Spell 2: Streak Aegis */}
          <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-gradient-to-r from-blue-950/60 to-zinc-950 border border-blue-500/30 hover:border-blue-400/60 transition-all">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-900/50 border border-blue-400/50 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5 text-blue-300" />
              </div>
              <div className="flex flex-col">
                <span className="font-serif font-bold text-sm text-blue-200">Streak Aegis</span>
                <span className="text-[11px] text-zinc-400">Shield your daily habit streak for 24 hours</span>
              </div>
            </div>
            <Button
              size="sm"
              disabled={mana < 75}
              onClick={() =>
                handleCastSpell('Streak Aegis', 75, () => {
                  toast({
                    title: "🛡️ Streak Aegis Enacted!",
                    description: "Your daily habit streak is shielded by divine arcane magic!"
                  });
                })
              }
              className="bg-blue-600 hover:bg-blue-500 text-white font-serif text-xs px-3 border border-blue-300/40 shrink-0"
            >
              75 MP
            </Button>
          </div>

          {/* Spell 3: Royal Tax Surge */}
          <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-gradient-to-r from-amber-950/60 to-zinc-950 border border-amber-500/30 hover:border-amber-400/60 transition-all">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-900/50 border border-amber-400/50 flex items-center justify-center shrink-0">
                <Crown className="w-5 h-5 text-amber-300" />
              </div>
              <div className="flex flex-col">
                <span className="font-serif font-bold text-sm text-amber-200">Royal Tax Surge</span>
                <span className="text-[11px] text-zinc-400">Harvest an instant +500 Gold tax surge from settlements</span>
              </div>
            </div>
            <Button
              size="sm"
              disabled={mana < 100}
              onClick={() =>
                handleCastSpell('Royal Tax Surge', 100, () => {
                  gainGold(500, 'spell-royal-tax-surge');
                  toast({
                    title: "👑 Royal Tax Surge Harvested!",
                    description: "+500 Gold collected from kingdom settlements!"
                  });
                })
              }
              className="bg-amber-600 hover:bg-amber-500 text-white font-serif text-xs px-3 border border-amber-300/40 shrink-0"
            >
              100 MP
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
