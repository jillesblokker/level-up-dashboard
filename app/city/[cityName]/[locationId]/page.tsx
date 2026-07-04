"use client"

import { useParams, useSearchParams } from "next/navigation"
import { Suspense, useEffect, useState } from "react"
import { getCityData } from "@/lib/city-data"
import { HeaderSection } from "@/components/HeaderSection"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ChevronLeft, Users, Trophy, UserPlus, Coins, Shield, Sword, ShoppingBag, Plus, Minus, Info, Flame, Sparkles, Package } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/components/ui/use-toast"
import dynamic from 'next/dynamic'
import { useUser } from "@clerk/nextjs"
import { getCharacterStats, addToCharacterStat, fetchFreshCharacterStats } from "@/lib/character-stats-service"
import { addToKingdomInventory } from "@/lib/inventory-manager"
import { useGameStore } from "@/stores/game-store"
import { useCitizensStore } from "@/stores/citizensStore"
import { MARKETPLACE_CONSUMABLES } from "@/lib/shop-items"
import { spendGold } from "@/lib/gold-manager"
import { useRealmInventory } from "@/hooks/use-realm-inventory"
import { TileType } from "@/types/tiles"
import { PACK_TYPES, generatePack } from "@/lib/pack-generator"
import { PackOpeningModal } from "@/components/pack-opening-modal"
import { formatGold } from "@/lib/utils"
import { ShopItemCard } from "@/components/shop-item-card"
import {
  BLACKSMITH_WEAPONS, BLACKSMITH_SHIELDS, BLACKSMITH_ARMOR,
  STABLE_ITEMS, POTION_ITEMS, SCROLL_ITEMS, ARTIFACT_ITEMS, FOOD_ITEMS,
  type ShopItem,
} from "@/lib/shop-items"

function TavernBannerIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
    </svg>
  )
}

// Import Social Components dynamically to avoid initialization order issues
const AllianceDashboard = dynamic(() => import("@/components/alliance-dashboard"), { 
  ssr: false,
  loading: () => <div className="h-48 flex items-center justify-center text-amber-500/50 animate-pulse">Loading Alliance Data...</div>
})
const Leaderboard = dynamic(() => import("@/components/leaderboard"), { 
  ssr: false,
  loading: () => <div className="h-48 flex items-center justify-center text-amber-500/50 animate-pulse">Loading Leaderboards...</div>
})
const AlliesDashboard = dynamic(() => import("@/components/allies-dashboard"), { 
  ssr: false,
  loading: () => <div className="h-48 flex items-center justify-center text-amber-500/50 animate-pulse">Loading Allies...</div>
})

// Define available materials for trade
const MATERIALS = [
  { id: 'material-water', name: 'Water', icon: '💧', buyPrice: 200, sellPrice: 100, description: 'Essential for life and growth.' },
  { id: 'material-logs', name: 'Logs', icon: '🪵', buyPrice: 300, sellPrice: 150, description: 'Raw wood for construction.' },
  { id: 'material-stone', name: 'Stone', icon: '🪨', buyPrice: 400, sellPrice: 200, description: 'Heavy stone for foundations.' },
  { id: 'material-planks', name: 'Planks', icon: '🪚', buyPrice: 550, sellPrice: 275, description: 'Refined wood for structures.' },
  { id: 'material-stone-block', name: 'Blocks', icon: '🧱', buyPrice: 700, sellPrice: 350, description: 'Cut stone for walls.' },
  { id: 'material-steel', name: 'Steel', icon: '⚔️', buyPrice: 850, sellPrice: 425, description: 'Strong metal for reinforcements.' },
  { id: 'material-crystal', name: 'Crystal', icon: '🔮', buyPrice: 1000, sellPrice: 500, description: 'Rare magical resource.' },
]

const getCategoryColor = (category: string) => {
  const cat = category?.toLowerCase() || '';
  if (cat.includes('might') || cat.includes('strength')) return 'bg-red-950/40 text-red-400 border-red-900/30';
  if (cat.includes('knowledge') || cat.includes('intellect') || cat.includes('mind') || cat.includes('study')) return 'bg-blue-950/40 text-blue-400 border-blue-900/30';
  if (cat.includes('wellness') || cat.includes('spirit') || cat.includes('mental')) return 'bg-purple-950/40 text-purple-400 border-purple-900/30';
  if (cat.includes('vitality') || cat.includes('health') || cat.includes('body')) return 'bg-emerald-950/40 text-emerald-400 border-emerald-900/30';
  return 'bg-amber-950/40 text-amber-400 border-amber-900/30';
};

const getLogRewardStyle = (reward: string) => {
  const rev = reward.toLowerCase();
  if (rev.includes('gold')) {
    return 'bg-yellow-950/40 text-yellow-400 border-yellow-900/30';
  }
  if (rev.includes('gem')) {
    return 'bg-cyan-950/40 text-cyan-400 border-cyan-900/30';
  }
  if (rev.includes('potion') || rev.includes('health') || rev.includes('mana')) {
    return 'bg-emerald-950/40 text-emerald-400 border-emerald-900/30';
  }
  if (rev.includes('scroll') || rev.includes('book') || rev.includes('relic')) {
    return 'bg-purple-950/40 text-purple-400 border-purple-900/30';
  }
  return 'bg-amber-950/40 text-amber-400 border-amber-900/30';
};

const getPurseName = (level: number) => {
  if (level >= 60) return "Emperor's Vault";
  if (level >= 50) return "King's Treasury";
  if (level >= 40) return "Duke's Treasury";
  if (level >= 30) return "Count's Vault";
  if (level >= 20) return "Baron's Chest";
  if (level >= 10) return "Knight's Coffer";
  return "Squire's Purse";
};

function CityLocationPageInner() {
  const params = useParams()
  const searchParams = useSearchParams()
  const { user } = useUser()
  const initialTab = searchParams?.get('tab') || 'alliances'

  const cityName = params?.['cityName'] as string || ''
  const locationId = params?.['locationId'] as string || ''
  const isTavern = locationId === 'tavern' || locationId === 'dragons-rest'
  
  const [mounted, setMounted] = useState(false)
  const [activeTab, setActiveTab] = useState(initialTab)
  const [goldBalance, setGoldBalance] = useState(0)
  const [playerLevel, setPlayerLevel] = useState(1)
  const [tradeQuantities, setTradeQuantities] = useState<Record<string, number>>({})
  const [openingPack, setOpeningPack] = useState<any>(null)
  
  const [bounties, setBounties] = useState<any[]>([])
  const [bountiesLoading, setBountiesLoading] = useState(false)
  const [partnerLogs, setPartnerLogs] = useState<any[]>([])

  const activePartnerId = useGameStore(state => state.activePartnerId)
  const citizens = useCitizensStore(state => state.citizens)
  const activePartner = citizens.find(c => c.id === activePartnerId)

  // Fetch materials inventory
  const { inventoryAsItems, updateTileQuantity } = useRealmInventory(user?.id, true)

  useEffect(() => {
    setMounted(true)
    
    // Initial stats fetch
    const stats = getCharacterStats()
    setGoldBalance(stats.gold)
    if (stats.level) setPlayerLevel(stats.level)

    fetchFreshCharacterStats().then(fresh => {
      if (fresh) {
        setGoldBalance(fresh.gold)
        if (fresh.level) setPlayerLevel(fresh.level)
      }
    })

    const handleStatsUpdate = () => {
      const updated = getCharacterStats()
      setGoldBalance(updated.gold)
      if (updated.level) setPlayerLevel(updated.level)
    }
    window.addEventListener('character-stats-update', handleStatsUpdate)
    return () => window.removeEventListener('character-stats-update', handleStatsUpdate)
  }, [user])

  useEffect(() => {
    const tabAtUrl = searchParams?.get('tab')
    if (tabAtUrl && tabAtUrl !== activeTab) {
      setActiveTab(tabAtUrl)
    }
  }, [searchParams, activeTab])

  // Fetch active bounties (Point 4)
  useEffect(() => {
    if (!isTavern || !user) return

    const fetchBounties = async () => {
      setBountiesLoading(true)
      try {
        const qRes = await fetch('/api/quests')
        let activeQuests: any[] = []
        if (qRes.ok) {
          const list = await qRes.json()
          if (Array.isArray(list)) {
            activeQuests = list
              .filter((q: any) => !q.completed)
              .map((q: any) => ({
                id: q.id,
                title: q.title || q.name,
                reward: (q.xp || 0) + (q.gold || 0),
                gold: q.gold || 0,
                xp: q.xp || 0,
                type: 'Quest',
                category: q.category || 'Might'
              }))
          }
        }

        const cRes = await fetch('/api/challenges')
        let activeChallenges: any[] = []
        if (cRes.ok) {
          const list = await cRes.json()
          if (Array.isArray(list)) {
            activeChallenges = list
              .filter((c: any) => !c.completed)
              .map((c: any) => ({
                id: c.id,
                title: c.title || c.name,
                reward: (c.xp_reward || 0) + (c.gold_reward || 0),
                gold: c.gold_reward || 0,
                xp: c.xp_reward || 0,
                type: 'Challenge',
                category: c.category || 'Expedition'
              }))
          }
        }

        const combined = [...activeQuests, ...activeChallenges]
          .sort((a, b) => b.reward - a.reward)
          .slice(0, 3)

        setBounties(combined)
      } catch (err) {
        console.error('Failed to fetch bounties:', err)
      } finally {
        setBountiesLoading(false)
      }
    }

    fetchBounties()
  }, [isTavern, user])

  // Partner scouting rewards (Point 9)
  useEffect(() => {
    if (!isTavern || !user || !activePartner) return

    const savedLogs = localStorage.getItem('partner_activity_logs')
    let logsList: any[] = []
    if (savedLogs) {
      try {
        logsList = JSON.parse(savedLogs)
      } catch (e) {
        console.error(e)
      }
    }

    const checkPartnerScouting = async () => {
      const now = Date.now()
      const lastCheck = localStorage.getItem('last_partner_scout_check')
      const cooldownMs = 15 * 60 * 1000 // 15 minutes cooldown

      if (lastCheck && now - parseInt(lastCheck) < cooldownMs) {
        setPartnerLogs(logsList)
        return
      }

      // Record check attempt
      localStorage.setItem('last_partner_scout_check', now.toString())

      // 50% chance to find something
      if (Math.random() < 0.5) {
        const pName = activePartner.name || 'Your Partner'
        const rewardType = Math.floor(Math.random() * 3)
        let logText = ""
        let rewardDetail = ""

        if (rewardType === 0) {
          const amount = Math.floor(Math.random() * 50) + 20
          addToCharacterStat('gold', amount, 'partner-passive-gold')
          logText = `${pName} scouted the Whispering Woods and found a hidden pouch containing ${amount} Gold!`
          rewardDetail = `+${amount} Gold`
          window.dispatchEvent(new Event('character-stats-update'))
        } else if (rewardType === 1) {
          const amount = Math.floor(Math.random() * 3) + 1
          addToCharacterStat('gems', amount, 'partner-passive-gems')
          logText = `${pName} explored the deep tunnels of the Crystal Caverns and mined ${amount} rare Gems!`
          rewardDetail = `+${amount} Gems`
          window.dispatchEvent(new Event('character-stats-update'))
        } else {
          if (MARKETPLACE_CONSUMABLES && MARKETPLACE_CONSUMABLES.length > 0) {
            const randomItem = MARKETPLACE_CONSUMABLES[Math.floor(Math.random() * MARKETPLACE_CONSUMABLES.length)]
            if (randomItem) {
              addToKingdomInventory(user.id, {
                id: randomItem.id,
                name: randomItem.name,
                description: randomItem.description,
                type: randomItem.isEquippable ? 'equipment' : 'item',
                category: randomItem.category || 'item',
                quantity: 1,
                image: randomItem.image,
                emoji: randomItem.emoji,
                stats: randomItem.stats || {}
              })
              logText = `${pName} encountered a friendly merchant and traded for a ${randomItem.name}!`
              rewardDetail = `+1 ${randomItem.name}`
              window.dispatchEvent(new Event('character-inventory-update'))
            }
          }
        }

        if (logText) {
          const newLog = {
            id: `partner-log-${Date.now()}`,
            text: logText,
            reward: rewardDetail,
            timestamp: now
          }
          logsList = [newLog, ...logsList].slice(0, 5)
          localStorage.setItem('partner_activity_logs', JSON.stringify(logsList))
          
          toast({
            title: `🐾 ${pName} Scouted a Reward!`,
            description: logText,
          })
        }
      }

      setPartnerLogs(logsList)
    }

    checkPartnerScouting()
  }, [isTavern, user, activePartner])

  if (!mounted || !params) {
    return (
      <div className="flex min-h-screen bg-black items-center justify-center">
        <div className="text-amber-500 animate-pulse font-medieval tracking-widest uppercase">Approaching the City Gates...</div>
      </div>
    )
  }

  const cityData = getCityData(cityName)
  const location = cityData?.locations.find(l => l.id === locationId)

  if (!cityData || !location) {
    return (
      <div className="p-20 text-center text-white bg-black min-h-screen flex flex-col items-center justify-center">
        <h1 className="text-3xl font-medieval mb-6 text-amber-950/80 italic">The mists obscure this path... {locationId}</h1>
        <Link href="/realm">
          <Button variant="outline" className="border-amber-800/40 text-amber-500 hover:bg-amber-950/20">
            Return to Map
          </Button>
        </Link>
      </div>
    )
  }

  // Shop items are now sourced from the centralized shop-items module
  // which pulls from comprehensive-items.ts (the single source of truth)

  // Helpers for resource quantity tracking
  const getInventoryQuantity = (materialId: string) => {
    const item = inventoryAsItems.find(i => i.id === materialId || i.id === materialId.replace('material-', ''))
    if (!item) {
      const byType = inventoryAsItems.find(i => i.type === materialId as any);
      return byType?.quantity || 0;
    }
    return item ? (item.quantity || 0) : 0
  }

  const handleQuantityChange = (id: string, value: number) => {
    setTradeQuantities(prev => ({
      ...prev,
      [id]: Math.max(0, value)
    }))
  }

  // Handle shop item purchase (works with ShopItem from comprehensive-items)
  const handleItemPurchase = async (item: ShopItem) => {
    if (goldBalance < item.cost) {
      toast({
        title: "Insufficient Gold",
        description: `You need ${item.cost} gold to purchase this item.`,
        variant: "destructive"
      })
      return
    }

    const success = await spendGold(item.cost, `purchase-${item.id}`);
    if (success) {
      if (user?.id) {
        addToKingdomInventory(user.id, {
          id: item.id,
          name: item.name,
          description: item.description,
          type: item.isEquippable ? 'equipment' : 'item',
          category: item.category || 'item',
          quantity: 1,
          image: item.image,
          emoji: item.emoji,
          stats: item.stats || {}
        })
      }
      setGoldBalance(prev => prev - item.cost)
      toast({
        title: "Purchase Successful",
        description: `Bought 1x ${item.name} for ${item.cost} gold. Item added to your inventory!`,
      })
      window.dispatchEvent(new Event('character-inventory-update'))
      window.dispatchEvent(new Event('character-stats-update'))
    }
  }

  // Materials trading flows
  const handleBuyMaterial = async (material: typeof MATERIALS[0]) => {
    const qty = tradeQuantities[material.id] || 1
    const totalCost = qty * material.buyPrice

    if (qty <= 0) return

    if (goldBalance < totalCost) {
      toast({
        title: "Insufficient Gold",
        description: `You need ${totalCost} gold for this purchase.`,
        variant: "destructive"
      })
      return
    }

    // Process transaction
    addToCharacterStat('gold', -totalCost, 'market-buy-material')
    updateTileQuantity(material.id as TileType, qty)
    setGoldBalance(prev => prev - totalCost)

    toast({
      title: "Purchase Successful",
      description: `Bought ${qty} ${material.name} for ${totalCost} gold.`
    })
    setTradeQuantities(prev => ({ ...prev, [material.id]: 0 }))
    window.dispatchEvent(new Event('character-stats-update'))
  }

  const handleSellMaterial = async (material: typeof MATERIALS[0]) => {
    const qty = tradeQuantities[material.id] || 1
    const totalValue = qty * material.sellPrice
    const currentOwned = getInventoryQuantity(material.id)

    if (qty <= 0) return

    if (currentOwned < qty) {
      toast({
        title: "Insufficient Materials",
        description: `You only have ${currentOwned} ${material.name}.`,
        variant: "destructive"
      })
      return
    }

    // Process transaction
    updateTileQuantity(material.id as TileType, -qty)
    addToCharacterStat('gold', totalValue, 'market-sell-material')
    setGoldBalance(prev => prev + totalValue)

    toast({
      title: "Sale Successful",
      description: `Sold ${qty} ${material.name} for ${totalValue} gold.`
    })
    setTradeQuantities(prev => ({ ...prev, [material.id]: 0 }))
    window.dispatchEvent(new Event('character-stats-update'))
  }

  // Pack buying flow
  const handleBuyPack = (packType: typeof PACK_TYPES[0]) => {
    if (goldBalance < packType.price) {
      toast({
        title: "Insufficient Gold",
        description: `You need ${packType.price} gold to buy this pack.`,
        variant: "destructive"
      })
      return
    }

    // Deduct gold
    addToCharacterStat('gold', -packType.price, `market-buy-${packType.id}`)
    setGoldBalance(prev => prev - packType.price)
    
    // Generate and open pack
    const pack = generatePack(packType.id)
    setOpeningPack(pack)
  }

  return (
    <div className="flex min-h-screen flex-col bg-black text-white">
      <HeaderSection
        title={location.name}
        subtitle={location.subtitle}
        imageSrc={location.image}
        shouldRevealImage={true}
        defaultBgColor="bg-amber-950"
      />

      <main className="flex-1 p-4 md:p-6 pb-24 lg:landscape:pb-8 max-w-6xl mx-auto w-full relative">
        <div className="flex items-center justify-between mb-8 relative z-10">
          <Link href={`/city/${cityName}`}>
            <Button variant="ghost" className="text-amber-500 hover:text-amber-400 font-medieval group">
              <ChevronLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
              Return to {cityData.name}
            </Button>
          </Link>

          {/* Current Gold HUD */}
          <div className="flex items-center gap-3 bg-zinc-950 border border-amber-900/50 p-2.5 px-4 rounded-xl shadow-lg ">
            <Coins className="h-5 w-5 text-amber-400 animate-pulse" />
            <div className="text-right">
              <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">{getPurseName(playerLevel)}</p>
              <p className="text-base font-serif font-bold text-amber-200" title={`${goldBalance.toLocaleString()} Gold`}>
                {formatGold(goldBalance)} <span className="text-xs text-amber-600">Gold</span>
              </p>
            </div>
          </div>
        </div>

        {isTavern ? (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* NOTICEBOARD & PARTNER REPORT GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {/* Bulletin Board Card */}
              <div className="border border-amber-900/30 bg-gradient-to-br from-amber-950/20 via-zinc-950 to-zinc-900/80 rounded-3xl p-6 relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 p-6 text-amber-500/5 pointer-events-none">
                  <Sword className="w-32 h-32" />
                </div>
                <h3 className="text-xl font-serif text-amber-400 mb-1 flex items-center gap-2">
                  📌 Tavern Bulletin Board
                </h3>
                <p className="text-xs text-zinc-400 mb-4 font-serif">
                  The highest-reward active bounties currently posted in the realm:
                </p>
                
                {bountiesLoading ? (
                  <div className="h-24 flex items-center justify-center text-xs text-amber-500/50 animate-pulse">
                    Reading bulletin board parchment...
                  </div>
                ) : bounties.length === 0 ? (
                  <div className="text-center py-6 bg-zinc-900/40 rounded-2xl border border-zinc-800/40">
                    <p className="text-xs text-zinc-400 italic">&ldquo;The noticeboard is empty. All active threats have been neutralized!&rdquo;</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {bounties.map((bounty) => (
                      <div key={bounty.id} className="bg-zinc-900/60 rounded-2xl p-3 border border-amber-900/20 flex flex-col justify-between">
                        <div className="flex items-center gap-1.5 flex-wrap mb-1">
                          <span className={`text-[8px] font-bold tracking-widest px-2 py-0.5 rounded-full border ${
                            bounty.type === 'Challenge' 
                              ? 'bg-purple-950/40 text-purple-400 border-purple-900/30' 
                              : 'bg-amber-950/40 text-amber-400 border-amber-900/30'
                          }`}>
                            {bounty.type.toUpperCase()}
                          </span>
                          <span className={`text-[8px] font-bold tracking-widest px-2 py-0.5 rounded-full border ${getCategoryColor(bounty.category)}`}>
                            {bounty.category.toUpperCase()}
                          </span>
                        </div>
                        <h4 className="text-xs font-serif font-bold text-amber-100 line-clamp-1 leading-snug">
                          {bounty.title}
                        </h4>
                        <div className="mt-2 pt-1.5 border-t border-zinc-850 flex items-center justify-between text-[10px]">
                          <span className="text-zinc-500 uppercase font-semibold tracking-wider">Reward Value</span>
                          <div className="flex items-center gap-2 font-mono">
                            {bounty.xp > 0 && <span className="text-blue-400">⭐ {bounty.xp}</span>}
                            {bounty.gold > 0 && <span className="text-yellow-500">🪙 {bounty.gold}</span>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Partner Scouting Reports Card */}
              <div className="border border-amber-900/30 bg-gradient-to-br from-zinc-950 to-zinc-900/80 rounded-3xl p-6 relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 p-6 text-amber-500/5 pointer-events-none font-serif text-8xl">
                  🐾
                </div>
                <h3 className="text-xl font-serif text-amber-400 mb-1 flex items-center gap-2">
                  🐾 Partner Scouting Report
                </h3>
                {activePartner ? (
                  <>
                    <p className="text-xs text-zinc-400 mb-4 font-serif">
                      Your active partner <strong>{activePartner.name}</strong> has been scouting the outer realms:
                    </p>

                    {partnerLogs.length === 0 ? (
                      <div className="text-center py-6 bg-zinc-900/40 rounded-2xl border border-zinc-800/40">
                        <p className="text-xs text-zinc-400 italic">&ldquo;{activePartner.name} has recently departed. Check back later for reports!&rdquo;</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {partnerLogs.slice(0, 3).map((log) => (
                          <div key={log.id} className="bg-zinc-900/40 p-3 rounded-2xl border border-zinc-800/60 flex items-center justify-between gap-3">
                            <div className="flex items-start gap-2.5 min-w-0">
                              <span className="text-base select-none mt-0.5 shrink-0">🐾</span>
                              <p className="text-[10px] text-zinc-300 font-serif leading-normal truncate">
                                {log.text}
                              </p>
                            </div>
                            <Badge className={`font-mono text-[9px] font-bold shrink-0 border ${getLogRewardStyle(log.reward)}`}>
                              {log.reward}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center text-center py-8 space-y-3 h-full">
                    <p className="text-xs text-zinc-400 italic font-serif">
                      No active partner is set to scout.
                    </p>
                    <Link href="/kingdom">
                      <Button size="sm" variant="outline" className="border-amber-900/40 text-amber-400 hover:bg-amber-950/20 text-[11px] font-bold">
                        Set Partner in Kingdom
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="w-full md:w-auto mb-12">
                <TabsTrigger value="alliances">
                  <Users className="w-4 h-4" />
                  Alliances
                </TabsTrigger>
                <TabsTrigger value="allies">
                  <UserPlus className="w-4 h-4" />
                  Ally Board
                </TabsTrigger>
                <TabsTrigger value="leaderboard">
                  <Trophy className="w-4 h-4" />
                  Legends
                </TabsTrigger>
              </TabsList>

              <TabsContent value="alliances" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
                <AllianceDashboard />
              </TabsContent>
              
              <TabsContent value="allies" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
                <AlliesDashboard />
              </TabsContent>
              
              <TabsContent value="leaderboard" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
                <Leaderboard />
              </TabsContent>
            </Tabs>
          </div>
        ) : locationId === 'marketplace' ? (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div className="border border-amber-900/10 bg-gradient-to-br from-zinc-950 to-zinc-900/50 rounded-3xl p-6 md:p-8 relative overflow-hidden mb-8 shadow-2xl">
              <div className="absolute top-0 right-0 p-8 text-amber-500/10 pointer-events-none">
                <ShoppingBag className="w-40 h-40" />
              </div>
              <h2 className="text-3xl font-serif text-amber-400 mb-2">Grand City Bazaar</h2>
              <p className="text-zinc-400 max-w-2xl font-serif">Trade construction supplies, purchase ancient magic relics, or try your luck with premium reward packs.</p>
            </div>

            <Tabs defaultValue="wares" className="w-full">
              <TabsList className="mb-6">
                <TabsTrigger value="wares">relics & wares</TabsTrigger>
                <TabsTrigger value="resources">resource trading</TabsTrigger>
                <TabsTrigger value="packs" className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  scratch packs
                </TabsTrigger>
              </TabsList>

              {/* TAB 1: Relics & Wares */}
              <TabsContent value="wares" className="mt-0 outline-none">
                <Tabs defaultValue="potions" className="w-full">
                  <TabsList className="mb-4">
                    <TabsTrigger value="potions">Potions</TabsTrigger>
                    <TabsTrigger value="scrolls">Scrolls</TabsTrigger>
                    <TabsTrigger value="artifacts">Artifacts</TabsTrigger>
                    <TabsTrigger value="food">Food</TabsTrigger>
                  </TabsList>
                  <TabsContent value="potions" className="mt-0 outline-none">
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                      {POTION_ITEMS.map((item) => (
                        <ShopItemCard
                          key={item.id}
                          item={item}
                          onPurchase={handleItemPurchase}
                          disabled={goldBalance < item.cost}
                          accentColor="amber"
                          actionLabel="Buy"
                        />
                      ))}
                    </div>
                  </TabsContent>
                  <TabsContent value="scrolls" className="mt-0 outline-none">
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                      {SCROLL_ITEMS.map((item) => (
                        <ShopItemCard
                          key={item.id}
                          item={item}
                          onPurchase={handleItemPurchase}
                          disabled={goldBalance < item.cost}
                          accentColor="purple"
                          actionLabel="Buy"
                        />
                      ))}
                    </div>
                  </TabsContent>
                  <TabsContent value="artifacts" className="mt-0 outline-none">
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                      {ARTIFACT_ITEMS.map((item) => (
                        <ShopItemCard
                          key={item.id}
                          item={item}
                          onPurchase={handleItemPurchase}
                          disabled={goldBalance < item.cost}
                          accentColor="purple"
                          actionLabel="Buy"
                        />
                      ))}
                    </div>
                  </TabsContent>
                  <TabsContent value="food" className="mt-0 outline-none">
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                      {FOOD_ITEMS.map((item) => (
                        <ShopItemCard
                          key={item.id}
                          item={item}
                          onPurchase={handleItemPurchase}
                          disabled={goldBalance < item.cost}
                          accentColor="emerald"
                          actionLabel="Buy"
                        />
                      ))}
                    </div>
                  </TabsContent>
                </Tabs>
              </TabsContent>

              {/* TAB 2: Resource Trading */}
              <TabsContent value="resources" className="mt-0 outline-none">
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {MATERIALS.map((material) => {
                    const owned = getInventoryQuantity(material.id)
                    const qty = tradeQuantities[material.id] || 0
                    const isQtyValid = qty > 0

                    return (
                      <Card key={material.id} className="border-amber-900/20 bg-zinc-950 flex flex-col shadow-lg">
                        <CardHeader className="p-4 pb-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-2xl">{material.icon}</span>
                              <CardTitle className="text-amber-200 text-base">{material.name}</CardTitle>
                            </div>
                            <Badge className="bg-amber-950/80 border-amber-900/50 text-amber-400 text-[10px] font-bold uppercase tracking-widest px-2.5">
                              Owned: {owned}
                            </Badge>
                          </div>
                          <CardDescription className="text-zinc-400 text-xs mt-1">{material.description}</CardDescription>
                        </CardHeader>
                        
                        <CardContent className="p-4 pt-2 flex-1 flex flex-col justify-end space-y-4">
                          <div className="flex items-center justify-between bg-zinc-950 border border-amber-900/10 p-2 rounded-xl">
                            <span className="text-xs text-zinc-500 font-bold uppercase tracking-wider pl-2">Quantity</span>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleQuantityChange(material.id, qty - 1)}
                                className="h-8 w-8 text-zinc-400 hover:text-white"
                              >
                                <Minus className="w-3.5 h-3.5" />
                              </Button>
                              <Input
                                type="number"
                                min="0"
                                value={qty || ""}
                                onChange={(e) => handleQuantityChange(material.id, parseInt(e.target.value) || 0)}
                                className="h-8 w-12 text-center bg-black border-amber-900/30 text-white p-0 text-sm font-bold [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                              />
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleQuantityChange(material.id, qty + 1)}
                                className="h-8 w-8 text-zinc-400 hover:text-white"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <Button
                              onClick={() => handleBuyMaterial(material)}
                              disabled={!isQtyValid || goldBalance < (qty * material.buyPrice)}
                              className="bg-amber-950 hover:bg-amber-900 text-amber-200 border border-amber-800/40 rounded-xl py-5 font-bold uppercase text-[11px] tracking-wider transition-all"
                            >
                              Buy ({qty * material.buyPrice}g)
                            </Button>
                            <Button
                              onClick={() => handleSellMaterial(material)}
                              disabled={!isQtyValid || owned < qty}
                              className="bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 rounded-xl py-5 font-bold uppercase text-[11px] tracking-wider transition-all"
                            >
                              Sell ({qty * material.sellPrice}g)
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              </TabsContent>

              {/* TAB 3: Scratch Cards */}
              <TabsContent value="packs" className="mt-0 outline-none">
                <div className="grid gap-6 sm:grid-cols-3">
                  {PACK_TYPES.map((pack) => (
                    <Card key={pack.id} className="border-amber-900/30 bg-gradient-to-b from-zinc-950/80 to-zinc-950/40 flex flex-col relative overflow-hidden shadow-2xl group">
                      <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-amber-500 to-amber-900 opacity-60" />
                      <CardHeader className="p-6 text-center">
                        <div className="w-14 h-14 bg-amber-950/50 border border-amber-900/30 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl text-amber-400 group-hover:scale-110 transition-transform duration-300 shadow-inner">
                          <Package className="w-6 h-6" />
                        </div>
                        <Badge className="bg-amber-950 text-amber-500 border border-amber-900/30 text-[9px] font-bold tracking-widest px-2 uppercase mb-2">
                          {pack.shortLabel}
                        </Badge>
                        <CardTitle className="text-amber-200 text-xl font-serif">{pack.title}</CardTitle>
                        <CardDescription className="text-zinc-500 text-xs mt-1">{pack.subtitle}</CardDescription>
                      </CardHeader>
                      
                      <CardContent className="px-6 pb-6 text-center flex-1">
                        <p className="text-zinc-400 text-xs leading-relaxed italic">{pack.description}</p>
                      </CardContent>

                      <CardFooter className="p-6 border-t border-amber-900/10 bg-zinc-950 flex flex-col gap-3">
                        <div className="flex items-center justify-center gap-1.5">
                          <Coins className="w-4 h-4 text-amber-400" />
                          <span className="font-serif font-bold text-amber-200 text-lg">{pack.price}</span>
                          <span className="text-zinc-500 text-xs uppercase tracking-wider font-bold">Gold</span>
                        </div>
                        <Button
                          onClick={() => handleBuyPack(pack)}
                          disabled={goldBalance < pack.price}
                          className="w-full bg-gradient-to-r from-amber-800 to-amber-950 text-amber-100 hover:from-amber-700 hover:to-amber-900 border border-amber-700/50 rounded-xl py-6 font-bold uppercase tracking-wider text-xs shadow-lg shadow-amber-950/20"
                        >
                          Purchase Pack
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        ) : locationId === 'embers-anvil' ? (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div className="border border-red-900/20 bg-gradient-to-br from-zinc-950 via-zinc-950 to-red-950/10 rounded-3xl p-6 md:p-8 relative overflow-hidden mb-8 shadow-2xl">
              <div className="absolute top-0 right-0 p-8 text-red-500/5 pointer-events-none">
                <Flame className="w-40 h-40 animate-pulse" />
              </div>
              <h2 className="text-3xl font-serif text-red-400 mb-2">Ember&apos;s Forge</h2>
              <p className="text-zinc-400 max-w-2xl font-serif">Equip your character with powerful swords, armor, and shields forged from dragonfire. Prepare for battles and expeditions in the dungeons.</p>
            </div>

            <Tabs defaultValue="weapons" className="w-full">
              <TabsList className="mb-6">
                <TabsTrigger value="weapons" className="flex items-center gap-1.5">
                  <Sword className="w-3.5 h-3.5" />
                  Weapons
                </TabsTrigger>
                <TabsTrigger value="shields" className="flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5" />
                  Shields
                </TabsTrigger>
                <TabsTrigger value="armor">
                  Armor
                </TabsTrigger>
              </TabsList>

              <TabsContent value="weapons" className="mt-0 outline-none">
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                  {BLACKSMITH_WEAPONS.map((item) => (
                    <ShopItemCard
                      key={item.id}
                      item={item}
                      onPurchase={handleItemPurchase}
                      disabled={goldBalance < item.cost}
                      accentColor="red"
                      actionLabel="Forge"
                    />
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="shields" className="mt-0 outline-none">
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                  {BLACKSMITH_SHIELDS.map((item) => (
                    <ShopItemCard
                      key={item.id}
                      item={item}
                      onPurchase={handleItemPurchase}
                      disabled={goldBalance < item.cost}
                      accentColor="blue"
                      actionLabel="Forge"
                    />
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="armor" className="mt-0 outline-none">
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                  {BLACKSMITH_ARMOR.map((item) => (
                    <ShopItemCard
                      key={item.id}
                      item={item}
                      onPurchase={handleItemPurchase}
                      disabled={goldBalance < item.cost}
                      accentColor="red"
                      actionLabel="Forge"
                    />
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        ) : locationId === 'royal-stables' ? (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div className="border border-amber-900/20 bg-gradient-to-br from-zinc-950 via-zinc-950 to-amber-950/10 rounded-3xl p-6 md:p-8 relative overflow-hidden mb-8 shadow-2xl">
              <h2 className="text-3xl font-serif text-amber-500 mb-2">Royal Stables</h2>
              <p className="text-zinc-400 max-w-2xl font-serif">Purchase majestic steeds and mounts to explore the realm. Stables offer mounts that increase your overland movement speed and stats.</p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
              {STABLE_ITEMS.map((item) => (
                <ShopItemCard
                  key={item.id}
                  item={item}
                  onPurchase={handleItemPurchase}
                  disabled={goldBalance < item.cost}
                  accentColor="amber"
                  actionLabel="Acquire"
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-20 border border-dashed border-amber-900/30 rounded-3xl bg-amber-950/5 text-center space-y-6">
            <div className="p-6 bg-amber-900/10 rounded-full">
              <TavernBannerIcon className="w-12 h-12 text-amber-900/40" />
            </div>
            <h2 className="text-3xl font-medieval text-amber-500">{location.name}</h2>
            <p className="text-zinc-500 max-w-sm font-serif leading-relaxed italic">
              {location.description}
            </p>
            <div className="pt-8 flex flex-col items-center gap-1">
              <span className="text-amber-500/30 font-medieval text-xs tracking-widest uppercase">The builders are hard at work</span>
              <div className="w-32 h-1 bg-amber-900/20 rounded-full overflow-hidden">
                <div className="h-full bg-amber-700/40 w-1/3 animate-pulse" />
              </div>
            </div>
          </div>
        )}
      </main>
      
      {/* Dynamic Pack Opening Overlay */}
      {openingPack && (
        <PackOpeningModal
          packData={openingPack}
          onClose={() => {
            setOpeningPack(null)
            // Trigger stats/inventory updates
            window.dispatchEvent(new Event('character-stats-update'))
            window.dispatchEvent(new Event('character-inventory-update'))
          }}
          onClaimed={() => {
            toast({
              title: "Card Claimed!",
              description: "It has been added to your Mythics collection."
            })
          }}
        />
      )}

      {/* Decorative side vignetting */}
      <div className="fixed inset-y-0 left-0 w-32 bg-gradient-to-r from-black/80 to-transparent pointer-events-none" />
      <div className="fixed inset-y-0 right-0 w-32 bg-gradient-to-l from-black/80 to-transparent pointer-events-none" />
    </div>
  )
}

export default function CityLocationPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen bg-black items-center justify-center">
        <div className="text-amber-500 animate-pulse font-medieval tracking-widest uppercase">Approaching the City Gates...</div>
      </div>
    }>
      <CityLocationPageInner />
    </Suspense>
  )
}
