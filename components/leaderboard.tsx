"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Crown, Trophy, Coins, Flame, Medal, Scroll } from "lucide-react"
import { cn } from "@/lib/utils"
import { useUser } from "@clerk/nextjs"

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
      case "quests_monthly_individual": return <Scroll className="h-5 w-5 text-blue-500" />;
      case "quests_monthly_alliance": return <Trophy className="h-5 w-5 text-purple-500" />;
      default: return <Trophy className="h-5 w-5 text-amber-500" />;
    }
  };

  const getDescription = () => {
    switch (category) {
      case "gold": return "Wealthiest Lords & Ladies";
      case "streak": return "Most Consistent Allies";
      case "quests_monthly_individual": return "Heroes of the Month";
      case "quests_monthly_alliance": return "Dominant Alliances (Monthly)";
      default: return "Most Legendary Heroes";
    }
  };

  return (
    <Card className="w-full bg-black/40 border-amber-900/50 text-amber-100">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl flex items-center gap-2">
              <Crown className="h-6 w-6 text-yellow-500" />
              Realm Leaderboard
            </CardTitle>
            <CardDescription className="text-amber-400/60">
              {getDescription()}
            </CardDescription>
          </div>
          {getIcon()}
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="experience" className="w-full" onValueChange={setCategory}>
          <TabsList className="grid w-full grid-cols-5 bg-black/60 border border-amber-900/30">
            <TabsTrigger value="experience" className="text-xs sm:text-sm px-1">XP</TabsTrigger>
            <TabsTrigger value="gold" className="text-xs sm:text-sm px-1">Gold</TabsTrigger>
            <TabsTrigger value="streak" className="text-xs sm:text-sm px-1">Streaks</TabsTrigger>
            <TabsTrigger value="quests_monthly_individual" className="text-xs sm:text-sm px-1">Ind. Quests</TabsTrigger>
            <TabsTrigger value="quests_monthly_alliance" className="text-xs sm:text-sm px-1">Ally Quests</TabsTrigger>
          </TabsList>

          <div className="mt-4 min-h-[300px]">
            {loading ? (
              <div className="flex h-[200px] items-center justify-center text-amber-500/50">
                Loading Royal Archives...
              </div>
            ) : entries.length === 0 ? (
              <div className="flex h-[200px] items-center justify-center text-amber-500/50">
                No legends found yet.
              </div>
            ) : (
              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-2">
                  {entries.map((entry) => (
                    <div
                      key={`${entry.userId}-${entry.rank}`}
                      className={cn(
                        "flex items-center justify-between p-3 rounded-lg border transition-colors",
                        entry.userId === user?.id
                          ? "bg-amber-900/30 border-amber-500/50"
                          : "bg-black/20 border-white/5 hover:bg-white/5"
                      )}
                    >
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "flex items-center justify-center w-8 h-8 rounded-full font-bold font-mono",
                          entry.rank === 1 ? "bg-yellow-500 text-black" :
                            entry.rank === 2 ? "bg-gray-400 text-black" :
                              entry.rank === 3 ? "bg-amber-700 text-amber-100" :
                                "bg-white/10 text-gray-400"
                        )}>
                          {entry.rank}
                        </div>
                        <div>
                          <div className="font-semibold text-sm flex items-center gap-2">
                            {entry.displayName}
                            {entry.userId === user?.id && (
                              <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded uppercase">You</span>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Level {entry.level} • {entry.title}
                          </div>
                        </div>
                      </div>
                      <div className="font-mono font-bold text-amber-200">
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
