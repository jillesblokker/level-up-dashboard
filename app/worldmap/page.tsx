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
    badge: "Hero Vault",
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
    badge: "Botanical Glasshouse",
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
    badge: "Sandbox Grid",
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
    badge: "Habit Ledger",
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
    badge: "Airship Port",
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
    badge: "Grand Bazaar",
    levelReq: "Level 1"
  }
];

export default function WorldMapPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-serif pb-24 pb-safe">
      {/* Top Floating Navigation Header */}
      <div className="sticky top-0 z-50 bg-zinc-950/90 backdrop-blur-md border-b border-amber-900/40 px-4 py-3 flex items-center justify-between shadow-xl">
        <Link href="/realm">
          <Button 
            variant="outline" 
            className="bg-zinc-900 hover:bg-zinc-800 border-amber-800/40 text-amber-400 gap-2 font-bold min-h-[44px]"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Realm
          </Button>
        </Link>
        <div className="flex items-center gap-2">
          <Badge className="bg-amber-950/80 border border-amber-500/40 text-amber-300 text-xs font-mono uppercase tracking-widest px-3 py-1">
            🗺️ World Cartography
          </Badge>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 pt-6 space-y-8">
        {/* Cartography Hero Banner */}
        <div className="relative rounded-3xl overflow-hidden border border-amber-500/30 shadow-2xl bg-gradient-to-b from-amber-950/60 via-zinc-950 to-zinc-950 p-6 sm:p-8 text-center space-y-4">
          <div className="absolute inset-0 -z-10 opacity-30">
            <Image
              src="/images/headers/realm-header.webp"
              alt="World Map Header"
              fill
              className="object-cover"
              priority
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/60 to-transparent -z-10" />

          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-950/80 border border-amber-500/50 text-amber-300 font-medieval text-xs tracking-wider">
            <Sparkles className="w-4 h-4 text-amber-400" /> Grand Kingdom Cartography
          </div>

          <h1 className="font-medieval text-3xl sm:text-5xl text-amber-400 tracking-wide">
            The Provinces of Thrivehaven
          </h1>
          <p className="text-zinc-300 text-xs sm:text-sm max-w-2xl mx-auto leading-relaxed italic">
            Fast travel across the realm to manage citizen garrisons, trade botanical potion ingredients, harvest farm crops, and reclaim ancient citadel ruins.
          </p>
        </div>

        {/* Ether Fuel Generator HUD Banner */}
        <div className="bg-zinc-900/90 border border-amber-500/30 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row items-center justify-between gap-4 shadow-xl">
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="w-11 h-11 rounded-xl bg-amber-950/80 border border-amber-500/40 flex items-center justify-center text-2xl shrink-0 shadow-md">
              ⛵
            </div>
            <div>
              <h4 className="font-medieval text-amber-300 text-sm sm:text-base flex items-center gap-2">
                Airship Ether Fuel Engine
                <Badge className="bg-emerald-950 border-emerald-500/40 text-emerald-300 text-[9px] font-mono">
                  ⚡ 2x Speed Active
                </Badge>
              </h4>
              <p className="text-xs text-zinc-400">
                Ether fuel is generated directly by completing real-world daily habits!
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto justify-end flex-wrap">
            <Badge className="bg-amber-950/80 border-amber-500/40 text-amber-300 text-xs font-mono py-1 px-3">
              ⛽ Ether Generated Today: +35 Fuel
            </Badge>
            <Link href="/quests">
              <Button size="sm" variant="outline" className="h-8 text-xs border-amber-500/40 text-amber-300 hover:bg-amber-950/60 font-bold font-serif">
                📜 Complete Habits
              </Button>
            </Link>
          </div>
        </div>

        {/* Territory Grid (Horizontal Touch Snap Carousel on Mobile) */}
        <div className="flex overflow-x-auto snap-x snap-mandatory gap-4 pb-3 custom-scrollbar mobile-scroll-hide sm:grid sm:grid-cols-2 lg:grid-cols-3 sm:gap-6">
          {PROVINCES.map((province) => {
            const Icon = province.icon;
            const minigameLabel = 
              province.id === "castle" ? "🧩 Plank Labyrinth" :
              province.id === "market" ? "🔮 Fortune Tarot" :
              province.id === "forest" ? "❓ Riddle Challenge" : null;

            return (
              <Card 
                key={province.id}
                className="bg-zinc-900/90 border-amber-900/40 hover:border-amber-500/60 transition-all duration-300 overflow-hidden shadow-xl group flex flex-col justify-between snap-start shrink-0 min-w-[280px] sm:min-w-0 sm:shrink"
              >
                {/* Cover Image & Badge */}
                <div className="relative h-36 w-full overflow-hidden border-b border-amber-900/30">
                  <Image
                    src={province.headerImage}
                    alt={province.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500 opacity-80"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/40 to-transparent" />
                  
                  <Badge className="absolute top-3 left-3 bg-zinc-950/90 border border-amber-500/40 text-amber-300 font-mono text-[10px] uppercase tracking-widest px-2.5 py-0.5 shadow-md">
                    {province.badge}
                  </Badge>

                  <Badge className="absolute top-3 right-3 bg-zinc-950/90 border border-zinc-700 text-zinc-400 font-mono text-[10px] px-2 py-0.5">
                    {province.levelReq}
                  </Badge>

                  <div className={`absolute bottom-3 left-4 p-2.5 rounded-xl border ${province.iconBg} shadow-lg backdrop-blur-sm`}>
                    <Icon className="w-5 h-5" />
                  </div>
                </div>

                {/* Card Content */}
                <CardContent className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medieval text-xl text-amber-300 group-hover:text-amber-200 transition-colors">
                        {province.title}
                      </h3>
                      {minigameLabel && (
                        <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-500/30">
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
                        ⛵ Synergy: Knowledge +20% Speed
                      </Badge>
                      <Badge className="bg-emerald-950/80 border-emerald-500/40 text-emerald-300 text-[9px] font-mono font-bold">
                        🔥 7+ Streak: 2x Speed
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
