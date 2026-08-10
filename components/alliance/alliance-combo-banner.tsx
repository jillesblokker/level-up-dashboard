"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Flame, Users, Zap, Swords } from 'lucide-react';

export function AllianceComboBanner() {
  const [data, setData] = useState<{
    hasAlliance: boolean;
    allianceName?: string;
    activeCombo: boolean;
    multiplier: number;
    activeMemberCount: number;
    totalMembers?: number;
  } | null>(null);

  useEffect(() => {
    const fetchSynergy = async () => {
      try {
        const res = await fetch('/api/alliance/synergy');
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch {
        // Silently ignore
      }
    };

    fetchSynergy();
  }, []);

  if (!data || !data.hasAlliance) return null;

  return (
    <Card className={`border shadow-md mb-6 ${
      data.activeCombo 
        ? 'bg-gradient-to-r from-orange-950/60 via-amber-900/30 to-background border-orange-500/50' 
        : 'bg-card/40 border-border/50'
    }`}>
      <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-xl border shrink-0 ${
            data.activeCombo 
              ? 'bg-orange-500/20 border-orange-500/40 text-orange-400' 
              : 'bg-muted border-border text-muted-foreground'
          }`}>
            {data.activeCombo ? <Flame className="w-5 h-5 animate-pulse" /> : <Users className="w-5 h-5" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-semibold text-sm text-foreground flex items-center gap-1.5">
                <span>{data.allianceName || 'Fellowship'} raid synergy</span>
              </h4>
              {data.activeCombo && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-300 font-bold border border-orange-500/40 flex items-center gap-1">
                  <Zap className="w-3 h-3 fill-orange-300" />
                  1.5x Active
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {data.activeCombo ? (
                <span>
                  <strong className="text-orange-300">{data.activeMemberCount} friends</strong> completed habits within 2 hours! <strong className="text-amber-200">+50% Titan Wyrm Damage</strong> active.
                </span>
              ) : (
                <span>
                  Complete habits within 2 hours of your friends to trigger a <strong className="text-foreground font-medium">1.5x Titan Raid Combo</strong>.
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center">
          <div className="px-3 py-1.5 rounded-lg bg-black/40 border border-white/10 text-xs font-mono flex items-center gap-2">
            <Swords className="w-4 h-4 text-amber-400" />
            <span>Multiplier: <strong className={data.activeCombo ? "text-orange-400" : "text-muted-foreground"}>{data.multiplier}x</strong></span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
