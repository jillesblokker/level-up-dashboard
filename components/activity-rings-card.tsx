"use client"

import { useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Trophy, Activity } from "lucide-react"
import { cn } from "@/lib/utils"

// ── Ring math helpers ─────────────────────────────────────────────────────────
const R_OUTER = 52   // Quests ring
const R_MID   = 38   // XP ring
const R_INNER = 24   // Categories ring
const STROKE  = 9
const CX = 68
const CY = 68

function circumference(r: number) { return 2 * Math.PI * r }

/** Returns the strokeDasharray + strokeDashoffset to fill `pct` of the circle */
function ringProps(r: number, pct: number) {
  const c = circumference(r)
  const filled = Math.min(pct, 1) * c
  return { strokeDasharray: c, strokeDashoffset: c - filled }
}

// ── Threshold colours ─────────────────────────────────────────────────────────
// Each ring has 3 segments: good (0–33%), great (33–66%), amazing (66–100%)
// We render them as 3 stacked arcs, clipping each one.
function thresholdColor(pct: number, ring: 'quests' | 'xp' | 'categories') {
  if (pct >= 0.66) {
    return ring === 'quests' ? '#f97316'   // orange-500 amazing
         : ring === 'xp'    ? '#818cf8'   // indigo-400 amazing
                             : '#34d399'  // emerald-400 amazing
  }
  if (pct >= 0.33) {
    return ring === 'quests' ? '#fb923c'   // orange-400 great
         : ring === 'xp'    ? '#a5b4fc'   // indigo-300 great
                             : '#6ee7b7'  // emerald-300 great
  }
  return ring === 'quests' ? '#fed7aa'   // orange-200 good
       : ring === 'xp'    ? '#c7d2fe'   // indigo-200 good
                           : '#a7f3d0'  // emerald-200 good
}

// ── Sub-component: one ring track + filled arc ────────────────────────────────
function RingArc({
  r, pct, ringName, label, value, maxLabel,
  isActive, onHover, onLeave,
}: {
  r: number
  pct: number
  ringName: 'quests' | 'xp' | 'categories'
  label: string
  value: string
  maxLabel: string
  isActive: boolean
  onHover: () => void
  onLeave: () => void
}) {
  const { strokeDasharray, strokeDashoffset } = ringProps(r, pct)
  const color = thresholdColor(pct, ringName)

  // Zone markers: thin tick at 33% and 66% on the track
  const c = circumference(r)
  const tick33 = c * 0.33
  const tick66 = c * 0.66

  return (
    <g
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      className="cursor-pointer"
    >
      {/* Track (background) */}
      <circle
        cx={CX} cy={CY} r={r}
        fill="none"
        stroke="#1c1917"
        strokeWidth={STROKE}
      />

      {/* Zone markers */}
      {[tick33, tick66].map((offset, i) => (
        <circle
          key={i}
          cx={CX} cy={CY} r={r}
          fill="none"
          stroke="#292524"
          strokeWidth={STROKE + 2}
          strokeDasharray={`1 ${c - 1}`}
          strokeDashoffset={c - offset}
          strokeLinecap="butt"
          transform={`rotate(-90 ${CX} ${CY})`}
        />
      ))}

      {/* Filled arc */}
      <circle
        cx={CX} cy={CY} r={r}
        fill="none"
        stroke={color}
        strokeWidth={STROKE}
        strokeDasharray={strokeDasharray}
        strokeDashoffset={strokeDashoffset}
        strokeLinecap="round"
        transform={`rotate(-90 ${CX} ${CY})`}
        style={{
          transition: 'stroke-dashoffset 0.8s cubic-bezier(0.4,0,0.2,1), stroke 0.4s ease',
          filter: pct > 0 ? `drop-shadow(0 0 6px ${color}88)` : undefined,
        }}
      />

      {/* Glow pulse when amazing */}
      {pct >= 0.66 && (
        <circle
          cx={CX} cy={CY} r={r}
          fill="none"
          stroke={color}
          strokeWidth={STROKE - 4}
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${CX} ${CY})`}
          style={{
            opacity: 0.35,
            animation: 'pulse 2s ease-in-out infinite',
            transition: 'stroke-dashoffset 0.8s cubic-bezier(0.4,0,0.2,1)',
          }}
        />
      )}
    </g>
  )
}

// ── Tier badge ────────────────────────────────────────────────────────────────
function tierLabel(pct: number) {
  if (pct >= 0.66) return { text: 'Amazing', color: 'text-orange-400' }
  if (pct >= 0.33) return { text: 'Great', color: 'text-indigo-300' }
  if (pct > 0)    return { text: 'Good', color: 'text-emerald-300' }
  return { text: 'Not started', color: 'text-zinc-500' }
}

// ── Props ─────────────────────────────────────────────────────────────────────
interface ActivityRingsCardProps {
  // Quests ring
  completedCount: number
  dailyGoal: number
  // XP ring
  xpEarnedToday: number
  xpDailyTarget: number
  // Categories ring
  categoriesTouched: number   // 0–8
  totalCategories?: number    // default 8
}

export function ActivityRingsCard({
  completedCount,
  dailyGoal,
  xpEarnedToday,
  xpDailyTarget,
  categoriesTouched,
  totalCategories = 8,
}: ActivityRingsCardProps) {
  const questPct      = dailyGoal > 0       ? Math.min(completedCount / dailyGoal, 1)     : 0
  const xpPct         = xpDailyTarget > 0   ? Math.min(xpEarnedToday / xpDailyTarget, 1)  : 0
  const categoryPct   = totalCategories > 0 ? Math.min(categoriesTouched / totalCategories, 1) : 0

  const rings: { r: number; pct: number; name: 'quests' | 'xp' | 'categories'; label: string; value: string; maxLabel: string }[] = [
    {
      r: R_OUTER,
      pct: questPct,
      name: 'quests',
      label: 'Quests',
      value: `${completedCount} / ${dailyGoal}`,
      maxLabel: `Goal: ${dailyGoal}`,
    },
    {
      r: R_MID,
      pct: xpPct,
      name: 'xp',
      label: 'XP Today',
      value: `${xpEarnedToday} / ${xpDailyTarget}`,
      maxLabel: `Target: ${xpDailyTarget} XP`,
    },
    {
      r: R_INNER,
      pct: categoryPct,
      name: 'categories',
      label: 'Categories',
      value: `${categoriesTouched} / ${totalCategories}`,
      maxLabel: `${totalCategories} categories`,
    },
  ]

  return (
    <Card className="h-full flex flex-col bg-gradient-to-br from-zinc-900 to-zinc-950 border-amber-800/40 shadow-xl overflow-hidden">
      <CardHeader className="pb-3 border-b border-amber-900/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-amber-500">
            <Activity className="w-5 h-5" />
            <CardTitle className="text-lg font-bold tracking-wide font-serif">Daily Momentum</CardTitle>
          </div>
          <div className="text-xs text-amber-400/60 font-mono">
            {completedCount} / {dailyGoal} Completed
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col justify-center p-5 md:p-6">
        <div className="flex flex-col sm:flex-row items-center gap-6">

          {/* ── SVG rings ── */}
          <div className="relative flex-shrink-0 w-full max-w-[240px] sm:max-w-none sm:w-[180px] lg:w-[200px] aspect-square mx-auto mb-4 sm:mb-0">
            <svg
              className="w-full h-full"
              viewBox={`0 0 ${CX * 2} ${CY * 2}`}
              aria-label="Activity rings"
            >
              {rings.map(ring => (
                <RingArc
                  key={ring.name}
                  r={ring.r}
                  pct={ring.pct}
                  ringName={ring.name}
                  label={ring.label}
                  value={ring.value}
                  maxLabel={ring.maxLabel}
                  isActive={false}
                  onHover={() => {}}
                  onLeave={() => {}}
                />
              ))}

              {/* Centre: overall tier */}
              <text x={CX} y={CY - 5} textAnchor="middle" className="fill-white font-serif" fontSize={12} fontWeight={800}>
                {completedCount > 0 ? tierLabel(questPct).text : '—'}
              </text>
              <text x={CX} y={CY + 10} textAnchor="middle" fill="#78716c" fontSize={9}>
                Today
              </text>
            </svg>

          </div>

          {/* ── Right: ring stats ── */}
          <div className="flex-1 w-full space-y-3">
            {rings.map(ring => {
              const tier = tierLabel(ring.pct)
              return (
                <div key={ring.name} className="flex items-center gap-3">
                  {/* Ring colour dot */}
                  <div className={cn(
                    "w-2.5 h-2.5 rounded-full flex-shrink-0",
                    ring.name === 'quests'     ? 'bg-orange-400' :
                    ring.name === 'xp'         ? 'bg-indigo-400' :
                                                 'bg-emerald-400'
                  )} />

                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-1">
                      <span className="text-xs font-semibold text-zinc-300">{ring.label}</span>
                      <span className="text-xs font-mono text-zinc-400">{ring.value}</span>
                    </div>
                    {/* Segmented bar: 3 zones */}
                    <div className="h-2 rounded-full bg-zinc-800 overflow-hidden flex">
                      {/* Good zone: 0–33% → fills first third */}
                      <div
                        className={cn(
                          "h-full transition-all duration-700 rounded-full",
                          ring.name === 'quests' ? 'bg-orange-200' :
                          ring.name === 'xp'     ? 'bg-indigo-200' :
                                                   'bg-emerald-200'
                        )}
                        style={{ width: `${Math.min(ring.pct / 0.33, 1) * 33}%` }}
                      />
                      {/* Great zone: 33–66% */}
                      <div
                        className={cn(
                          "h-full transition-all duration-700",
                          ring.name === 'quests' ? 'bg-orange-400' :
                          ring.name === 'xp'     ? 'bg-indigo-300' :
                                                   'bg-emerald-300'
                        )}
                        style={{ width: ring.pct >= 0.33 ? `${Math.min((ring.pct - 0.33) / 0.33, 1) * 33}%` : '0%' }}
                      />
                      {/* Amazing zone: 66–100% */}
                      <div
                        className={cn(
                          "h-full transition-all duration-700",
                          ring.name === 'quests' ? 'bg-orange-500' :
                          ring.name === 'xp'     ? 'bg-indigo-400' :
                                                   'bg-emerald-400'
                        )}
                        style={{ width: ring.pct >= 0.66 ? `${Math.min((ring.pct - 0.66) / 0.34, 1) * 34}%` : '0%' }}
                      />
                    </div>
                  </div>

                  {/* Tier badge */}
                  <span className={cn("text-[10px] font-bold uppercase tracking-wide w-16 text-right", tier.color)}>
                    {tier.text}
                  </span>
                </div>
              )
            })}

            {/* Zone legend */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-1 border-t border-zinc-800/50 text-[10px] text-zinc-500">
              <span className="flex items-center gap-1"><span className="w-2 h-1.5 rounded-sm bg-zinc-300/30 inline-block" />Good ≥1</span>
              <span className="flex items-center gap-1"><span className="w-2 h-1.5 rounded-sm bg-zinc-300/60 inline-block" />Great ≥33%</span>
              <span className="flex items-center gap-1"><span className="w-2 h-1.5 rounded-sm bg-amber-400/80 inline-block" />Amazing ≥66%</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
