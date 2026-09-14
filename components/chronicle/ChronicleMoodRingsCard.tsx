"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { Sparkles, Brain, Zap, Heart, BookOpen, Quote } from "lucide-react";
import { Badge } from "@/components/ui/badge";

// ── Astrolabe Math Constants (viewBox 0 0 280 280) ───────────────────────────
const CX = 140;
const CY = 140;
const R_OUTER = 98; // Energized (outer gold/amber)
const R_MID = 79; // Focused (middle cyan/sapphire)
const R_INNER = 62; // Calm (inner emerald/sage)
const STROKE_OUTER = 14;
const STROKE_MID = 12;
const STROKE_INNER = 10;

function circumference(r: number) {
  return 2 * Math.PI * r;
}

function ringProps(r: number, pct: number) {
  const c = circumference(r);
  const filled = Math.min(Math.max(pct, 0), 1) * c;
  return {
    strokeDasharray: `${c} ${c}`,
    strokeDashoffset: c - filled,
  };
}

export interface ChronicleMoodRingsCardProps {
  energizedCount: number;
  focusedCount: number;
  calmCount: number;
  totalEntries: number;
  selectedMoodFilter: 'energized' | 'focused' | 'calm' | null;
  onSelectMoodFilter: (mood: 'energized' | 'focused' | 'calm' | null) => void;
  recentEntries?: any[];
}

export function ChronicleMoodRingsCard({
  energizedCount,
  focusedCount,
  calmCount,
  totalEntries,
  selectedMoodFilter,
  onSelectMoodFilter,
  recentEntries = [],
}: ChronicleMoodRingsCardProps) {
  const total = energizedCount + focusedCount + calmCount;
  const energizedPct = total > 0 ? energizedCount / total : 0.65;
  const focusedPct = total > 0 ? focusedCount / total : 0.25;
  const calmPct = total > 0 ? calmCount / total : 0.10;

  const outerRing = ringProps(R_OUTER, energizedPct);
  const midRing = ringProps(R_MID, focusedPct);
  const innerRing = ringProps(R_INNER, calmPct);

  // Dominant emotional tone
  const dominantMood =
    energizedCount >= focusedCount && energizedCount >= calmCount
      ? { label: "Energized", icon: "⚡", color: "text-amber-400" }
      : focusedCount >= calmCount
      ? { label: "Focused", icon: "🎯", color: "text-cyan-400" }
      : { label: "Calm", icon: "🌿", color: "text-emerald-400" };

  // Generate monthly synthesis insight based on emotional distribution
  const getMonthlySynthesis = () => {
    if (totalEntries === 0) {
      return "Begin writing daily reflections to unlock your monthly emotional synthesis and growth patterns.";
    }
    if (energizedPct >= 0.5) {
      return "Your reflections reflect high drive and vitality. Channel this momentum toward higher challenges while preserving restful evenings.";
    }
    if (focusedPct >= 0.4) {
      return "A grounded, disciplined rhythm anchored your month. Consistent focus on daily habits is turning conscious practice into second nature.";
    }
    if (calmPct >= 0.35) {
      return "Gentle recovery and mindful patience shaped this period. Stepping back when needed guards against burnout and nurtures endurance.";
    }
    return "Balanced harmony across energy, focus, and recovery. Your habits and mindset supported each other steadily throughout the month.";
  };

  const latestQuote = recentEntries.find((e) => e.reflection || e.content)?.reflection ||
    recentEntries.find((e) => e.reflection || e.content)?.content ||
    null;

  return (
    <div className="rounded-2xl bg-[#0d0b08] border-2 border-[#42311f] shadow-[0_10px_30px_rgba(0,0,0,0.9),inset_0_1px_1px_rgba(255,255,255,0.06)] overflow-hidden relative group">
      {/* Antique medieval decorative corners & hairline border */}
      <div className="absolute inset-1.5 rounded-xl border border-[#2b2014]/70 pointer-events-none z-10" />
      <div className="absolute top-2 left-2 text-[#785934] text-[10px] select-none pointer-events-none">✦</div>
      <div className="absolute top-2 right-2 text-[#785934] text-[10px] select-none pointer-events-none">✦</div>
      <div className="absolute bottom-2 left-2 text-[#785934] text-[10px] select-none pointer-events-none">✦</div>
      <div className="absolute bottom-2 right-2 text-[#785934] text-[10px] select-none pointer-events-none">✦</div>

      {/* Header */}
      <div className="px-5 py-3.5 border-b border-[#2d2115] bg-gradient-to-r from-[#140e09] via-[#1a130c] to-[#140e09] flex items-center justify-between z-20">
        <div className="flex items-center gap-2.5">
          <span className="text-amber-500 font-serif text-base select-none">✢</span>
          <h2 className="text-sm sm:text-base font-serif font-bold text-amber-100 tracking-wider uppercase drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
            Monthly reflection balance
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="bg-amber-950/80 text-amber-300 border-amber-500/40 text-[10px] font-mono">
            {totalEntries} {totalEntries === 1 ? 'reflection' : 'reflections'}
          </Badge>
        </div>
      </div>

      <div className="p-5 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center z-20 relative">
        {/* Left Column: Concentric Astrolabe Mood Rings (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col items-center justify-center">
          <div className="relative w-[240px] h-[240px] sm:w-[260px] sm:h-[260px] flex items-center justify-center">
            <svg
              viewBox="0 0 280 280"
              className="w-full h-full transform drop-shadow-[0_0_15px_rgba(0,0,0,0.8)]"
            >
              <defs>
                {/* Energized Ring Gradient (Gold / Amber) */}
                <linearGradient id="amberEnergyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#f59e0b" />
                  <stop offset="100%" stopColor="#d97706" />
                </linearGradient>

                {/* Focused Ring Gradient (Cyan / Sapphire) */}
                <linearGradient id="cyanFocusGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#06b6d4" />
                  <stop offset="100%" stopColor="#0284c7" />
                </linearGradient>

                {/* Calm Ring Gradient (Emerald / Sage) */}
                <linearGradient id="emeraldCalmGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#10b981" />
                  <stop offset="100%" stopColor="#059669" />
                </linearGradient>

                {/* Central Medallion Pattern */}
                <radialGradient id="moodCenterMedallion" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#2e2114" />
                  <stop offset="70%" stopColor="#19120a" />
                  <stop offset="100%" stopColor="#0a0704" />
                </radialGradient>
              </defs>

              {/* Astrolabe Background Compass Ticks */}
              {Array.from({ length: 24 }).map((_, i) => {
                const angle = (i * 360) / 24;
                const rad = (angle * Math.PI) / 180;
                const r1 = 112;
                const r2 = i % 3 === 0 ? 122 : 118;
                const x1 = CX + r1 * Math.cos(rad);
                const y1 = CY + r1 * Math.sin(rad);
                const x2 = CX + r2 * Math.cos(rad);
                const y2 = CY + r2 * Math.sin(rad);
                return (
                  <line
                    key={i}
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke="#8c6d48"
                    strokeWidth={i % 3 === 0 ? "1.5" : "0.75"}
                    opacity="0.6"
                  />
                );
              })}

              {/* ── TRACK 1: Energized Ring (Outer Amber) ── */}
              <circle
                cx={CX} cy={CY} r={R_OUTER}
                fill="none"
                stroke="#1c140c"
                strokeWidth={STROKE_OUTER}
              />
              <circle
                cx={CX} cy={CY} r={R_OUTER}
                fill="none"
                stroke="#332213"
                strokeWidth={STROKE_OUTER - 4}
                strokeDasharray="3 3"
                opacity="0.6"
              />
              <circle
                cx={CX} cy={CY} r={R_OUTER}
                fill="none"
                stroke="url(#amberEnergyGrad)"
                strokeWidth={STROKE_OUTER}
                strokeDasharray={outerRing.strokeDasharray}
                strokeDashoffset={outerRing.strokeDashoffset}
                strokeLinecap="round"
                transform={`rotate(-90 ${CX} ${CY})`}
                style={{
                  transition: "stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1)",
                  filter: energizedPct > 0 ? "drop-shadow(0 0 6px rgba(245,158,11,0.7))" : "none",
                }}
              />

              {/* ── TRACK 2: Focused Ring (Middle Cyan) ── */}
              <circle
                cx={CX} cy={CY} r={R_MID}
                fill="none"
                stroke="#081b24"
                strokeWidth={STROKE_MID}
              />
              <circle
                cx={CX} cy={CY} r={R_MID}
                fill="none"
                stroke="#0e3a4d"
                strokeWidth={STROKE_MID - 3}
                strokeDasharray="2.5 3"
                opacity="0.5"
              />
              <circle
                cx={CX} cy={CY} r={R_MID}
                fill="none"
                stroke="url(#cyanFocusGrad)"
                strokeWidth={STROKE_MID}
                strokeDasharray={midRing.strokeDasharray}
                strokeDashoffset={midRing.strokeDashoffset}
                strokeLinecap="round"
                transform={`rotate(-90 ${CX} ${CY})`}
                style={{
                  transition: "stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1)",
                  filter: focusedPct > 0 ? "drop-shadow(0 0 5px rgba(6,182,212,0.7))" : "none",
                }}
              />

              {/* ── TRACK 3: Calm Ring (Inner Emerald) ── */}
              <circle
                cx={CX} cy={CY} r={R_INNER}
                fill="none"
                stroke="#091b12"
                strokeWidth={STROKE_INNER}
              />
              <circle
                cx={CX} cy={CY} r={R_INNER}
                fill="none"
                stroke="#123b28"
                strokeWidth={STROKE_INNER - 2}
                strokeDasharray="2 3"
                opacity="0.5"
              />
              <circle
                cx={CX} cy={CY} r={R_INNER}
                fill="none"
                stroke="url(#emeraldCalmGrad)"
                strokeWidth={STROKE_INNER}
                strokeDasharray={innerRing.strokeDasharray}
                strokeDashoffset={innerRing.strokeDashoffset}
                strokeLinecap="round"
                transform={`rotate(-90 ${CX} ${CY})`}
                style={{
                  transition: "stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1)",
                  filter: calmPct > 0 ? "drop-shadow(0 0 5px rgba(16,185,129,0.7))" : "none",
                }}
              />

              {/* ── Central Medallion ── */}
              <circle
                cx={CX} cy={CY} r={50}
                fill="url(#moodCenterMedallion)"
                stroke="#8c6d48"
                strokeWidth="2"
              />
              <circle
                cx={CX} cy={CY} r={46}
                fill="none"
                stroke="#57432e"
                strokeWidth="1"
                strokeDasharray="2 4"
                opacity="0.8"
              />
            </svg>

            {/* Center Emotional Readout */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none z-10 text-center">
              <span className="text-2xl drop-shadow-md">{dominantMood.icon}</span>
              <span className={cn("text-xs font-serif font-bold uppercase tracking-wider mt-0.5", dominantMood.color)}>
                {dominantMood.label}
              </span>
              <span className="text-[10px] text-zinc-400 font-mono">
                {Math.round((dominantMood.label === "Energized" ? energizedPct : dominantMood.label === "Focused" ? focusedPct : calmPct) * 100)}%
              </span>
            </div>
          </div>

          <span className="text-[11px] text-zinc-500 font-serif mt-2 italic text-center">
            Astrolabe rings: Outer (Energized) • Mid (Focused) • Inner (Calm)
          </span>
        </div>

        {/* Right Column: Interactive Mood Filter Cards & Monthly AI Synthesis (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Interactive Mood Filter Cards */}
          <div className="grid grid-cols-3 gap-2.5">
            {[
              {
                id: "energized" as const,
                label: "Energized",
                icon: "⚡",
                count: energizedCount,
                pct: Math.round(energizedPct * 100),
                border: "border-amber-500/40",
                activeBg: "bg-amber-950/50 border-amber-400 shadow-md shadow-amber-950/50",
                color: "text-amber-300",
                dot: "bg-amber-400",
              },
              {
                id: "focused" as const,
                label: "Focused",
                icon: "🎯",
                count: focusedCount,
                pct: Math.round(focusedPct * 100),
                border: "border-cyan-500/40",
                activeBg: "bg-cyan-950/50 border-cyan-400 shadow-md shadow-cyan-950/50",
                color: "text-cyan-300",
                dot: "bg-cyan-400",
              },
              {
                id: "calm" as const,
                label: "Calm",
                icon: "🌿",
                count: calmCount,
                pct: Math.round(calmPct * 100),
                border: "border-emerald-500/40",
                activeBg: "bg-emerald-950/50 border-emerald-400 shadow-md shadow-emerald-950/50",
                color: "text-emerald-300",
                dot: "bg-emerald-400",
              },
            ].map((mood) => {
              const isSelected = selectedMoodFilter === mood.id;
              return (
                <button
                  key={mood.id}
                  onClick={() => onSelectMoodFilter(isSelected ? null : mood.id)}
                  className={cn(
                    "p-3 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer",
                    isSelected
                      ? mood.activeBg
                      : "bg-zinc-950/80 border-zinc-800/80 hover:border-zinc-700"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-base">{mood.icon}</span>
                    <span className={cn("w-2 h-2 rounded-full", mood.dot)} />
                  </div>
                  <div className="mt-2">
                    <span className={cn("text-xs font-serif font-bold block", mood.color)}>
                      {mood.label}
                    </span>
                    <div className="flex items-baseline justify-between mt-0.5">
                      <span className="text-[11px] text-zinc-400 font-mono">
                        {mood.count} {mood.count === 1 ? 'entry' : 'entries'}
                      </span>
                      <span className="text-xs font-bold font-mono text-zinc-300">
                        {mood.pct}%
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Monthly AI Reflection Summary Synthesis Card */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-amber-950/20 via-zinc-950 to-zinc-950 border border-amber-900/30 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <h4 className="text-xs font-serif font-bold text-amber-200">
                  Monthly reflection synthesis
                </h4>
              </div>
              <span className="text-[10px] text-zinc-500 font-mono">Growth takeaway</span>
            </div>

            <p className="text-xs text-zinc-300 leading-relaxed font-serif">
              {getMonthlySynthesis()}
            </p>

            {latestQuote && (
              <div className="pt-2 border-t border-amber-900/20 flex items-start gap-2 text-[11px] text-amber-200/80 italic font-serif">
                <Quote className="w-3.5 h-3.5 text-amber-400/60 shrink-0 mt-0.5" />
                <span className="line-clamp-2">&ldquo;{latestQuote}&rdquo;</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
