"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { getUserPreference, setUserPreference } from '@/lib/user-preferences-manager';
import { Shield, Sparkles } from 'lucide-react';

export type SigilEmblem = 'dragon' | 'lion' | 'eagle' | 'snake' | 'chicken';

export interface SigilConfig {
  outerColor: string; // hex or border class
  innerColor: string; // hex or bg class
  emblem: SigilEmblem;
}

const EMBLEM_EMOJIS: Record<SigilEmblem, string> = {
  dragon: '🐉',
  lion: '🦁',
  eagle: '🦅',
  snake: '🐍',
  chicken: '🐔'
};

const OUTER_COLORS = [
  { name: 'Royal Gold', border: 'border-amber-400', bg: 'bg-amber-400', hex: '#fbbf24' },
  { name: 'Crimson', border: 'border-red-500', bg: 'bg-red-500', hex: '#ef4444' },
  { name: 'Royal Blue', border: 'border-blue-500', bg: 'bg-blue-500', hex: '#3b82f6' },
  { name: 'Emerald', border: 'border-emerald-500', bg: 'bg-emerald-500', hex: '#10b981' },
  { name: 'Obsidian', border: 'border-zinc-400', bg: 'bg-zinc-400', hex: '#a1a1aa' }
];

const INNER_COLORS = [
  { name: 'Midnight', bg: 'bg-zinc-950', text: 'text-zinc-100' },
  { name: 'Parchment', bg: 'bg-amber-950/80', text: 'text-amber-100' },
  { name: 'Ruby', bg: 'bg-red-950/80', text: 'text-red-100' },
  { name: 'Sapphire', bg: 'bg-blue-950/80', text: 'text-blue-100' },
  { name: 'Amethyst', bg: 'bg-purple-950/80', text: 'text-purple-100' }
];

export function SigilCrestBadge({ config, size = 'md' }: { config: SigilConfig; size?: 'sm' | 'md' | 'lg' }) {
  const outer = OUTER_COLORS.find(c => c.hex === config.outerColor) || OUTER_COLORS[0]!;
  const inner = INNER_COLORS.find(c => c.bg === config.innerColor) || INNER_COLORS[0]!;

  const sizeClasses = {
    sm: 'w-7 h-7 text-sm border-2',
    md: 'w-10 h-10 text-lg border-2',
    lg: 'w-14 h-14 text-2xl border-4'
  }[size];

  return (
    <div
      className={`relative rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-105 ${outer.border} ${inner.bg} ${sizeClasses}`}
      style={{ boxShadow: `0 0 12px ${outer.hex}40` }}
      title={`House Sigil: ${config.emblem.toUpperCase()}`}
    >
      <span className="select-none filter drop-shadow-md">{EMBLEM_EMOJIS[config.emblem] || '🐉'}</span>
    </div>
  );
}

export function SigilCrestEditor({ userId }: { userId?: string | undefined }) {
  const [isOpen, setIsOpen] = useState(false);
  const [config, setConfig] = useState<SigilConfig>({
    outerColor: OUTER_COLORS[0]!.hex,
    innerColor: INNER_COLORS[0]!.bg,
    emblem: 'dragon'
  });

  useEffect(() => {
    try {
      const local = localStorage.getItem('pref:player-sigil-crest');
      if (local) setConfig(JSON.parse(local));
    } catch {}
  }, []);

  const handleSave = (newConfig: SigilConfig) => {
    setConfig(newConfig);
    try { localStorage.setItem('pref:player-sigil-crest', JSON.stringify(newConfig)); } catch {}
    setUserPreference('player-sigil-crest', newConfig);
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <button className="flex items-center gap-1.5 group cursor-pointer focus:outline-none" title="Customize House Sigil">
          <SigilCrestBadge config={config} size="md" />
          <span className="text-[10px] text-amber-400/70 group-hover:text-amber-300 font-mono underline decoration-amber-400/30">
            [Edit Sigil]
          </span>
        </button>
      </DialogTrigger>

      <DialogContent className="bg-zinc-950 border border-amber-500/30 text-white max-w-md p-6 rounded-2xl shadow-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-serif text-amber-300 text-lg">
            <Shield className="w-5 h-5 text-amber-400" />
            Forge House Sigil Crest
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Live Preview */}
          <div className="flex flex-col items-center justify-center p-4 bg-zinc-900/80 rounded-xl border border-white/10 space-y-2">
            <SigilCrestBadge config={config} size="lg" />
            <span className="text-xs text-zinc-400 font-mono">
              House of the {config.emblem.toUpperCase()}
            </span>
          </div>

          {/* Emblem Choice */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider">Select Center Emblem</label>
            <div className="grid grid-cols-5 gap-2">
              {(['dragon', 'lion', 'eagle', 'snake', 'chicken'] as SigilEmblem[]).map(e => (
                <button
                  key={e}
                  onClick={() => setConfig({ ...config, emblem: e })}
                  className={`h-12 flex flex-col items-center justify-center rounded-xl border transition-all ${
                    config.emblem === e
                      ? 'border-amber-400 bg-amber-950/40 text-2xl scale-105'
                      : 'border-white/10 bg-zinc-900/60 text-xl hover:border-white/20'
                  }`}
                >
                  <span>{EMBLEM_EMOJIS[e]}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Outer Border Color */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider">Outer Ring Color</label>
            <div className="flex items-center gap-2.5">
              {OUTER_COLORS.map(c => (
                <button
                  key={c.hex}
                  onClick={() => setConfig({ ...config, outerColor: c.hex })}
                  className={`w-8 h-8 rounded-full border-2 transition-all ${c.bg} ${
                    config.outerColor === c.hex ? 'border-white scale-110 shadow-lg' : 'border-transparent opacity-80 hover:opacity-100'
                  }`}
                  title={c.name}
                />
              ))}
            </div>
          </div>

          {/* Inner Shield Color */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider">Inner Shield Fill</label>
            <div className="grid grid-cols-5 gap-2">
              {INNER_COLORS.map(c => (
                <button
                  key={c.bg}
                  onClick={() => setConfig({ ...config, innerColor: c.bg })}
                  className={`h-8 rounded-lg border text-[10px] font-bold transition-all ${c.bg} ${
                    config.innerColor === c.bg ? 'border-amber-400 ring-2 ring-amber-400/40' : 'border-white/10 opacity-70 hover:opacity-100'
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="ghost" onClick={() => setIsOpen(false)} className="text-xs text-zinc-400">
            Cancel
          </Button>
          <Button
            onClick={() => handleSave(config)}
            className="bg-amber-600 hover:bg-amber-500 text-black font-bold text-xs px-5 rounded-xl"
          >
            <Sparkles className="w-3.5 h-3.5 mr-1.5" /> Save Sigil
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
