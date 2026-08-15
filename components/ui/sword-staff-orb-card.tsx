'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

export type OrbCategory = 'purple' | 'green' | 'red' | 'gold' | 'cyan';

interface SwordStaffOrbCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  description: string;
  icon: LucideIcon;
  category?: OrbCategory;
  isActive?: boolean;
  badge?: string;
  onClick?: () => void;
}

export function SwordStaffOrbCard({
  title,
  description,
  icon: Icon,
  category = 'gold',
  isActive = false,
  badge,
  className,
  onClick,
  ...props
}: SwordStaffOrbCardProps) {
  const orbGlowStyles: Record<OrbCategory, string> = {
    purple: 'border-purple-400/90 bg-gradient-to-b from-purple-900/90 via-purple-950 to-zinc-950 text-purple-200 shadow-[0_0_25px_rgba(168,85,247,0.5)]',
    green: 'border-emerald-400/90 bg-gradient-to-b from-emerald-900/90 via-emerald-950 to-zinc-950 text-emerald-200 shadow-[0_0_25px_rgba(34,197,94,0.5)]',
    red: 'border-red-400/90 bg-gradient-to-b from-red-900/90 via-red-950 to-zinc-950 text-red-200 shadow-[0_0_25px_rgba(239,68,68,0.5)]',
    gold: 'border-amber-400/90 bg-gradient-to-b from-amber-900/90 via-amber-950 to-zinc-950 text-amber-200 shadow-[0_0_25px_rgba(245,158,11,0.6)]',
    cyan: 'border-cyan-400/90 bg-gradient-to-b from-cyan-900/90 via-cyan-950 to-zinc-950 text-cyan-200 shadow-[0_0_25px_rgba(6,182,212,0.5)]',
  };

  return (
    <div
      onClick={onClick}
      className={cn(
        "group relative p-4 rounded-xl transition-all duration-300 flex items-center gap-4 cursor-pointer select-none",
        "bg-[#111728] border-1.5 overflow-hidden",
        isActive
          ? "border-amber-400 bg-gradient-to-r from-amber-950/40 via-[#161e36] to-[#111728] shadow-[0_0_25px_rgba(245,158,11,0.35)] ring-1 ring-amber-400/60"
          : "border-amber-900/40 hover:border-amber-500/60 hover:bg-[#161e36]",
        className
      )}
      {...props}
    >
      {/* Top Gold Inset Highlight Line */}
      <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-amber-400/60 to-transparent pointer-events-none" />

      {/* Vector Icon in Glowing Metallic Orb Tile */}
      <div
        className={cn(
          "w-14 h-14 rounded-full border-2 flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 relative",
          orbGlowStyles[category]
        )}
      >
        {/* Inner Orb Specular Highlight */}
        <div className="absolute top-1.5 left-2.5 w-3 h-3 rounded-full bg-white/30 blur-[0.5px] pointer-events-none" />
        <Icon className="w-7 h-7 filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]" />
      </div>

      {/* Text Info Hierarchy */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-1">
          <h3 className="font-serif font-bold text-base text-amber-100 group-hover:text-amber-300 transition-colors truncate drop-shadow-sm">
            {title}
          </h3>
          {badge && (
            <span className="text-[10px] font-serif font-bold px-2 py-0.5 rounded bg-amber-950/80 border border-amber-500/50 text-amber-300 shrink-0">
              {badge}
            </span>
          )}
        </div>
        <p className="text-xs text-slate-300/80 leading-relaxed font-sans line-clamp-2">
          {description}
        </p>
      </div>

      {/* Gold Active Arrow Pointer */}
      {isActive && (
        <div className="text-amber-400 font-serif font-bold text-lg pr-1 animate-pulse">
          ▶
        </div>
      )}
    </div>
  );
}

/**
 * Centered Gold Filigree Divider Line with Central Diamond Ornament (Matching Screenshot 2 Header Dividers)
 */
export function SwordStaffSectionHeader({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-3 my-4 w-full">
      <div className="flex-1 h-[1.5px] bg-gradient-to-r from-transparent via-amber-600/50 to-amber-500/80" />
      <div className="flex items-center gap-2 px-3 py-1 rounded bg-amber-950/40 border border-amber-500/40 shadow-sm">
        <span className="text-amber-400 text-xs font-serif select-none">◆</span>
        <h2 className="font-serif font-bold text-sm text-amber-300 uppercase tracking-widest text-shadow-sm">
          {title}
        </h2>
        <span className="text-amber-400 text-xs font-serif select-none">◆</span>
      </div>
      <div className="flex-1 h-[1.5px] bg-gradient-to-l from-transparent via-amber-600/50 to-amber-500/80" />
    </div>
  );
}
