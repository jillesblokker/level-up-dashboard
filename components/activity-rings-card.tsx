"use client"

import React from "react"
import { cn } from "@/lib/utils"

// ── Astrolabe Math Constants (viewBox 0 0 280 280) ───────────────────────────
const CX = 140
const CY = 140
const R_OUTER = 98     // Quests ring (outer amber/bronze)
const R_MID   = 79     // XP ring (middle sapphire blue)
const R_INNER = 62     // Categories ring (inner emerald green)
const STROKE_OUTER = 14
const STROKE_MID   = 12
const STROKE_INNER = 10

function circumference(r: number) {
  return 2 * Math.PI * r
}

function ringProps(r: number, pct: number) {
  const c = circumference(r)
  const filled = Math.min(Math.max(pct, 0), 1) * c
  return {
    strokeDasharray: `${c} ${c}`,
    strokeDashoffset: c - filled,
  }
}

// ── Tier helpers ─────────────────────────────────────────────────────────────
function getTier(pct: number) {
  if (pct >= 0.66) return { text: "AMAZING", label: "Amazing", color: "text-amber-400" }
  if (pct >= 0.33) return { text: "GREAT", label: "Great", color: "text-blue-400" }
  if (pct > 0)    return { text: "GOOD", label: "Good", color: "text-emerald-400" }
  return { text: "NOT STARTED", label: "Not started", color: "text-zinc-500" }
}

// ── Props ────────────────────────────────────────────────────────────────────
export interface ActivityRingsCardProps {
  completedCount: number
  dailyGoal: number
  xpEarnedToday: number
  xpDailyTarget: number
  categoriesTouched: number
  totalCategories?: number
}

export function ActivityRingsCard({
  completedCount,
  dailyGoal,
  xpEarnedToday,
  xpDailyTarget,
  categoriesTouched,
  totalCategories = 8,
}: ActivityRingsCardProps) {
  // Enforce standard target of 10 quests, scaling XP target with it (25 XP/quest => 250 XP)
  const targetGoal = Math.max(dailyGoal || 10, 10)
  const targetXp = Math.max(xpDailyTarget || targetGoal * 25, targetGoal * 25)

  const questPct = targetGoal > 0 ? completedCount / targetGoal : 0
  const xpPct = targetXp > 0 ? xpEarnedToday / targetXp : 0
  const categoryPct = totalCategories > 0 ? categoriesTouched / totalCategories : 0

  // Clamped percentages for ring filling and progress bars
  const questFill = Math.min(questPct, 1)
  const xpFill = Math.min(xpPct, 1)
  const categoryFill = Math.min(categoryPct, 1)

  const outerRing = ringProps(R_OUTER, questFill)
  const midRing   = ringProps(R_MID, xpFill)
  const innerRing = ringProps(R_INNER, categoryFill)

  const overallTier = getTier(questPct)

  return (
    <div className="h-full flex flex-col rounded-2xl bg-[#0d0b08] border-2 border-[#42311f] shadow-[0_10px_30px_rgba(0,0,0,0.9),inset_0_1px_1px_rgba(255,255,255,0.06)] overflow-hidden relative group">
      {/* Antique medieval corner rivets & inner gold hairline border */}
      <div className="absolute inset-1.5 rounded-xl border border-[#2b2014]/70 pointer-events-none z-10" />
      <div className="absolute top-2 left-2 text-[#785934] text-[10px] select-none pointer-events-none">✦</div>
      <div className="absolute top-2 right-2 text-[#785934] text-[10px] select-none pointer-events-none">✦</div>
      <div className="absolute bottom-2 left-2 text-[#785934] text-[10px] select-none pointer-events-none">✦</div>
      <div className="absolute bottom-2 right-2 text-[#785934] text-[10px] select-none pointer-events-none">✦</div>

      {/* Header with Cross Fleurée and Gold Serif */}
      <div className="px-5 py-3.5 border-b border-[#2d2115] bg-gradient-to-r from-[#140e09] via-[#1a130c] to-[#140e09] flex items-center justify-between z-20">
        <div className="flex items-center gap-2.5">
          <span className="text-amber-500 font-serif text-base select-none">✢</span>
          <h2 className="text-sm sm:text-base font-serif font-bold text-amber-100 tracking-wider uppercase drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
            Daily momentum
          </h2>
        </div>
        <div className="text-xs font-serif text-amber-300/80 tracking-wide font-medium">
          <span className="text-amber-400 font-bold">{completedCount}</span> / {targetGoal} completed
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 flex flex-col justify-between p-4 sm:p-5 z-20 space-y-4">
        
        {/* TOP SECTION: Astrolabe Centerpiece flanked by Medieval Heraldic Banners */}
        <div className="w-full flex items-center justify-center gap-2 sm:gap-4 md:gap-6 lg:gap-8 py-2 min-h-[300px] sm:min-h-[360px] md:min-h-[400px]">
          
          {/* LEFT BANNER: Royal Blue Velvet with Golden Rampant Lion */}
          <div className="hidden sm:flex flex-col items-center shrink-0 select-none w-14 sm:w-16 md:w-20 lg:w-22 h-[280px] sm:h-[320px] md:h-[350px] justify-center">
            {/* Iron bracket */}
            <div className="w-full flex items-center justify-center relative mb-0.5">
              <div className="h-1.5 w-full bg-gradient-to-r from-[#1c1917] via-[#57432e] to-[#1c1917] rounded-full border-t border-[#8c6d48]/40 shadow-md" />
              <div className="absolute -left-1.5 w-3 h-3 rounded-full bg-[#3d2e1f] border border-[#8c6d48]/70 shadow" />
              <div className="absolute -right-1.5 w-3 h-3 rounded-full bg-[#3d2e1f] border border-[#8c6d48]/70 shadow" />
            </div>
            {/* Blue Banner cloth */}
            <div className="w-12 sm:w-14 md:w-16 lg:w-18 h-[210px] sm:h-[250px] md:h-[280px] bg-gradient-to-b from-[#172554] via-[#1e3a8a] to-[#0f172a] border-x-2 border-[#8c6d48]/60 shadow-[0_8px_20px_rgba(0,0,0,0.85)] flex flex-col items-center pt-3 pb-1 relative">
              <div className="absolute inset-x-1 top-0 h-1 bg-[#d97706]/50" />
              {/* Heraldic Lion Crest */}
              <div className="w-8 h-10 sm:w-10 sm:h-12 md:w-11 md:h-14 flex items-center justify-center text-amber-400 drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)] opacity-95 my-auto">
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
                  <path d="M12 2C10.9 2 10 2.9 10 4C10 4.3 10.1 4.6 10.2 4.9C9.2 5.3 8.3 6.1 7.8 7.1C7.2 8.3 7.3 9.7 7.9 10.8C7.5 11.2 7.2 11.8 7.1 12.4C6.5 12.1 5.8 12.2 5.3 12.6C4.6 13.2 4.5 14.2 5.1 14.9L6.5 16.5C6.1 17.5 6.4 18.7 7.2 19.5C8 20.3 9.2 20.6 10.2 20.2L12 22L13.8 20.2C14.8 20.6 16 20.3 16.8 19.5C17.6 18.7 17.9 17.5 17.5 16.5L18.9 14.9C19.5 14.2 19.4 13.2 18.7 12.6C18.2 12.2 17.5 12.1 16.9 12.4C16.8 11.8 16.5 11.2 16.1 10.8C16.7 9.7 16.8 8.3 16.2 7.1C15.7 6.1 14.8 5.3 13.8 4.9C13.9 4.6 14 4.3 14 4C14 2.9 13.1 2 12 2Z" />
                </svg>
              </div>
              <div className="text-[10px] text-[#fde68a]/80 font-serif font-bold tracking-widest mt-auto mb-1">VALOR</div>
              {/* Swallowtail cut at bottom */}
              <div className="w-full h-4 flex">
                <div className="w-1/2 h-full bg-[#0d0b08] [clip-path:polygon(0_0,100%_100%,0_100%)]" />
                <div className="w-1/2 h-full bg-[#0d0b08] [clip-path:polygon(100%_0,100%_100%,0_100%)]" />
              </div>
            </div>
            {/* Hanging Tassel */}
            <div className="w-1.5 h-3 bg-[#d97706]/80 mx-auto" />
            <div className="w-2.5 h-2.5 rounded-full bg-[#b45309] border border-[#fef3c7]/60 shadow-md" />
          </div>

          {/* CENTER: Royal Astrolabe Progress Dial - Scaled up to match Builder Card height */}
          <div className="relative flex-shrink-0 w-[270px] h-[270px] xs:w-[290px] xs:h-[290px] sm:w-[330px] sm:h-[330px] md:w-[370px] md:h-[370px] lg:w-[390px] lg:h-[390px] xl:w-[410px] xl:h-[410px] transition-all duration-300">
            <svg
              viewBox="0 0 280 280"
              className="w-full h-full drop-shadow-[0_12px_32px_rgba(0,0,0,0.95)] select-none"
              aria-label="Medieval Astrolabe Daily Momentum"
            >
              <defs>
                {/* Outer Ring Bronze/Amber Gradient */}
                <linearGradient id="amberTrackGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#d97706" />
                  <stop offset="50%" stopColor="#f59e0b" />
                  <stop offset="100%" stopColor="#b45309" />
                </linearGradient>

                {/* Middle Ring Lapis/Sapphire Gradient */}
                <linearGradient id="sapphireTrackGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#2563eb" />
                  <stop offset="50%" stopColor="#60a5fa" />
                  <stop offset="100%" stopColor="#1d4ed8" />
                </linearGradient>

                {/* Inner Ring Emerald Gradient */}
                <linearGradient id="emeraldTrackGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#059669" />
                  <stop offset="50%" stopColor="#34d399" />
                  <stop offset="100%" stopColor="#047857" />
                </linearGradient>

                {/* Outer Carved Bronze Frame Gradient */}
                <radialGradient id="bronzeFrameGrad" cx="50%" cy="50%" r="50%">
                  <stop offset="85%" stopColor="#38291a" />
                  <stop offset="93%" stopColor="#694d30" />
                  <stop offset="97%" stopColor="#241910" />
                  <stop offset="100%" stopColor="#543e26" />
                </radialGradient>

                {/* Central Medallion Gradient */}
                <radialGradient id="centerMedallion" cx="50%" cy="40%" r="60%">
                  <stop offset="0%" stopColor="#1e1b2e" />
                  <stop offset="60%" stopColor="#0a0812" />
                  <stop offset="100%" stopColor="#030206" />
                </radialGradient>

                {/* Gold Crown Shimmer */}
                <linearGradient id="goldCrownGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#fef08a" />
                  <stop offset="50%" stopColor="#f59e0b" />
                  <stop offset="100%" stopColor="#b45309" />
                </linearGradient>
              </defs>

              {/* 1. Heavy Carved Bronze Outer Housing Bevel */}
              <circle
                cx={CX} cy={CY} r={116}
                fill="none"
                stroke="url(#bronzeFrameGrad)"
                strokeWidth="14"
                className="drop-shadow-md"
              />
              <circle
                cx={CX} cy={CY} r={123}
                fill="none"
                stroke="#8c6d48"
                strokeWidth="1.5"
                opacity="0.8"
              />
              <circle
                cx={CX} cy={CY} r={109}
                fill="none"
                stroke="#1f150d"
                strokeWidth="2"
              />

              {/* Four Ornate Cardinal Cross-Fleurée Finials (North, South, East, West) */}
              {/* North */}
              <path d="M140 10 L145 22 L140 19 L135 22 Z" fill="#d97706" stroke="#451a03" strokeWidth="1" />
              <circle cx="140" cy="18" r="2.5" fill="#fef08a" />
              {/* South */}
              <path d="M140 270 L145 258 L140 261 L135 258 Z" fill="#d97706" stroke="#451a03" strokeWidth="1" />
              <circle cx="140" cy="262" r="2.5" fill="#fef08a" />
              {/* West */}
              <path d="M10 140 L22 145 L19 140 L22 135 Z" fill="#d97706" stroke="#451a03" strokeWidth="1" />
              <circle cx="18" cy="140" r="2.5" fill="#fef08a" />
              {/* East */}
              <path d="M270 140 L258 145 L261 140 L258 135 Z" fill="#d97706" stroke="#451a03" strokeWidth="1" />
              <circle cx="262" cy="140" r="2.5" fill="#fef08a" />

              {/* Engraved Astrolabe Degrees and Runic Tick Marks */}
              {Array.from({ length: 36 }).map((_, i) => {
                const angle = (i * 10 * Math.PI) / 180
                const x1 = CX + 112 * Math.cos(angle)
                const y1 = CY + 112 * Math.sin(angle)
                const x2 = CX + (i % 3 === 0 ? 119 : 115) * Math.cos(angle)
                const y2 = CY + (i % 3 === 0 ? 119 : 115) * Math.sin(angle)
                return (
                  <line
                    key={i}
                    x1={x1} y1={y1} x2={x2} y2={y2}
                    stroke="#8c6d48"
                    strokeWidth={i % 3 === 0 ? "1.5" : "0.75"}
                    opacity="0.7"
                  />
                )
              })}

              {/* ── TRACK 1: Quests Ring (Outer Amber) ── */}
              {/* Background dark engraved groove */}
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
              {/* Active filled arc */}
              <circle
                cx={CX} cy={CY} r={R_OUTER}
                fill="none"
                stroke="url(#amberTrackGrad)"
                strokeWidth={STROKE_OUTER}
                strokeDasharray={outerRing.strokeDasharray}
                strokeDashoffset={outerRing.strokeDashoffset}
                strokeLinecap="round"
                transform={`rotate(-90 ${CX} ${CY})`}
                style={{
                  transition: "stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1)",
                  filter: questFill > 0 ? "drop-shadow(0 0 6px rgba(245,158,11,0.7))" : "none",
                }}
              />

              {/* ── TRACK 2: XP Today Ring (Middle Sapphire) ── */}
              {/* Background groove */}
              <circle
                cx={CX} cy={CY} r={R_MID}
                fill="none"
                stroke="#0e1320"
                strokeWidth={STROKE_MID}
              />
              <circle
                cx={CX} cy={CY} r={R_MID}
                fill="none"
                stroke="#1e293b"
                strokeWidth={STROKE_MID - 3}
                strokeDasharray="2.5 3"
                opacity="0.5"
              />
              {/* Active filled arc */}
              <circle
                cx={CX} cy={CY} r={R_MID}
                fill="none"
                stroke="url(#sapphireTrackGrad)"
                strokeWidth={STROKE_MID}
                strokeDasharray={midRing.strokeDasharray}
                strokeDashoffset={midRing.strokeDashoffset}
                strokeLinecap="round"
                transform={`rotate(-90 ${CX} ${CY})`}
                style={{
                  transition: "stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1)",
                  filter: xpFill > 0 ? "drop-shadow(0 0 5px rgba(59,130,246,0.7))" : "none",
                }}
              />

              {/* ── TRACK 3: Categories Ring (Inner Emerald) ── */}
              {/* Background groove */}
              <circle
                cx={CX} cy={CY} r={R_INNER}
                fill="none"
                stroke="#0c1913"
                strokeWidth={STROKE_INNER}
              />
              <circle
                cx={CX} cy={CY} r={R_INNER}
                fill="none"
                stroke="#143526"
                strokeWidth={STROKE_INNER - 2}
                strokeDasharray="2 3"
                opacity="0.5"
              />
              {/* Active filled arc */}
              <circle
                cx={CX} cy={CY} r={R_INNER}
                fill="none"
                stroke="url(#emeraldTrackGrad)"
                strokeWidth={STROKE_INNER}
                strokeDasharray={innerRing.strokeDasharray}
                strokeDashoffset={innerRing.strokeDashoffset}
                strokeLinecap="round"
                transform={`rotate(-90 ${CX} ${CY})`}
                style={{
                  transition: "stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1)",
                  filter: categoryFill > 0 ? "drop-shadow(0 0 5px rgba(16,185,129,0.7))" : "none",
                }}
              />

              {/* ── CENTRAL ROYAL MEDALLION ── */}
              {/* Outer Studded Bronze Bezel */}
              <circle
                cx={CX} cy={CY} r={51}
                fill="url(#centerMedallion)"
                stroke="#8c6d48"
                strokeWidth="2.5"
                className="drop-shadow-lg"
              />
              <circle
                cx={CX} cy={CY} r={47}
                fill="none"
                stroke="#57432e"
                strokeWidth="1"
                strokeDasharray="2 4"
                opacity="0.8"
              />

              {/* 12 Golden Studs around the center rim */}
              {Array.from({ length: 12 }).map((_, i) => {
                const angle = (i * 30 * Math.PI) / 180
                const sx = CX + 47 * Math.cos(angle)
                const sy = CY + 47 * Math.sin(angle)
                return <circle key={i} cx={sx} cy={sy} r="1.2" fill="#fde68a" />
              })}

              {/* Embossed Golden Royal Crown Icon */}
              <g transform={`translate(${CX - 16}, ${CY - 34}) scale(1.3)`} className="pointer-events-none select-none">
                <path
                  d="M5 16 L6.5 7 L11 12 L12.5 4 L14 12 L18.5 7 L20 16 Z"
                  fill="url(#goldCrownGrad)"
                  stroke="#78350f"
                  strokeWidth="0.8"
                  strokeLinejoin="round"
                />
                <circle cx="6.5" cy="6" r="1" fill="#fef08a" />
                <circle cx="12.5" cy="3" r="1.2" fill="#ffffff" />
                <circle cx="18.5" cy="6" r="1" fill="#fef08a" />
                <rect x="5" y="16" width="15" height="2.5" rx="0.5" fill="#d97706" stroke="#78350f" strokeWidth="0.5" />
                <circle cx="8.5" cy="17.25" r="0.6" fill="#fef08a" />
                <circle cx="12.5" cy="17.25" r="0.6" fill="#fef08a" />
                <circle cx="16.5" cy="17.25" r="0.6" fill="#fef08a" />
              </g>

              {/* Centered Tier Typography: "Amazing" & "Today" with Fleur-de-lis flourishes */}
              <g className="select-none pointer-events-none text-center">
                <text
                  x={CX} y={CY + 5}
                  textAnchor="middle"
                  fill="#fef3c7"
                  fontFamily="Cinzel, Georgia, serif"
                  fontSize="13"
                  fontWeight="700"
                  letterSpacing="0.04em"
                  className="drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]"
                >
                  {completedCount === 0 ? "Not started" : overallTier.label}
                </text>
                <text
                  x={CX} y={CY + 20}
                  textAnchor="middle"
                  fill="#d1d5db"
                  fontFamily="Cinzel, Georgia, serif"
                  fontSize="10"
                  fontWeight="500"
                  letterSpacing="0.08em"
                  opacity="0.9"
                >
                  Today
                </text>
                {/* Tiny fleur-de-lis bottom dots */}
                <text x={CX - 12} y={CY + 32} textAnchor="middle" fill="#d97706" fontSize="7">✦</text>
                <text x={CX} y={CY + 33} textAnchor="middle" fill="#fde68a" fontSize="8">👑</text>
                <text x={CX + 12} y={CY + 32} textAnchor="middle" fill="#d97706" fontSize="7">✦</text>
              </g>
            </svg>
          </div>

          {/* RIGHT BANNER: Crimson Silk Velvet with Golden Fleur-de-lis */}
          <div className="hidden sm:flex flex-col items-center shrink-0 select-none w-14 sm:w-16 md:w-20 lg:w-22 h-[280px] sm:h-[320px] md:h-[350px] justify-center">
            {/* Iron bracket */}
            <div className="w-full flex items-center justify-center relative mb-0.5">
              <div className="h-1.5 w-full bg-gradient-to-r from-[#1c1917] via-[#57432e] to-[#1c1917] rounded-full border-t border-[#8c6d48]/40 shadow-md" />
              <div className="absolute -left-1.5 w-3 h-3 rounded-full bg-[#3d2e1f] border border-[#8c6d48]/70 shadow" />
              <div className="absolute -right-1.5 w-3 h-3 rounded-full bg-[#3d2e1f] border border-[#8c6d48]/70 shadow" />
            </div>
            {/* Crimson Banner cloth */}
            <div className="w-12 sm:w-14 md:w-16 lg:w-18 h-[210px] sm:h-[250px] md:h-[280px] bg-gradient-to-b from-[#881337] via-[#9f1239] to-[#4c0519] border-x-2 border-[#8c6d48]/60 shadow-[0_8px_20px_rgba(0,0,0,0.85)] flex flex-col items-center pt-3 pb-1 relative">
              <div className="absolute inset-x-1 top-0 h-1 bg-[#d97706]/50" />
              {/* Heraldic Fleur-de-lis Crest */}
              <div className="w-8 h-10 sm:w-10 sm:h-12 md:w-11 md:h-14 flex items-center justify-center text-amber-300 drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)] opacity-95 my-auto">
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
                  <path d="M12 2C11.5 4 10.5 5.8 9.2 7.2C8.3 8.1 7.2 8.7 6 9C5.5 6.5 7 4 8.5 2.5C7.2 3.2 4 6 4 9.5C4 12 5.5 13.5 7.5 13.5C8.8 13.5 9.9 12.8 10.5 12C10.3 13.2 10 15 8 16.5H16C14 15 13.7 13.2 13.5 12C14.1 12.8 15.2 13.5 16.5 13.5C18.5 13.5 20 12 20 9.5C20 6 16.8 3.2 15.5 2.5C17 4 18.5 6.5 18 9C16.8 8.7 15.7 8.1 14.8 7.2C13.5 5.8 12.5 4 12 2ZM6 18H18C18 19 17 21 12 22C7 21 6 19 6 18Z" />
                </svg>
              </div>
              <div className="text-[10px] text-[#fde68a]/80 font-serif font-bold tracking-widest mt-auto mb-1">HONOR</div>
              {/* Swallowtail cut at bottom */}
              <div className="w-full h-4 flex">
                <div className="w-1/2 h-full bg-[#0d0b08] [clip-path:polygon(0_0,100%_100%,0_100%)]" />
                <div className="w-1/2 h-full bg-[#0d0b08] [clip-path:polygon(100%_0,100%_100%,0_100%)]" />
              </div>
            </div>
            {/* Hanging Tassel */}
            <div className="w-1.5 h-3 bg-[#d97706]/80 mx-auto" />
            <div className="w-2.5 h-2.5 rounded-full bg-[#b45309] border border-[#fef3c7]/60 shadow-md" />
          </div>

        </div>

        {/* BOTTOM SECTION: Heraldic Heater Shield Progress Rows */}
        <div className="w-full space-y-3 pt-1">
          
          {/* ROW 1: Quests */}
          <div className="flex items-center gap-2.5 sm:gap-3.5">
            {/* Crown Heater Shield Badge */}
            <div className="w-7 h-8 sm:w-8 sm:h-9 shrink-0 relative flex items-center justify-center filter drop-shadow-md">
              <svg viewBox="0 0 32 36" className="w-full h-full">
                <path
                  d="M4 4 C4 3, 6 2, 8 2 L24 2 C26 2, 28 3, 28 4 L28 18 C28 26, 18 32, 16 34 C14 32, 4 26, 4 18 Z"
                  fill="#78350f"
                  stroke="#d97706"
                  strokeWidth="1.5"
                />
                <path
                  d="M6 5 L26 5 L26 17 C26 24, 17 29, 16 31 C15 29, 6 24, 6 17 Z"
                  fill="#451a03"
                  opacity="0.8"
                />
              </svg>
              <span className="absolute text-xs select-none">👑</span>
            </div>

            {/* Content & Carved Bar */}
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-baseline mb-1">
                <span className="text-xs font-serif font-bold text-amber-200/90 tracking-wide">Quests</span>
                <span className="text-xs font-serif font-bold text-amber-300">
                  {completedCount} <span className="text-[#8c6d48] font-normal">/</span> {targetGoal}
                </span>
              </div>
              {/* Carved stone progress trough */}
              <div className="h-3 sm:h-3.5 rounded-full bg-[#070503] border border-[#3e2e1c] p-0.5 shadow-[inset_0_2px_4px_rgba(0,0,0,0.9)] overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#b45309] via-[#f59e0b] to-[#fbbf24] shadow-[0_0_10px_rgba(245,158,11,0.6)] transition-all duration-700"
                  style={{ width: `${Math.min(questFill, 1) * 100}%` }}
                />
              </div>
            </div>

            {/* Tier Stamp */}
            <div className="w-20 text-right shrink-0">
              <span className={cn("text-[11px] font-serif font-black tracking-wider", getTier(questPct).color)}>
                {getTier(questPct).text}
              </span>
            </div>
          </div>

          {/* ROW 2: XP Today */}
          <div className="flex items-center gap-2.5 sm:gap-3.5">
            {/* XP Heater Shield Badge */}
            <div className="w-7 h-8 sm:w-8 sm:h-9 shrink-0 relative flex items-center justify-center filter drop-shadow-md">
              <svg viewBox="0 0 32 36" className="w-full h-full">
                <path
                  d="M4 4 C4 3, 6 2, 8 2 L24 2 C26 2, 28 3, 28 4 L28 18 C28 26, 18 32, 16 34 C14 32, 4 26, 4 18 Z"
                  fill="#1e3a8a"
                  stroke="#60a5fa"
                  strokeWidth="1.5"
                />
                <path
                  d="M6 5 L26 5 L26 17 C26 24, 17 29, 16 31 C15 29, 6 24, 6 17 Z"
                  fill="#0f172a"
                  opacity="0.8"
                />
              </svg>
              <span className="absolute text-[10px] font-serif font-black text-blue-200 select-none tracking-tighter">XP</span>
            </div>

            {/* Content & Carved Bar */}
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-baseline mb-1">
                <span className="text-xs font-serif font-bold text-blue-200/90 tracking-wide">XP Today</span>
                <span className="text-xs font-serif font-bold text-blue-300">
                  {xpEarnedToday} <span className="text-[#8c6d48] font-normal">/</span> {targetXp}
                </span>
              </div>
              {/* Carved stone progress trough */}
              <div className="h-3 sm:h-3.5 rounded-full bg-[#070503] border border-[#3e2e1c] p-0.5 shadow-[inset_0_2px_4px_rgba(0,0,0,0.9)] overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#1d4ed8] via-[#3b82f6] to-[#93c5fd] shadow-[0_0_10px_rgba(59,130,246,0.6)] transition-all duration-700"
                  style={{ width: `${Math.min(xpFill, 1) * 100}%` }}
                />
              </div>
            </div>

            {/* Tier Stamp */}
            <div className="w-20 text-right shrink-0">
              <span className={cn("text-[11px] font-serif font-black tracking-wider", getTier(xpPct).color)}>
                {getTier(xpPct).text}
              </span>
            </div>
          </div>

          {/* ROW 3: Categories */}
          <div className="flex items-center gap-2.5 sm:gap-3.5">
            {/* Star Heater Shield Badge */}
            <div className="w-7 h-8 sm:w-8 sm:h-9 shrink-0 relative flex items-center justify-center filter drop-shadow-md">
              <svg viewBox="0 0 32 36" className="w-full h-full">
                <path
                  d="M4 4 C4 3, 6 2, 8 2 L24 2 C26 2, 28 3, 28 4 L28 18 C28 26, 18 32, 16 34 C14 32, 4 26, 4 18 Z"
                  fill="#065f46"
                  stroke="#34d399"
                  strokeWidth="1.5"
                />
                <path
                  d="M6 5 L26 5 L26 17 C26 24, 17 29, 16 31 C15 29, 6 24, 6 17 Z"
                  fill="#022c22"
                  opacity="0.8"
                />
              </svg>
              <span className="absolute text-xs text-emerald-200 select-none">✦</span>
            </div>

            {/* Content & Carved Bar */}
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-baseline mb-1">
                <span className="text-xs font-serif font-bold text-emerald-200/90 tracking-wide">Categories</span>
                <span className="text-xs font-serif font-bold text-emerald-300">
                  {categoriesTouched} <span className="text-[#8c6d48] font-normal">/</span> {totalCategories}
                </span>
              </div>
              {/* Carved stone progress trough */}
              <div className="h-3 sm:h-3.5 rounded-full bg-[#070503] border border-[#3e2e1c] p-0.5 shadow-[inset_0_2px_4px_rgba(0,0,0,0.9)] overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#047857] via-[#10b981] to-[#6ee7b7] shadow-[0_0_10px_rgba(16,185,129,0.6)] transition-all duration-700"
                  style={{ width: `${Math.min(categoryFill, 1) * 100}%` }}
                />
              </div>
            </div>

            {/* Tier Stamp */}
            <div className="w-20 text-right shrink-0">
              <span className={cn("text-[11px] font-serif font-black tracking-wider", getTier(categoryPct).color)}>
                {getTier(categoryPct).text}
              </span>
            </div>
          </div>

          {/* Runic Heraldic Legend */}
          <div className="flex flex-wrap items-center justify-between pt-2.5 border-t border-[#2d2115] text-[11px] font-serif text-[#a8957c]">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_4px_rgba(16,185,129,0.8)] inline-block" />
                Good &gt;1
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_4px_rgba(59,130,246,0.8)] inline-block" />
                Great &gt;33%
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_4px_rgba(245,158,11,0.8)] inline-block" />
                Amazing &gt;66%
              </span>
            </div>
            <span className="text-[10px] text-[#785934] font-mono hidden sm:inline select-none">
              ᚲ ᛟ ᚱ ᛖ
            </span>
          </div>

        </div>

      </div>
    </div>
  )
}
