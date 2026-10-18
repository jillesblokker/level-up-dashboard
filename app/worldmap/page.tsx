"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { 
  ArrowLeft, 
  MapPin, 
  Trees, 
  Mountain, 
  Compass, 
  Waves, 
  ShoppingBag, 
  Crown,
  Sparkles,
  ShieldCheck
} from "lucide-react";
import { TEXT_CONTENT } from "@/lib/text-content";

const PROVINCES = [
  {
    id: "castle",
    title: TEXT_CONTENT.worldMap?.castle?.title || "Valoreth Citadel",
    desc: TEXT_CONTENT.worldMap?.castle?.desc || "The central seat of royal power, hero vault, and knightly equipment.",
    buttonText: TEXT_CONTENT.worldMap?.castle?.button || "Enter citadel",
    href: "/character",
    icon: Crown,
    iconBg: "bg-amber-600/30 text-amber-300 border-amber-500/40",
    headerImage: "/images/headers/realm-header.webp",
    badge: "Hero vault",
    levelReq: "Level 1"
  },
  {
    id: "forest",
    title: TEXT_CONTENT.worldMap?.forest?.title || "Whispering Grove",
    desc: TEXT_CONTENT.worldMap?.forest?.desc || "Ancient grove rich in botanical reagents, Apotheca potion crafting, and spirits.",
    buttonText: TEXT_CONTENT.worldMap?.forest?.button || "Visit Apotheca",
    href: "/market",
    icon: Trees,
    iconBg: "bg-emerald-600/30 text-emerald-300 border-emerald-500/40",
    headerImage: "/images/headers/daily-hub-hero.webp",
    badge: "Botanical glasshouse",
    levelReq: "Level 1"
  },
  {
    id: "mountain",
    title: TEXT_CONTENT.worldMap?.mountain?.title || "Ironstone Peaks",
    desc: TEXT_CONTENT.worldMap?.mountain?.desc || "Rugged mountain quarries, dwarven blacksmith anvils, and sandbox building.",
    buttonText: TEXT_CONTENT.worldMap?.mountain?.button || "Ascend peaks",
    href: "/realm",
    icon: Mountain,
    iconBg: "bg-slate-600/30 text-slate-300 border-slate-500/40",
    headerImage: "/images/headers/kingdom-header.webp",
    badge: "Sandbox grid",
    levelReq: "Level 1"
  },
  {
    id: "village",
    title: TEXT_CONTENT.worldMap?.village?.title || "Haven Settlement",
    desc: TEXT_CONTENT.worldMap?.village?.desc || "Peaceful agricultural farmlands, citizen training grounds, and daily habits.",
    buttonText: TEXT_CONTENT.worldMap?.village?.button || "Visit settlement",
    href: "/quests",
    icon: Compass,
    iconBg: "bg-orange-600/30 text-orange-300 border-orange-500/40",
    headerImage: "/images/headers/quests-header.webp",
    badge: "Habit ledger",
    levelReq: "Level 1"
  },
  {
    id: "lake",
    title: TEXT_CONTENT.worldMap?.lake?.title || "Serene Harbor",
    desc: TEXT_CONTENT.worldMap?.lake?.desc || "Crystal waterways, airship trading expeditions, and habit-powered Ether voyages.",
    buttonText: TEXT_CONTENT.worldMap?.lake?.button || "Visit harbor",
    href: "/airship-harbor",
    icon: Waves,
    iconBg: "bg-blue-600/30 text-blue-300 border-blue-500/40",
    headerImage: "/images/headers/allies-header.webp",
    badge: "Airship port",
    levelReq: "Level 1"
  },
  {
    id: "market",
    title: TEXT_CONTENT.worldMap?.market?.title || "Royal Bazaar",
    desc: TEXT_CONTENT.worldMap?.market?.desc || "The Grand Exchange trading post, commodity bartering, and mystic packs.",
    buttonText: TEXT_CONTENT.worldMap?.market?.button || "Visit market",
    href: "/market",
    icon: ShoppingBag,
    iconBg: "bg-purple-600/30 text-purple-300 border-purple-500/40",
    headerImage: "/images/headers/character-header.webp",
    badge: "Grand bazaar",
    levelReq: "Level 1"
  }
];

export default function WorldMapPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-serif pb-24 pb-safe overflow-x-hidden w-full max-w-full">
      {/* Top Floating Navigation Header */}
      <div className="sticky top-0 z-50 bg-zinc-950/90 backdrop-blur-md border-b border-amber-900/40 px-3 sm:px-4 py-3 flex items-center justify-between shadow-xl">
        <Link href="/realm">
          <Button 
            variant="outline" 
            className="bg-zinc-900 hover:bg-zinc-800 border-amber-800/40 text-amber-400 gap-1.5 sm:gap-2 font-bold text-xs sm:text-sm min-h-[44px]"
          >
            <ArrowLeft className="h-4 w-4" /> Back to realm
          </Button>
        </Link>
        <div className="flex items-center gap-2">
          <Badge className="bg-amber-950/80 border border-amber-500/40 text-amber-300 text-[10px] sm:text-xs font-mono uppercase tracking-widest px-2.5 sm:px-3 py-1">
            🗺️ World cartography
          </Badge>
        </div>
      </div>

      <div className="container mx-auto px-3 sm:px-6 pt-4 sm:pt-6 space-y-6 sm:space-y-8 max-w-full min-w-0 overflow-hidden">
        {/* Cartography Hero Banner */}
        <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden border border-amber-500/30 shadow-2xl bg-gradient-to-b from-amber-950/60 via-zinc-950 to-zinc-950 p-4 sm:p-8 text-center space-y-3 sm:space-y-4">
          <div className="absolute inset-0 -z-10 opacity-30">
            <Image
              src="/images/headers/realm-header.webp"
              alt="World map header"
              fill
              className="object-cover"
              priority
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/60 to-transparent -z-10" />

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-950/80 border border-amber-500/50 text-amber-300 font-medieval text-xs tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Grand kingdom cartography
          </div>

          <h1 className="font-medieval text-2xl sm:text-4xl md:text-5xl text-amber-400 tracking-wide">
            The provinces of Thrivehaven
          </h1>
          <p className="text-zinc-300 text-xs sm:text-sm max-w-2xl mx-auto leading-relaxed italic">
            Fast travel across the realm to manage citizen garrisons, trade botanical potion ingredients, harvest farm crops, and reclaim ancient citadel ruins.
          </p>
        </div>

        {/* Ether Fuel Generator HUD Banner */}
        <div className="bg-zinc-900/90 border border-amber-500/30 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row items-center justify-between gap-4 shadow-xl w-full min-w-0">
          <div className="flex items-center gap-3 w-full md:w-auto min-w-0">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-amber-950/80 border border-amber-500/40 flex items-center justify-center text-xl sm:text-2xl shrink-0 shadow-md">
              ⛵
            </div>
            <div className="min-w-0">
              <h4 className="font-medieval text-amber-300 text-sm sm:text-base flex items-center gap-2 flex-wrap">
                Airship ether fuel engine
                <Badge className="bg-emerald-950 border-emerald-500/40 text-emerald-300 text-[9px] font-mono">
                  ⚡ 2x speed active
                </Badge>
              </h4>
              <p className="text-xs text-zinc-400">
                Ether fuel is generated directly by completing real-world daily habits!
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto justify-between sm:justify-end flex-wrap">
            <Badge className="bg-amber-950/80 border-amber-500/40 text-amber-300 text-xs font-mono py-1 px-2.5 sm:px-3">
              ⛽ Ether generated today: +35 fuel
            </Badge>
            <Link href="/quests" className="shrink-0">
              <Button size="sm" variant="outline" className="h-8 text-xs border-amber-500/40 text-amber-300 hover:bg-amber-950/60 font-bold font-serif">
                📜 Complete habits
              </Button>
            </Link>
          </div>
        </div>

        {/* Territory Grid (Responsive grid on mobile and desktop) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 w-full max-w-full min-w-0">
          {PROVINCES.map((province) => {
            const Icon = province.icon;
            const minigameLabel = 
              province.id === "castle" ? "🧩 Plank labyrinth" :
              province.id === "market" ? "🔮 Fortune tarot" :
              province.id === "forest" ? "❓ Riddle challenge" : null;

            return (
              <Card 
                key={province.id}
                className="bg-zinc-900/90 border-amber-900/40 hover:border-amber-500/60 transition-all duration-300 overflow-hidden shadow-xl group flex flex-col justify-between w-full min-w-0"
              >
                {/* Cover Image & Badge */}
                <div className="relative h-36 sm:h-40 w-full overflow-hidden border-b border-amber-900/30">
                  <Image
                    src={province.headerImage}
                    alt={province.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500 opacity-80"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/40 to-transparent" />
                  
                  <Badge className="absolute top-2.5 left-2.5 sm:top-3 sm:left-3 bg-zinc-950/90 border border-amber-500/40 text-amber-300 font-mono text-[10px] uppercase tracking-widest px-2.5 py-0.5 shadow-md">
                    {province.badge}
                  </Badge>

                  <Badge className="absolute top-2.5 right-2.5 sm:top-3 sm:right-3 bg-zinc-950/90 border border-zinc-700 text-zinc-400 font-mono text-[10px] px-2 py-0.5">
                    {province.levelReq}
                  </Badge>

                  <div className={`absolute bottom-2.5 left-3 sm:bottom-3 sm:left-4 p-2 sm:p-2.5 rounded-xl border ${province.iconBg} shadow-lg backdrop-blur-sm`}>
                    <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                </div>

                {/* Card Content */}
                <CardContent className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3 sm:space-y-4 min-w-0">
                  <div className="space-y-2 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-medieval text-lg sm:text-xl text-amber-300 group-hover:text-amber-200 transition-colors truncate">
                        {province.title}
                      </h3>
                      {minigameLabel && (
                        <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-500/30 shrink-0">
                          {minigameLabel}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-zinc-400 leading-relaxed font-sans">
                      {province.desc}
                    </p>
                    {/* Category Synergy & Airship Streak Speed Multiplier */}
                    <div className="flex items-center gap-1.5 flex-wrap pt-1">
                      <Badge className="bg-amber-950/80 border-amber-500/40 text-amber-300 text-[9px] font-mono font-bold">
                        ⛵ Synergy: Knowledge +20% speed
                      </Badge>
                      <Badge className="bg-emerald-950/80 border-emerald-500/40 text-emerald-300 text-[9px] font-mono font-bold">
                        🔥 7+ streak: 2x speed
                      </Badge>
                    </div>
                  </div>

                  <Link href={province.href} className="w-full pt-2">
                    <Button 
                      className="w-full bg-emerald-600 hover:bg-emerald-500 border border-emerald-400/30 text-white font-serif font-bold text-xs py-3 rounded-xl shadow-md min-h-[44px] flex items-center justify-center gap-2 tracking-wide transition-all active:scale-95"
                    >
                      <MapPin className="w-4 h-4" /> {province.buttonText}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
