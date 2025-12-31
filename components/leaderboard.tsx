"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Crown, Trophy, Coins, Flame, Medal, Scroll, Hammer } from "lucide-react"
import { cn } from "@/lib/utils"
import { useUser } from "@clerk/nextjs"
import { TEXT_CONTENT } from "@/lib/text-content"

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

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/leaderboard?sortBy=${category}&limit=20`);
        const data = await res.json();
        if (data.success) {
          setEntries(data.data);
        }
      } catch (error) {
        console.error("Failed to fetch leaderboard", error);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, [category]);

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
    <Card className="w-full bg-black/40 border-amber-900/50 text-amber-100 flex flex-col h-full min-h-[500px]">
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
          <TabsList className="grid w-full grid-cols-6 bg-black/60 border border-amber-900/30">
            <TabsTrigger value="experience" className="text-[10px] sm:text-xs px-1">{TEXT_CONTENT.leaderboard.tabs.xp}</TabsTrigger>
            <TabsTrigger value="gold" className="text-[10px] sm:text-xs px-1">{TEXT_CONTENT.leaderboard.tabs.gold}</TabsTrigger>
            <TabsTrigger value="tiles" className="text-[10px] sm:text-xs px-1 whitespace-nowrap">{TEXT_CONTENT.leaderboard.tabs.tiles}</TabsTrigger>
            <TabsTrigger value="streak" className="text-[10px] sm:text-xs px-1">{TEXT_CONTENT.leaderboard.tabs.streak}</TabsTrigger>
            <TabsTrigger value="quests_monthly_individual" className="text-[10px] sm:text-xs px-1 whitespace-nowrap">{TEXT_CONTENT.leaderboard.tabs.quests}</TabsTrigger>
            <TabsTrigger value="quests_monthly_alliance" className="text-[10px] sm:text-xs px-1 whitespace-nowrap">{TEXT_CONTENT.leaderboard.tabs.allies}</TabsTrigger>
          </TabsList>

          <div className="mt-4 flex-grow relative min-h-[300px]">
            {loading ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-amber-500/50 space-y-3">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
                <p className="text-sm animate-pulse">{TEXT_CONTENT.leaderboard.loading}</p>
              </div>
            ) : entries.length === 0 ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-amber-500/40 space-y-4">
                <Trophy className="h-16 w-16 opacity-20" />
                <div className="text-center">
                  <p className="font-semibold text-lg">{TEXT_CONTENT.leaderboard.empty.title}</p>
                  <p className="text-sm max-w-[200px] mx-auto opacity-70">{TEXT_CONTENT.leaderboard.empty.subtitle}</p>
                </div>
              </div>
            ) : (
              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-2">
                  {entries.map((entry) => (
                    <div
                      key={`${entry.userId}-${entry.rank}`}
                      className={cn(
                        "flex items-center justify-between p-3 rounded-lg border transition-all duration-200",
                        entry.userId === user?.id
                          ? "bg-amber-900/30 border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.1)]"
                          : "bg-black/20 border-white/5 hover:bg-white/5 hover:border-amber-900/30"
                      )}
                    >
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "flex items-center justify-center w-8 h-8 rounded-full font-bold font-mono shadow-inner",
                          entry.rank === 1 ? "bg-gradient-to-br from-yellow-300 to-yellow-600 text-black border border-yellow-200" :
                            entry.rank === 2 ? "bg-gradient-to-br from-gray-300 to-gray-500 text-black border border-gray-200" :
                              entry.rank === 3 ? "bg-gradient-to-br from-amber-600 to-amber-800 text-amber-100 border border-amber-500" :
                                "bg-white/5 text-gray-500 border border-white/5"
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
                            <span>{entry.title}</span>
                          </div>
                        </div>
                      </div>
                      <div className="font-mono font-bold text-amber-200/90 bg-black/40 px-3 py-1 rounded border border-white/5 min-w-[80px] text-right">
                        {entry.formattedValue}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
        </Tabs>
      </CardContent>
    </Card>
  )
}
