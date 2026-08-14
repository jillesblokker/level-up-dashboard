"use client";

import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Compass, Sparkles, X, ArrowRight, ShieldCheck, Trophy, Map, Scroll, Swords } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface WaypointInfo {
  title: string;
  subtitle: string;
  image: string;
  description: string;
  destination: string;
  buttonText: string;
  icon: string;
  badgeText: string;
  badgeColor: string;
}

const WAYPOINT_REGISTRY: Record<string, WaypointInfo> = {
  'daily-hub': {
    title: 'Daily Habit Hub',
    subtitle: 'Morning Routine & Streak Headquarters',
    image: '/images/kingdom-tiles/Dailyhub.png',
    description: 'Enter your main habit dashboard to view streak progress, check off daily routines, and earn House Cup virtue energy.',
    destination: '/daily-hub',
    buttonText: '🚀 Enter Daily Hub',
    icon: '📅',
    badgeText: 'Habit Engine',
    badgeColor: 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300'
  },
  'dungeon': {
    title: 'Dungeon Keep',
    subtitle: 'Turn-Based 3v3 Elemental Creature Depths',
    image: '/images/tiles/dungeon-tile.webp',
    description: 'Lead your trained citizens and Guardian Pet strikers into 3v3 elemental battles to claim rare blueprints & alchemy reagents.',
    destination: '/dungeon',
    buttonText: '⚔️ Delve into Dungeon Keep',
    icon: '⚔️',
    badgeText: 'Combat Depths',
    badgeColor: 'bg-purple-950/80 border-purple-500/50 text-purple-300'
  },
  'dungeon-keep': {
    title: 'Dungeon Keep',
    subtitle: 'Turn-Based 3v3 Elemental Creature Depths',
    image: '/images/tiles/dungeon-tile.webp',
    description: 'Lead your trained citizens and Guardian Pet strikers into 3v3 elemental battles to claim rare blueprints & alchemy reagents.',
    destination: '/dungeon',
    buttonText: '⚔️ Delve into Dungeon Keep',
    icon: '⚔️',
    badgeText: 'Combat Depths',
    badgeColor: 'bg-purple-950/80 border-purple-500/50 text-purple-300'
  },
  'quest-board': {
    title: 'Royal Quest Board',
    subtitle: 'Daily Habits, Weekly Challenges & Milestones',
    image: '/images/kingdom-tiles/QuestBoard.webp',
    description: 'Manage your repeating daily routines, weekly focus challenges, and lifetime cumulative milestones.',
    destination: '/quests',
    buttonText: '📜 Inspect Quest Board',
    icon: '📜',
    badgeText: 'Quests & Milestones',
    badgeColor: 'bg-amber-950/80 border-amber-500/50 text-amber-300'
  },
  'market': {
    title: 'Royal Exchange',
    subtitle: 'Kingdom Resource & Material Trading Post',
    image: '/images/kingdom-tiles/MarketStalls.webp',
    description: 'Trade harvested wood, stone, fish, and botanical reagents at the Royal Exchange trading post.',
    destination: '/market',
    buttonText: '🛒 Enter Royal Exchange',
    icon: '🛒',
    badgeText: 'Trading Post',
    badgeColor: 'bg-yellow-950/80 border-yellow-500/50 text-yellow-300'
  },
  'market-stalls': {
    title: 'Royal Exchange',
    subtitle: 'Kingdom Resource & Material Trading Post',
    image: '/images/kingdom-tiles/MarketStalls.webp',
    description: 'Trade harvested wood, stone, fish, and botanical reagents at the Royal Exchange trading post.',
    destination: '/market',
    buttonText: '🛒 Enter Royal Exchange',
    icon: '🛒',
    badgeText: 'Trading Post',
    badgeColor: 'bg-yellow-950/80 border-yellow-500/50 text-yellow-300'
  },
  'mystic_bazaar': {
    title: 'Mystic Bazaar',
    subtitle: 'Enchanted Card Pack & Chrono Shop',
    image: '/images/kingdom-tiles/Mystic_bazaar.webp',
    description: 'Open Chrono Chests, collect Mythic worker cards, and browse rare kingdom blueprints.',
    destination: '/market?tab=mystic-bazaar',
    buttonText: '✨ Open Mystic Bazaar',
    icon: '✨',
    badgeText: 'Card Shop',
    badgeColor: 'bg-fuchsia-950/80 border-fuchsia-500/50 text-fuchsia-300'
  },
  'airship_harbor': {
    title: 'Airship Harbor Skydock',
    subtitle: 'Ether Voyage Expeditions & Trading Ports',
    image: '/images/kingdom-tiles/Airship_harbor.webp',
    description: 'Assign citizen crews to airship voyages propelled by your real-world daily habit completions.',
    destination: '/city/Grand Citadel/tavern?tab=airship',
    buttonText: '🛸 Enter Skydock',
    icon: '🛸',
    badgeText: 'Habit Engine',
    badgeColor: 'bg-cyan-950/80 border-cyan-500/50 text-cyan-300'
  },
  'housecup': {
    title: 'Hourglass Spire',
    subtitle: '7 Virtue Hourglasses & House Cup Scores',
    image: '/images/kingdom-tiles/Housecup.webp',
    description: 'Inspect real-time virtue hourglass scores, monthly recaps, and Paragon borders.',
    destination: '/social?tab=house-cup',
    buttonText: '🏆 Ascend Hourglass Spire',
    icon: '🏆',
    badgeText: '7 Virtues',
    badgeColor: 'bg-amber-950/80 border-amber-500/50 text-amber-300'
  },
  'observatory': {
    title: 'Cartography Observatory',
    subtitle: 'Province Fast-Travel & World Map Spire',
    image: '/images/kingdom-tiles/Observatory.webp',
    description: 'Chart distant realm provinces, reclaim ancient citadel ruins, and fast travel across the world.',
    destination: '/worldmap',
    buttonText: '🗺️ Enter Observatory',
    icon: '🗺️',
    badgeText: 'World Map',
    badgeColor: 'bg-indigo-950/80 border-indigo-500/50 text-indigo-300'
  },
  'hall_of_champions': {
    title: 'Chronicle Hall of Champions',
    subtitle: 'Legacy Titles & Season Champions Gallery',
    image: '/images/kingdom-tiles/Hall_of_champions.webp',
    description: 'Honors past season champions, legacy virtue titles, and permanent Paragon Hall of Fame placement.',
    destination: '/chronicle',
    buttonText: '📜 Open Hall of Champions',
    icon: '📜',
    badgeText: 'Hall of Fame',
    badgeColor: 'bg-yellow-950/80 border-yellow-500/50 text-yellow-300'
  },
  'titan_watchtower': {
    title: 'Titan Wyrm Watchtower',
    subtitle: 'Co-Op Alliance Raid Headquarters',
    image: '/images/kingdom-tiles/Titan_watchtower.webp',
    description: 'Unite with alliance members to damage the shared Titan Wyrm raid boss and claim victory chests.',
    destination: '/social?tab=alliances',
    buttonText: '🐉 Enter Titan Watchtower',
    icon: '🐉',
    badgeText: 'Co-op Raid',
    badgeColor: 'bg-red-950/80 border-red-500/50 text-red-300'
  },
  'castle': {
    title: 'Royal Castle',
    subtitle: 'Citadel Seat & Sandbox Realm Builder',
    image: '/images/kingdom-tiles/Castle.webp',
    description: 'Manage your kingdom layout, construct properties, collect taxes, and expand your realm.',
    destination: '/realm',
    buttonText: '🏰 Enter Royal Castle',
    icon: '🏰',
    badgeText: 'Capital Citadel',
    badgeColor: 'bg-yellow-950/80 border-yellow-500/50 text-yellow-300'
  },
  'library': {
    title: 'Grand Library Archives',
    subtitle: 'Chronicle Records & Private Reflection Journal',
    image: '/images/kingdom-tiles/Library.webp',
    description: 'Access auto-generated habit milestone achievements and write private reflection entries.',
    destination: '/chronicle',
    buttonText: '📚 Open Library Archives',
    icon: '📚',
    badgeText: 'Lore & Journal',
    badgeColor: 'bg-blue-950/80 border-blue-500/50 text-blue-300'
  },
  'training-grounds': {
    title: 'Barracks Training Grounds',
    subtitle: 'Citizen Classes & Hero Vault',
    image: '/images/kingdom-tiles/TrainingGrounds.webp',
    description: 'Train citizen combat classes (Tank, Mage, Alchemist, Scout) and manage hero equipment slots.',
    destination: '/character',
    buttonText: '⚔️ Enter Barracks',
    icon: '⚔️',
    badgeText: 'Citizen Vault',
    badgeColor: 'bg-red-950/80 border-red-500/50 text-red-300'
  },
  'monument': {
    title: 'Hall of Fame Monument',
    subtitle: 'Kingdom Achievements & Glory',
    image: '/images/kingdom-tiles/Monument.webp',
    description: 'View player achievements, completed milestones, and kingdom glory rankings.',
    destination: '/chronicle',
    buttonText: '📜 Enter Hall of Fame',
    icon: '🏆',
    badgeText: 'Hall of Fame',
    badgeColor: 'bg-yellow-950/80 border-yellow-500/50 text-yellow-300'
  },
  'hall_of_fame': {
    title: 'Hall of Fame Monument',
    subtitle: 'Kingdom Achievements & Glory',
    image: '/images/kingdom-tiles/Monument.webp',
    description: 'View player achievements, completed milestones, and kingdom glory rankings.',
    destination: '/chronicle',
    buttonText: '📜 Enter Hall of Fame',
    icon: '🏆',
    badgeText: 'Hall of Fame',
    badgeColor: 'bg-yellow-950/80 border-yellow-500/50 text-yellow-300'
  },
  'dailyhub': {
    title: 'Daily Habit Hub',
    subtitle: 'Morning Routine & Streak Headquarters',
    image: '/images/kingdom-tiles/Dailyhub.png',
    description: 'Enter your main habit dashboard to view streak progress, check off daily routines, and earn House Cup virtue energy.',
    destination: '/daily-hub',
    buttonText: '🚀 Enter Daily Hub',
    icon: '📅',
    badgeText: 'Habit Engine',
    badgeColor: 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300'
  },
  'daily_hub': {
    title: 'Daily Habit Hub',
    subtitle: 'Morning Routine & Streak Headquarters',
    image: '/images/kingdom-tiles/Dailyhub.png',
    description: 'Enter your main habit dashboard to view streak progress, check off daily routines, and earn House Cup virtue energy.',
    destination: '/daily-hub',
    buttonText: '🚀 Enter Daily Hub',
    icon: '📅',
    badgeText: 'Habit Engine',
    badgeColor: 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300'
  }
};

interface WaypointPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  tileType: string | null;
  onConfirmNavigate: (destinationUrl: string) => void;
}

export function WaypointPreviewModal({
  isOpen,
  onClose,
  tileType,
  onConfirmNavigate
}: WaypointPreviewModalProps) {
  if (!tileType) return null;

  const info = WAYPOINT_REGISTRY[tileType] || {
    title: 'Kingdom Landmark',
    subtitle: 'Special Waypoint Destination',
    image: '/images/kingdom-tiles/Castle.webp',
    description: 'Enter this kingdom landmark location to manage your realm features.',
    destination: '/daily-hub',
    buttonText: 'Enter Location',
    icon: '📍',
    badgeText: 'Waypoint',
    badgeColor: 'bg-amber-950/80 border-amber-500/50 text-amber-300'
  };

  const handleEnter = () => {
    onClose();
    onConfirmNavigate(info.destination);
  };

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent className="max-w-md w-[95vw] sm:w-full bg-zinc-950/95 border-2 border-amber-500/40 text-white rounded-2xl shadow-2xl p-0 overflow-hidden backdrop-blur-xl">
        {/* Header Hero Banner */}
        <div className="relative w-full h-44 sm:h-52 bg-gradient-to-b from-amber-950/40 to-zinc-950 flex items-center justify-center border-b border-amber-900/30 overflow-hidden">
          <div className="absolute inset-0 bg-radial-vignette opacity-75 z-10" />
          <Image
            src={info.image}
            alt={info.title}
            fill
            className="object-contain p-4 drop-shadow-[0_0_25px_rgba(245,158,11,0.35)] z-0 transition-transform duration-500 hover:scale-105"
          />

          {/* Badge */}
          <div className={cn(
            "absolute top-3 left-3 z-20 px-2.5 py-1 rounded-full border text-[10px] sm:text-xs font-mono font-bold flex items-center gap-1.5 shadow-lg backdrop-blur-md",
            info.badgeColor
          )}>
            <span>{info.icon}</span>
            <span>{info.badgeText}</span>
          </div>
        </div>

        {/* Content Section */}
        <div className="p-4 sm:p-6 space-y-4">
          <DialogHeader className="text-left space-y-1">
            <DialogTitle className="text-xl sm:text-2xl font-black text-amber-200 tracking-tight flex items-center gap-2">
              <span>{info.icon}</span>
              <span>{info.title}</span>
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm text-zinc-400 font-medium">
              {info.subtitle}
            </DialogDescription>
          </DialogHeader>

          <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed bg-zinc-900/60 border border-zinc-800/80 p-3 rounded-xl">
            {info.description}
          </p>

          {/* Action Button Stacking for Mobile */}
          <div className="pt-2 flex flex-col sm:flex-row gap-2.5 w-full">
            <Button
              onClick={handleEnter}
              className="w-full bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 hover:from-amber-400 hover:to-yellow-400 text-zinc-950 font-extrabold text-sm py-5 rounded-xl shadow-[0_0_20px_rgba(245,158,11,0.4)] transition-all flex items-center justify-center gap-2"
            >
              <span>{info.buttonText}</span>
              <ArrowRight className="w-4 h-4 shrink-0" />
            </Button>
            <Button
              onClick={onClose}
              variant="outline"
              className="w-full sm:w-auto border-zinc-800 bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 text-sm py-5 rounded-xl"
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
