"use client"

import { useState, useEffect } from "react"
import { ArrowLeft, Swords, Skull, Shield, Zap, Gem, Heart, FlaskConical } from "lucide-react"
import { getInventoryByType } from "@/lib/inventory-manager"
import { useUser, useAuth } from "@clerk/nextjs"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { toast } from "@/components/ui/use-toast"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { fetchFreshCharacterStats, updateCharacterStats } from "@/lib/character-stats-service"

interface DungeonState {
  id: string;
  current_hp: number;
  max_hp: number;
  current_room: number;
  max_rooms: number;
  status: 'in_progress' | 'completed' | 'defeated' | 'abandoned';
  current_encounter: {
    type: 'monster' | 'treasure';
    name: string;
    hp?: number;
    maxHp?: number;
  };
  loot_collected: any[];
}

export default function DungeonPage() {
  const [activeRun, setActiveRun] = useState<DungeonState | null>(null);
  const [loading, setLoading] = useState(false);
  const [log, setLog] = useState<string[]>([]);
  const [actionResult, setActionResult] = useState<any>(null); // { damageTaken: 5, lootFound: ... }
  const [goldBalance, setGoldBalance] = useState(0);
  const [potions, setPotions] = useState<any[]>([]);
  const { user } = useUser();
  const { getToken } = useAuth();

  const fetchPotions = async () => {
    if (!user?.id) return;
    try {
      const items = await getInventoryByType(user.id, 'potion');
      setPotions(items || []);
    } catch (e) {
      console.error("Failed to fetch potions", e);
    }
  };

  useEffect(() => {
    if (user?.id) fetchPotions();
  }, [user?.id]);

  useEffect(() => {
    // Force a sync of local stats to server to ensure gold balance is consistent
    updateCharacterStats({});

    // Fetch stats to display
    fetchFreshCharacterStats().then(s => s && setGoldBalance(s.gold));
  }, []);

  const startRun = async () => {
    setLoading(true);
    try {
      const token = await getToken();
      const res = await fetch('/api/dungeon', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ action: 'start' })
      });
      const data = await res.json();

      if (res.ok) {
        setActiveRun(data);
        setLog(["You entered the dungeon...", `Encountered: ${data.current_encounter.name}`]);
        // Update gold locally
        setGoldBalance(prev => prev - 50);
        updateCharacterStats({ gold: goldBalance - 50 }, 'dungeon-start');
      } else {
        toast({ title: "Failed to enter", description: data.error, variant: "destructive" });
      }
    } catch (e) {
      toast({ title: "Error", description: "Network error", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  const handleAction = async (choice: 'fight' | 'flee' | 'open' | 'use_item', itemId?: string) => {
    if (!activeRun) return;
    setLoading(true);
    setActionResult(null);

    try {
      const token = await getToken();
      const res = await fetch('/api/dungeon', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ action: 'play', runId: activeRun.id, choice, itemId })
      });
      const data = await res.json();

      if (res.ok) {
        setActiveRun(data);
        if (data.message) {
          setLog(prev => [data.message, ...prev].slice(0, 5));
        }
        if (data.actionResult) {
          setActionResult(data.actionResult);
        }

        // Refresh potions if used
        if (choice === 'use_item') {
          fetchPotions();
        }

        // If completed or died, refresh stats (gold might have changed)
        if (data.status !== 'in_progress') {
          fetchFreshCharacterStats().then(s => s && setGoldBalance(s.gold));
        }

      } else {
        toast({ title: "Action Failed", description: data.error, variant: "destructive" });
      }
    } catch (e) {
      toast({ title: "Error", description: "Network error", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">

      {/* HEADER */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-medieval text-red-600">The Dungeon</h1>
          <p className="text-gray-400">Brave the depths for gold and glory.</p>
        </div>
        <div className="flex items-center gap-4">
          <Badge variant="outline" className="text-yellow-500 border-yellow-500/50 px-3 py-1">
            {goldBalance} Gold
          </Badge>
          <Link href="/kingdom">
            <Button variant="outline" className="border-gray-800 hover:bg-gray-900">
              <ArrowLeft className="mr-2 h-4 w-4" /> Exit
            </Button>
          </Link>
        </div>
      </div>

      {/* START SCREEN */}
      {!activeRun && (
        <Card className="bg-gray-900 border-red-900/30 text-center py-12">
          <CardContent className="space-y-6">
            <div className="w-24 h-24 bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-red-900/50">
              <Skull className="w-12 h-12 text-red-500" />
            </div>
            <h2 className="text-2xl font-bold">Enter if you dare</h2>
            <p className="text-gray-400 max-w-md mx-auto">
              Monsters lurk in the shadows. Defeat them to claim the treasure.
              <br />Entry Cost: <span className="text-yellow-500 font-bold">50 Gold</span>
            </p>
            <Button
              size="lg"
              className="bg-red-700 hover:bg-red-800 text-white font-medieval text-lg px-8"
              onClick={startRun}
              disabled={loading || goldBalance < 50}
            >
              {loading ? "Preparing..." : "Enter Dungeon"}
            </Button>
            {goldBalance < 50 && <p className="text-red-500 text-sm">Not enough gold.</p>}
          </CardContent>
        </Card>
      )}

      {/* GAMEPLAY SCREEN */}
      {activeRun && activeRun.status === 'in_progress' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* MAIN ENCOUNTER */}
          <Card className="md:col-span-2 bg-gray-900 border-red-900/30 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />

            <CardHeader className="relative z-10 flex flex-row items-center justify-between">
              <div>
                <Badge className="bg-red-900/50 text-red-200 mb-2">Room {activeRun.current_room} / {activeRun.max_rooms}</Badge>
                <CardTitle className="text-2xl text-red-500">{activeRun.current_encounter.name}</CardTitle>
              </div>
            </CardHeader>

            <CardContent className="relative z-10 space-y-8 min-h-[300px] flex flex-col justify-end">

              {/* VISUALS */}
              <div className="flex justify-center py-8">
                <div className={`w-32 h-32 rounded-lg flex items-center justify-center text-6xl shadow-[0_0_50px_rgba(255,0,0,0.2)] animate-pulse
                        ${activeRun.current_encounter.type === 'monster' ? 'bg-red-950/50 text-red-500' : 'bg-yellow-950/50 text-yellow-500'}
                      `}>
                  {activeRun.current_encounter.type === 'monster' ? '👹' : '💎'}
                </div>
              </div>

              {/* ENCOUNTER HP (If monster) */}
              {activeRun.current_encounter.type === 'monster' && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Enemy Health</span>
                    <span>{activeRun.current_encounter.hp} / {activeRun.current_encounter.maxHp}</span>
                  </div>
                  <Progress value={(activeRun.current_encounter.hp! / activeRun.current_encounter.maxHp!) * 100} className="h-2 bg-red-950" indicatorClassName="bg-red-600" />
                </div>
              )}

              {/* LOG */}
              <div className="bg-black/50 p-4 rounded-lg font-mono text-sm h-32 overflow-y-auto border border-gray-800">
                {log.map((line, i) => (
                  <p key={i} className={i === 0 ? "text-white font-bold" : "text-gray-500"}>&gt; {line}</p>
                ))}
              </div>

            </CardContent>

            <CardFooter className="relative z-10 gap-4 bg-gray-950/50 p-4 border-t border-gray-800">
              {activeRun.current_encounter.type === 'monster' ? (
                <>
                  <Button className="flex-1 bg-red-600 hover:bg-red-700 h-12 text-lg" onClick={() => handleAction('fight')} disabled={loading}>
                    <Swords className="mr-2" /> Attack
                  </Button>
                  <Button className="flex-1 bg-gray-700 hover:bg-gray-600 h-12" variant="outline" onClick={() => handleAction('flee')} disabled={loading}>
                    <Zap className="mr-2" /> Flee
                  </Button>
                </>
              ) : (
                <Button className="w-full bg-yellow-600 hover:bg-yellow-700 h-12 text-lg text-black font-bold" onClick={() => handleAction('open')} disabled={loading}>
                  <Gem className="mr-2" /> Open Chest
                </Button>
              )}
            </CardFooter>

            {/* DAMAGE NUMBER POPUP */}
            {actionResult && actionResult.damageTaken > 0 && (
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-12 text-4xl font-bold text-red-500 animate-bounce">
                -{actionResult.damageTaken} HP
              </div>
            )}
          </Card>

          {/* PLAYER STATS SIDEBAR */}
          <div className="space-y-6">
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle>Your Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="flex items-center gap-2"><Heart className="w-4 h-4 text-red-500" /> Health</span>
                    <span>{activeRun.current_hp} / {activeRun.max_hp}</span>
                  </div>
                  <Progress value={(activeRun.current_hp / activeRun.max_hp) * 100} className="h-3 bg-gray-800" indicatorClassName="bg-green-600" />
                </div>

                {/* POTIONS */}
                <div className="pt-4 border-t border-gray-800">
                  <h4 className="text-sm font-bold text-gray-400 mb-2 flex items-center gap-2">
                    <FlaskConical className="w-4 h-4" /> Potions
                  </h4>
                  {potions.length === 0 ? (
                    <p className="text-xs text-gray-600">No potions available.</p>
                  ) : (
                    <div className="space-y-2">
                      {potions.map((potion) => (
                        <Button
                          key={potion.id}
                          size="sm"
                          variant="outline"
                          className="w-full justify-between border-gray-700 bg-gray-900/50 hover:bg-gray-800 h-8 text-xs"
                          onClick={() => handleAction('use_item', potion.id)}
                          disabled={loading || activeRun.current_hp >= activeRun.max_hp}
                        >
                          <span className="text-amber-500">{potion.name}</span>
                          <Badge variant="secondary" className="h-5 px-1.5 text-[10px] bg-gray-800">{potion.quantity}</Badge>
                        </Button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-gray-800">
                  <h4 className="text-sm font-bold text-gray-400 mb-2">Loot Found</h4>
                  {activeRun.loot_collected.length === 0 ? (
                    <p className="text-xs text-gray-600">Nothing yet...</p>
                  ) : (
                    <ul className="space-y-1">
                      {activeRun.loot_collected.map((item, i) => (
                        <li key={i} className="text-xs flex justify-between text-yellow-500">
                          <span>{item.name}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )
      }

      {/* END SCREEN */}
      {
        activeRun && activeRun.status !== 'in_progress' && (
          <Card className="bg-gray-900 border-gray-800 text-center py-12">
            <CardContent className="space-y-6">
              <div className="text-6xl mb-4">
                {activeRun.status === 'completed' ? '🏆' : '💀'}
              </div>
              <h2 className={`text-4xl font-medieval ${activeRun.status === 'completed' ? 'text-yellow-500' : 'text-red-600'}`}>
                {activeRun.status === 'completed' ? 'VICTORY' : 'DEFEATED'}
              </h2>

              <div className="bg-black/30 p-6 rounded-lg max-w-sm mx-auto border border-gray-700">
                <h3 className="font-bold text-gray-300 mb-4">Rewards Collected</h3>
                {activeRun.loot_collected.length === 0 ? (
                  <p className="text-gray-500 italic">No loot recovered.</p>
                ) : (
                  <ul className="space-y-2">
                    {activeRun.loot_collected.map((item, i) => (
                      <li key={i} className="text-yellow-400 font-bold flex justify-between">
                        <span>{item.name}</span>
                      </li>
                    ))}
                    <li className="border-t border-gray-700 pt-2 mt-2 flex justify-between font-bold text-white">
                      <span>Total Value</span>
                      <span>{activeRun.loot_collected.reduce((acc, i) => acc + (i.amount || 0), 0)} G</span>
                    </li>
                  </ul>
                )}
              </div>

              <Button size="lg" onClick={() => setActiveRun(null)} className="w-[200px]">
                Return to Entrance
              </Button>
            </CardContent>
          </Card>
        )
      }

    </div >
  )
}
