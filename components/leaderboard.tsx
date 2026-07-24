"use client"

import { logger } from "@/lib/logger";

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Crown, Trophy, Coins, Flame, Medal, Scroll, Hammer } from "lucide-react"
import { cn } from "@/lib/utils"
import { useUser } from "@clerk/nextjs"
import { TEXT_CONTENT } from "@/lib/text-content"

const getMilestoneTitleName = (level: number) => {
  if (level >= 100) return "Emperor";
  if (level >= 90) return "Prince";
  if (level >= 80) return "Archduke";
  if (level >= 70) return "Grand Duke";
  if (level >= 60) return "Duke";
  if (level >= 50) return "Marquess";
  if (level >= 40) return "Count";
  if (level >= 30) return "Viscount";
  if (level >= 20) return "Baron";
  if (level >= 10) return "Knight";
  return "Squire";
};

interface LeaderboardEntry {
  rank: number;
  userId: string;
  displayName: string;
  title: string;
  level: number;
  value: number;
  formattedValue: string;
}

export function Leaderboard() {
  const { user } = useUser();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("experience");
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/leaderboard?sortBy=${category}&limit=50`);
        const data = await res.json();
        if (data.success) {
          setEntries(data.data);
        }
      } catch (error) {
        logger.error("Failed to fetch leaderboard", error);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, [category]);

  const displayedEntries = showAll ? entries : entries.slice(0, 5);
  const emptySlotsCount = Math.max(0, 5 - entries.length);

  const getIcon = () => {
    switch (category) {
      case "gold": return <Coins className="h-5 w-5 text-yellow-500" />;
      case "streak": return <Flame className="h-5 w-5 text-orange-500" />;
      case "tiles": return <Hammer className="h-5 w-5 text-emerald-500" />;
      case "quests_monthly_individual": return <Scroll className="h-5 w-5 text-blue-500" />;
      case "quests_monthly_alliance": return <Trophy className="h-5 w-5 text-purple-500" />;
      default: return <Trophy className="h-5 w-5 text-amber-500" />;
    }
  };

  const getDescription = () => {
    switch (category) {
      case "gold": return TEXT_CONTENT.leaderboard.descriptions.gold;
      case "streak": return TEXT_CONTENT.leaderboard.descriptions.streak;
      case "tiles": return TEXT_CONTENT.leaderboard.descriptions.tiles;
      case "quests_monthly_individual": return TEXT_CONTENT.leaderboard.descriptions.quests;
      case "quests_monthly_alliance": return TEXT_CONTENT.leaderboard.descriptions.allies;
      default: return TEXT_CONTENT.leaderboard.descriptions.xp;
    }
  };

  return (
    <Card className="w-full bg-zinc-950 border-amber-900/50 text-amber-100 flex flex-col h-full min-h-[500px]">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl flex items-center gap-2 font-medieval">
              <Crown className="h-6 w-6 text-yellow-500" />
              {TEXT_CONTENT.leaderboard.title}
            </CardTitle>
            <CardDescription className="text-amber-400/60">
              {getDescription()}
            </CardDescription>
          </div>
          {getIcon()}
        </div>
      </CardHeader>
      <CardContent className="flex-grow flex flex-col">
        <Tabs defaultValue="experience" className="w-full flex-grow flex flex-col" onValueChange={setCategory}>
          <TabsList className="flex w-full overflow-x-auto justify-start bg-zinc-950 border border-amber-900/30 p-1 md:grid md:grid-cols-6 scrollbar-thin scrollbar-thumb-amber-950">
            <TabsTrigger value="experience" className="flex-shrink-0 text-[10px] sm:text-xs px-3 py-1.5 md:px-1">{TEXT_CONTENT.leaderboard.tabs.xp}</TabsTrigger>
            <TabsTrigger value="gold" className="flex-shrink-0 text-[10px] sm:text-xs px-3 py-1.5 md:px-1">{TEXT_CONTENT.leaderboard.tabs.gold}</TabsTrigger>
            <TabsTrigger value="tiles" className="flex-shrink-0 text-[10px] sm:text-xs px-3 py-1.5 md:px-1 whitespace-nowrap">{TEXT_CONTENT.leaderboard.tabs.tiles}</TabsTrigger>
            <TabsTrigger value="streak" className="flex-shrink-0 text-[10px] sm:text-xs px-3 py-1.5 md:px-1">{TEXT_CONTENT.leaderboard.tabs.streak}</TabsTrigger>
            <TabsTrigger value="quests_monthly_individual" className="flex-shrink-0 text-[10px] sm:text-xs px-3 py-1.5 md:px-1 whitespace-nowrap">{TEXT_CONTENT.leaderboard.tabs.quests}</TabsTrigger>
            <TabsTrigger value="quests_monthly_alliance" className="flex-shrink-0 text-[10px] sm:text-xs px-3 py-1.5 md:px-1 whitespace-nowrap">{TEXT_CONTENT.leaderboard.tabs.allies}</TabsTrigger>
          </TabsList>

          <div className="mt-4 flex-grow relative min-h-[300px] flex flex-col justify-between">
            {loading ? (
              <div className="flex flex-col items-center justify-center text-amber-500/50 space-y-3 py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
                <p className="text-sm animate-pulse">{TEXT_CONTENT.leaderboard.loading}</p>
              </div>
            ) : entries.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-amber-500/40 space-y-4 py-12">
                <Trophy className="h-16 w-16 opacity-20" />
                <div className="text-center">
                  <p className="font-semibold text-lg">{TEXT_CONTENT.leaderboard.empty.title}</p>
                  <p className="text-sm max-w-[200px] mx-auto opacity-70">{TEXT_CONTENT.leaderboard.empty.subtitle}</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <ScrollArea className={cn("pr-2 transition-all duration-300", showAll ? "h-[500px]" : "h-auto")}>
                  <div className="space-y-2">
                    {displayedEntries.map((entry) => (
                      <div
                        key={`${entry.userId}-${entry.rank}`}
                        className={cn(
                          "flex items-center justify-between p-3 rounded-lg border transition-all duration-200",
                          entry.userId === user?.id
                            ? "bg-amber-900/30 border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.1)]"
                            : "bg-zinc-950 border-white/5 hover:bg-white/5 hover:border-amber-900/30"
                        )}
                      >
                        <div className="flex items-center gap-4">
                          <div className={cn(
                            "flex items-center justify-center w-8 h-8 rounded-full font-bold font-mono shadow-inner",
                            entry.rank === 1 ? "bg-gradient-to-br from-yellow-300 to-yellow-600 text-black border border-yellow-200" :
                              entry.rank === 2 ? "bg-gradient-to-br from-zinc-300 to-zinc-500 text-black border border-zinc-200" :
                                entry.rank === 3 ? "bg-gradient-to-br from-amber-600 to-amber-800 text-amber-100 border border-amber-500" :
                                  "bg-white/5 text-zinc-500 border border-white/5"
                          )}>
                            {entry.rank}
                          </div>
                          <div>
                            <div className="font-semibold text-sm flex items-center gap-2 text-amber-100/90">
                              {entry.displayName}
                              {entry.userId === user?.id && (
                                <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded border border-amber-500/20 uppercase tracking-wider font-bold">{TEXT_CONTENT.leaderboard.card.you}</span>
                              )}
                            </div>
                            <div className="text-xs text-amber-400/50 flex items-center gap-1.5">
                              <span>{TEXT_CONTENT.leaderboard.card.level.replace('{level}', entry.level.toString())}</span>
                              <span className="w-1 h-1 rounded-full bg-amber-900"></span>
                              <span>{getMilestoneTitleName(entry.level)}</span>
                            </div>
                          </div>
                        </div>
                        <div className="font-mono font-bold text-amber-200/90 bg-zinc-950 px-3 py-1 rounded border border-white/5 min-w-[80px] text-right">
                          {entry.formattedValue}
                        </div>
                      </div>
                    ))}

                    {/* Empty Slots Padding up to Top 5 if fewer entries */}
                    {!showAll && emptySlotsCount > 0 && Array.from({ length: emptySlotsCount }).map((_, idx) => {
                      const slotRank = entries.length + idx + 1;
                      return (
                        <div
                          key={`empty-slot-${slotRank}`}
                          className="flex items-center justify-between p-3 rounded-lg border border-dashed border-zinc-800/60 bg-zinc-950/40 text-zinc-600"
                        >
                          <div className="flex items-center gap-4">
                            <div className="flex items-center justify-center w-8 h-8 rounded-full font-bold font-mono bg-zinc-900 border border-zinc-800 text-zinc-600">
                              {slotRank}
                            </div>
                            <div>
                              <div className="font-semibold text-sm italic text-zinc-600">Open ranking slot</div>
                              <div className="text-xs text-zinc-700">Awaiting brave hero</div>
                            </div>
                          </div>
                          <div className="font-mono text-xs text-zinc-700 bg-zinc-900/50 px-3 py-1 rounded border border-zinc-800">
                            -
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>

                {entries.length > 5 && (
                  <div className="pt-2 text-center">
                    <button
                      onClick={() => setShowAll(!showAll)}
                      className="w-full py-2.5 px-4 rounded-xl bg-amber-950/40 hover:bg-amber-900/50 text-amber-300 font-bold text-xs border border-amber-500/30 transition-colors shadow-sm flex items-center justify-center gap-2"
                    >
                      {showAll ? "Show top 5" : `Show all (${entries.length} heroes)`}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </Tabs>
      </CardContent>
    </Card>
  )
}

export default Leaderboard;
