"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, BookOpen, Brain, Flame, Heart, Shield, Sparkles, Scale, Compass, CheckCircle2, Lock, Gift, Download } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface SourcePrinciple {
  id: string;
  lawName: string;
  subtitle: string;
  sourceAttribution: string;
  icon: string;
  tag: string;
  tagColor: string;
  theCoreLaw: string;
  humanBehaviorProblem: string;
  thrivehavenSolution: string;
  inGameMechanic: string;
}

const PRINCIPLES: SourcePrinciple[] = [
  {
    id: "habit-consolidation",
    lawName: "The 66-day habit consolidation threshold",
    subtitle: "Why 21 days is a myth and how habits achieve neuroplastic automaticity",
    sourceAttribution: "Dr. Phillippa Lally et al., University College London (European Journal of Social Psychology, 2009)",
    icon: "🗿",
    tag: "Neuroscience",
    tagColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    theCoreLaw:
      "A new behavior requires an average of 66 consecutive days before it reaches its peak asymptote of automaticity—the point where neural pathways have solidified and the action requires virtually zero conscious willpower to perform.",
    humanBehaviorProblem:
      "Popular culture promotes the 21-day myth (originated from cosmetic surgeon Maxwell Maltz observing amputees adjusting to limb loss, not habit formation). When people struggle after 3 weeks, they believe they lack discipline and quit right before automaticity begins.",
    thrivehavenSolution:
      "We treat 66 days as the sacred graduation threshold. Once a habit hits 66 days, it no longer needs to be a stressful daily chore on your active quest list.",
    inGameMechanic:
      "Habit Graduation & Zora Stone Monuments: At 66 days, you can graduate the habit into an eternal carved stone monument on your kingdom grid. Clicking the monument displays the exact date and celebratory inscription: 'On [date] you mastered the habit of [habit name]. It seems you got it into your system. Well done and keep it up.'",
  },
  {
    id: "streak-shame",
    lawName: "The streak shame spiral & the what-the-hell effect",
    subtitle: "Why broken streaks are the #1 cause of app abandonment and how mercy heals them",
    sourceAttribution: "Behavioral Economics (Cochran & Tesser) and Duolingo Product Churn Post-Mortems",
    icon: "🏕️",
    tag: "Behavioral psychology",
    tagColor: "bg-orange-500/10 text-orange-400 border-orange-500/20",
    theCoreLaw:
      "The 'what-the-hell effect' occurs when a strict behavioral streak is broken, triggering catastrophic guilt. The psychological contract snaps: users feel that because their clean record is ruined, total abandonment is justified.",
    humanBehaviorProblem:
      "In apps with punitive streaks, losing an 80-day streak is the single largest predictor of permanent user churn. Opening the app shifts from feeling like an empowering ally to a humiliating reminder of personal failure.",
    thrivehavenSolution:
      "We replace guilt, punishment, and paywalled streak freezes with proactive rest periods and compassionate restorative rituals.",
    inGameMechanic:
      "Campfire Guard & Restorative Mercy Quests: Campfire Guard allows players to pause streaks for 3 days, 7 days, 14 days, 1 month, or 2 months without penalty when life shifts or vacation begins. If a streak cracks, 3 simple restorative Mercy Quests (herbal hydration, mindful stroll, honest chronicle reflection) rekindle the sacred flame immediately without guilt or fees.",
  },
  {
    id: "goodharts-law",
    lawName: "Goodhart’s law & the anti-grind safeguard",
    subtitle: "When a measure becomes a target, it ceases to be a good measure",
    sourceAttribution: "Charles Goodhart, London School of Economics (1975) / Marilyn Strathern (1997)",
    icon: "⚖️",
    tag: "Game theory",
    tagColor: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    theCoreLaw:
      "When any metric or measure is turned into an explicit target for incentives, individuals will optimize for the metric itself rather than the underlying intent, corrupting the validity of the measure.",
    humanBehaviorProblem:
      "If a gamified habit app rewards raw completion counts without bounds, players create 30 trivial micro-tasks (like 'drink a sip of water' or 'blink 5 times') to farm gold and XP, completely defeating real-life personal growth.",
    thrivehavenSolution:
      "We build natural ceilings, private sanctuary protections, and authentic category synergies rather than infinite dopamine treadmills.",
    inGameMechanic:
      "5 Habits/Day Sweet Spot & Private Sanctuary: 5 habits per day is celebrated as 'Great' with confetti explosions; exceeding 10 yields diminishing XP. Furthermore, players can mark personal habits as 'Private Sanctuary Quests', masking them in social and alliance feeds as 'Secret discipline completed (+10 Honor)' so that external validation never distorts authentic self-improvement.",
  },
  {
    id: "hicks-law",
    lawName: "Hick’s law & cognitive load reduction",
    subtitle: "Minimizing decision fatigue to protect real-world energy",
    sourceAttribution: "William Edmund Hick & Ray Hyman (1952)",
    icon: "🧭",
    tag: "UX psychology",
    tagColor: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    theCoreLaw:
      "The time and cognitive effort required to make a decision increases logarithmically with the number and complexity of choices presented.",
    humanBehaviorProblem:
      "Traditional productivity tools present endless boards, infinite tag trees, and dense lists. Users expend their limited daily willpower organizing the tool rather than performing their real-world habits.",
    thrivehavenSolution:
      "A fast, high-signal morning ritual where the user can check off their core habits and close the app in under 60 seconds.",
    inGameMechanic:
      "Morning Habit Focus Widget: The Daily Hub spotlights the top 3–5 favored habits with instant 1-tap toggles. Notification bells suppress minor +10 XP spam and alert exclusively on actionable events (Titan Wyrm raids, friend dares).",
  },
  {
    id: "communal-reciprocity",
    lawName: "Communal reciprocity & non-zero-sum guild dynamics",
    subtitle: "Turning late-game resource hoarding into mentorship and newcomer blessings",
    sourceAttribution: "Marcel Mauss ('The Gift', 1925) & Elinor Ostrom on Governing the Commons (Nobel Memorial Prize, 2009)",
    icon: "🤝",
    tag: "Social economics",
    tagColor: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    theCoreLaw:
      "Healthy communities thrive when surplus resources can be gifted across generational tiers without zero-sum competition, creating enduring bonds of reciprocity and collective security.",
    humanBehaviorProblem:
      "In typical games, veteran players amass fortunes with nothing meaningful to buy, while new players struggle with steep resource barriers. Guilds become elitist and reject beginners.",
    thrivehavenSolution:
      "A collaborative Alliance Treasury where elder players' surplus gold unlocks universal perks that disproportionately accelerate novices.",
    inGameMechanic:
      "Alliance Treasury Vault: High-level players donate surplus Gold (+250g, +1,000g, +5,000g) to the communal vault. Tier 1 unlocks the 'Novice Blessing' (+15% XP for level 1–10 recruits) and Tier 3 funds 500 Gold Welcome Chests for every new applicant, making active alliances eager to recruit and nurture beginners.",
  },
  {
    id: "data-sovereignty",
    lawName: "Data sovereignty & the zero lock-in doctrine",
    subtitle: "Your personal history and mental growth belong to you, not a corporate moat",
    sourceAttribution: "Ethical Software Design & The Human-Centered Web Manifesto",
    icon: "📜",
    tag: "Ethical design",
    tagColor: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
    theCoreLaw:
      "Software that holds personal reflections, mental health records, and daily habits has an ethical obligation to allow complete, unencumbered export of user data in open standard formats at any time.",
    humanBehaviorProblem:
      "Many modern apps trap users with proprietary database formats, making migration impossible and creating anxiety about future data loss if subscriptions are cancelled.",
    thrivehavenSolution:
      "Zero lock-in by design. Every reflection, journal entry, and habit streak can be exported in one click from the Settings menu.",
    inGameMechanic:
      "1-Click Client-Side Export: Players can download their Chronicle Diary as clean, portable Markdown (.md) compatible with Obsidian and Notion, and their habit streaks as a structured spreadsheet (.csv) for Excel or Google Sheets. The export runs entirely in-browser with zero data capture.",
  },
];

export default function SourcesPage() {
  return (
    <div className="min-h-screen bg-black text-zinc-100 p-4 sm:p-8 space-y-8 max-w-6xl mx-auto">
      {/* Top Navigation */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-amber-900/30 pb-6">
        <div className="flex items-center gap-3">
          <Link href="/design-system">
            <Button
              variant="outline"
              size="sm"
              className="border-amber-900/40 hover:bg-amber-950/40 text-amber-300 font-serif gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Design system
            </Button>
          </Link>
          <Link href="/quests">
            <Button
              variant="ghost"
              size="sm"
              className="text-zinc-400 hover:text-zinc-200 text-xs font-serif"
            >
              Back to quests
            </Button>
          </Link>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono text-zinc-500">
          <BookOpen className="w-4 h-4 text-amber-400" />
          <span>Thrivehaven Codex of Behavioral Foundations</span>
        </div>
      </div>

      {/* Hero Header */}
      <div className="relative p-6 sm:p-10 rounded-3xl bg-gradient-to-br from-amber-950/40 via-zinc-950 to-orange-950/30 border border-amber-500/30 shadow-2xl overflow-hidden">
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-4 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-serif font-bold">
            <Sparkles className="w-3.5 h-3.5" />
            Behavioral science & game ethics
          </div>
          <h1 className="text-3xl sm:text-5xl font-medieval font-bold text-amber-200 tracking-wide">
            Sources & behavioral laws
          </h1>
          <p className="text-sm sm:text-base text-zinc-300 font-serif leading-relaxed">
            Thrivehaven is not a casual to-do list wrapped in fantasy pixel art. Every core mechanic—from the 66-day Zora stone monument to the Campfire Guard and Alliance Treasury—is engineered upon proven behavioral psychology, neuroplastic research, and ethical game design principles.
          </p>
        </div>
      </div>

      {/* Core Principles Grid */}
      <div className="grid grid-cols-1 gap-8">
        {PRINCIPLES.map((item, index) => (
          <Card
            key={item.id}
            className="bg-zinc-950/90 border border-amber-900/40 shadow-xl hover:border-amber-500/40 transition-all duration-300 overflow-hidden"
          >
            <CardHeader className="p-6 sm:p-8 pb-4 border-b border-amber-900/20 bg-gradient-to-r from-amber-950/20 via-zinc-950 to-transparent">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-amber-950/60 border border-amber-500/30 flex items-center justify-center text-2xl shadow-inner shrink-0">
                    {item.icon}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-mono text-amber-500 font-bold">Law 0{index + 1}</span>
                      <Badge className={`${item.tagColor} text-[10px] font-mono border`}>
                        {item.tag}
                      </Badge>
                    </div>
                    <CardTitle className="text-xl sm:text-2xl font-medieval font-bold text-amber-200 mt-0.5">
                      {item.lawName}
                    </CardTitle>
                  </div>
                </div>
              </div>
              <CardDescription className="text-xs sm:text-sm text-zinc-400 font-serif mt-1">
                {item.subtitle}
              </CardDescription>
              <div className="text-[11px] font-mono text-amber-400/70 pt-1 flex items-center gap-1.5">
                <span>Academic source:</span>
                <span className="italic text-zinc-300">{item.sourceAttribution}</span>
              </div>
            </CardHeader>

            <CardContent className="p-6 sm:p-8 space-y-6">
              {/* The Core Law */}
              <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-500/20 space-y-1">
                <div className="text-xs font-bold font-serif text-amber-300 flex items-center gap-2">
                  <Scale className="w-4 h-4 text-amber-400" />
                  The psychological law
                </div>
                <p className="text-xs sm:text-sm text-zinc-200 leading-relaxed font-serif">
                  {item.theCoreLaw}
                </p>
              </div>

              {/* Problem vs Solution 2-column */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-red-950/10 border border-red-900/30 space-y-1.5">
                  <div className="text-xs font-bold font-serif text-red-400 flex items-center gap-2">
                    <span>⚠️</span> The human failure pattern
                  </div>
                  <p className="text-xs text-zinc-300 leading-relaxed">
                    {item.humanBehaviorProblem}
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-emerald-950/10 border border-emerald-900/30 space-y-1.5">
                  <div className="text-xs font-bold font-serif text-emerald-400 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" /> The Thrivehaven approach
                  </div>
                  <p className="text-xs text-zinc-300 leading-relaxed">
                    {item.thrivehavenSolution}
                  </p>
                </div>
              </div>

              {/* In-Game Mechanic Callout */}
              <div className="p-4 rounded-xl bg-zinc-900/80 border border-amber-500/30 flex items-start gap-3.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-base shrink-0 mt-0.5">
                  🎮
                </div>
                <div className="space-y-1">
                  <div className="text-xs font-bold font-serif text-amber-300 uppercase tracking-wider">
                    How it works in the game
                  </div>
                  <p className="text-xs sm:text-sm text-zinc-200 font-serif leading-relaxed">
                    {item.inGameMechanic}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Footer Manifesto */}
      <div className="p-6 rounded-2xl bg-zinc-950 border border-amber-900/30 text-center space-y-3">
        <p className="text-xs font-serif text-zinc-400 max-w-2xl mx-auto leading-relaxed">
          &quot;Thrivehaven will never monetize your guilt, hostage your streaks, or trick your dopamine into empty compliance. We measure success when you turn off the screen, step into the sun, and conquer real life.&quot;
        </p>
        <div className="text-[11px] font-mono text-amber-400/80 uppercase tracking-widest">
          Valoreth Behavioral Charter • Updated September 2026
        </div>
      </div>
    </div>
  );
}
