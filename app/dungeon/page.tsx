"use client"

import { useState, useEffect } from "react"
import { ArrowLeft, Swords, Skull, Shield, Zap, Gem, Heart, FlaskConical } from "lucide-react"
import { getInventoryByType } from "@/lib/inventory-manager"
import { useUser } from "@clerk/nextjs"
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
  const [potions, setPotions] = useState<any[]>([]);
  const { user } = useUser();

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
  }, []);

  const startRun = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/dungeon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ action: 'start' })
      });
      const data = await res.json();

      if (res.ok) {
        setActiveRun(data);
        setLog(["You entered the dungeon...", `Encountered: ${data.current_encounter.name}`]);
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
      const res = await fetch('/api/dungeon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
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
          fetchFreshCharacterStats();
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

  if (!activeRun) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-black/95">
        <div className="w-full max-w-md relative">
          {/* Background Glow */}
          <div className="absolute inset-0 bg-red-500/10 blur-[100px] pointer-events-none" />

          <Card className="relative bg-zinc-950 border-zinc-900 text-zinc-100 overflow-hidden shadow-2xl">
            {/* Inner Card Glow */}
            <div className="absolute inset-0 bg-gradient-to-b from-red-500/5 to-transparent pointer-events-none" />

            <CardContent className="relative z-10 p-8 flex flex-col items-center text-center space-y-8">

              {/* Header Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-zinc-900 border border-red-500/30 text-red-400 text-xs font-bold uppercase tracking-widest shadow-lg shadow-red-900/20">
                <Skull className="w-3 h-3" />
                Dungeon
              </div>

              {/* Title & Description */}
              <div className="space-y-4">
                <h1 className="text-4xl font-serif text-white tracking-tight">
                  Enter if you dare
                </h1>
                <p className="text-zinc-400 leading-relaxed max-w-[280px] mx-auto">
                  Monsters lurk in the shadows. Defeat them to claim the treasure.
                </p>
                <div className="text-sm font-medium text-amber-500">
                  Entry Cost: <span className="text-amber-400 font-bold">50 Gold</span>
                </div>
              </div>

              {/* Central Visual */}
              <div className="relative py-4">
                <div className="relative group">
                  {/* Pulsing Outer Glow */}
                  <div className="absolute inset-0 rounded-full blur-3xl animate-pulse scale-150 opacity-20 bg-red-500" />

                  {/* Rotating Decorative Border */}
                  <div className="absolute -inset-6 border border-dashed border-red-500/30 rounded-full animate-[spin_10s_linear_infinite]" />
                  <div className="absolute -inset-6 border border-dashed border-red-500/30 rounded-full animate-[spin_15s_linear_infinite_reverse] opacity-50" />

                  {/* Main Icon Container */}
                  <div className="relative w-32 h-32 rounded-full border-4 border-zinc-900 shadow-2xl overflow-hidden bg-zinc-900 flex items-center justify-center ring-1 ring-red-500/20">
                    <div className="absolute inset-0 bg-gradient-to-t from-red-900/40 via-transparent to-transparent" />
                    <Skull className="w-16 h-16 text-red-500 drop-shadow-lg" />
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="w-full space-y-3 pt-4">
                <Button
                  size="lg"
                  className="w-full h-14 text-lg font-medium tracking-wide bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-900/20 rounded-xl transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]"
                  onClick={startRun}
                  disabled={loading}
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" />
                      Entering...
                    </span>
                  ) : (
                    "Enter Dungeon"
                  )}
                </Button>

                <Link href="/kingdom" className="block w-full">
                  <Button
                    variant="ghost"
                    className="w-full h-12 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/50 rounded-xl transition-colors"
                  >
                    Return to Kingdom
                  </Button>
                </Link>
              </div>

            </CardContent>
          </Card>
        </div>
      </div>
    )
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
          <Link href="/kingdom">
            <Button variant="outline" className="border-gray-800 hover:bg-gray-900">
              <ArrowLeft className="mr-2 h-4 w-4" /> Exit
            </Button>
          </Link>
        </div>
      </div>

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
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="w-full max-w-md relative animate-in fade-in zoom-in duration-300">
              {/* Background Glow */}
              <div className={`absolute inset-0 blur-[100px] pointer-events-none ${activeRun.status === 'completed' ? 'bg-amber-500/20' : 'bg-red-500/20'}`} />

              <Card className="relative bg-zinc-950 border-zinc-900 text-zinc-100 overflow-hidden shadow-2xl">
                <CardContent className="relative z-10 p-8 flex flex-col items-center text-center space-y-6">

                  {/* Status Icon */}
                  <div className="relative group">
                    <div className={`absolute inset-0 rounded-full blur-3xl animate-pulse scale-150 opacity-20 ${activeRun.status === 'completed' ? 'bg-amber-500' : 'bg-red-500'}`} />
                    <div className={`relative w-24 h-24 rounded-full border-4 shadow-xl flex items-center justify-center text-5xl bg-zinc-900 ${activeRun.status === 'completed' ? 'border-amber-500/30 text-amber-500' : 'border-red-500/30 text-red-500'}`}>
                      {activeRun.status === 'completed' ? '🏆' : '💀'}
                    </div>
                  </div>

                  {/* Title */}
                  <div className="space-y-2">
                    <h2 className={`text-4xl font-serif tracking-tight ${activeRun.status === 'completed' ? 'text-amber-400' : 'text-red-500'}`}>
                      {activeRun.status === 'completed' ? 'Victory!' : 'Defeated'}
                    </h2>
                    <p className="text-zinc-400">
                      {activeRun.status === 'completed' ? 'You have conquered the depths.' : 'Your journey ends here.'}
                    </p>
                  </div>

                  {/* Rewards Panel */}
                  <div className="w-full bg-zinc-900/50 rounded-xl border border-zinc-800 p-4">
                    <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-widest mb-3">Rewards Recovered</h3>

                    {!activeRun.loot_collected || activeRun.loot_collected.length === 0 ? (
                      <p className="text-zinc-600 text-sm italic py-2">No loot recovered.</p>
                    ) : (
                      <div className="space-y-2">
                        {activeRun.loot_collected.map((item, i) => (
                          <div key={i} className="flex justify-between items-center text-sm">
                            <span className="text-zinc-300">{item.name}</span>
                            {item.amount && <span className="text-amber-400 font-mono">+{item.amount} G</span>}
                          </div>
                        ))}
                        <div className="border-t border-zinc-800 mt-2 pt-2 flex justify-between items-center font-bold text-white">
                          <span>Total Value</span>
                          <span className="text-amber-400">{activeRun.loot_collected.reduce((acc, i) => acc + (i.amount || 0), 0)} G</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Action */}
                  <Button
                    size="lg"
                    onClick={() => setActiveRun(null)}
                    className={`w-full h-12 text-lg font-medium tracking-wide text-white shadow-lg transition-all duration-300 rounded-xl ${activeRun.status === 'completed' ? 'bg-amber-600 hover:bg-amber-500 shadow-amber-900/20' : 'bg-red-600 hover:bg-red-500 shadow-red-900/20'}`}
                  >
                    Return to Entrance
                  </Button>

                </CardContent>
              </Card>
            </div>
          </div>
        )
      }

    </div >
  )
}
