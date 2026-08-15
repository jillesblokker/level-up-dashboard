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
    purple: 'border-2 border-purple-400 bg-radial from-purple-600 via-purple-900 to-[#120524] text-purple-100 shadow-[0_0_20px_rgba(168,85,247,0.65),inset_0_2px_4px_rgba(255,255,255,0.4)]',
    green: 'border-2 border-emerald-400 bg-radial from-emerald-500 via-emerald-900 to-[#042116] text-emerald-100 shadow-[0_0_20px_rgba(34,197,94,0.65),inset_0_2px_4px_rgba(255,255,255,0.4)]',
    red: 'border-2 border-red-500 bg-radial from-rose-600 via-red-900 to-[#280404] text-yellow-200 shadow-[0_0_20px_rgba(239,68,68,0.65),inset_0_2px_4px_rgba(255,255,255,0.4)]',
    gold: 'border-2 border-amber-400 bg-radial from-amber-400 via-amber-700 to-[#2a1704] text-amber-100 shadow-[0_0_20px_rgba(245,158,11,0.7),inset_0_2px_4px_rgba(255,255,255,0.5)]',
    cyan: 'border-2 border-cyan-400 bg-radial from-cyan-500 via-cyan-900 to-[#041a24] text-cyan-100 shadow-[0_0_20px_rgba(6,182,212,0.65),inset_0_2px_4px_rgba(255,255,255,0.4)]',
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
      {/* 4-Corner Brass Filigree Brackets */}
      <div className="absolute top-1 left-1 text-amber-500/40 text-[9px] font-serif select-none pointer-events-none">◆</div>
      <div className="absolute top-1 right-1 text-amber-500/40 text-[9px] font-serif select-none pointer-events-none">◆</div>
      <div className="absolute bottom-1 left-1 text-amber-500/40 text-[9px] font-serif select-none pointer-events-none">◆</div>
      <div className="absolute bottom-1 right-1 text-amber-500/40 text-[9px] font-serif select-none pointer-events-none">◆</div>

      {/* Top Gold Inset Highlight Line */}
      <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-amber-400/60 to-transparent pointer-events-none" />

      {/* Vector Icon in Glowing Metallic 3D Glass Orb Tile */}
      <div
        className={cn(
          "w-14 h-14 rounded-full flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 relative overflow-hidden",
          orbGlowStyles[category]
        )}
      >
        {/* Specular Glass Curved Arc Highlight */}
        <div className="absolute top-1 left-2 w-4 h-2 rounded-full bg-white/40 blur-[0.5px] pointer-events-none transform -rotate-12" />
        <Icon className="w-7 h-7 filter drop-shadow-[0_2px_5px_rgba(0,0,0,0.9)] relative z-10" />
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
