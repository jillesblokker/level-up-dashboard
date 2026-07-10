"use client"

import { useState, useEffect, useMemo } from "react"
import { ArrowLeft, Coins, TrendingUp, TrendingDown, Package, ShoppingBag, Search, Gem, Dices } from "lucide-react"
import Link from "next/link"
import { getCharacterStats, addToCharacterStat, fetchFreshCharacterStats } from "@/lib/character-stats-service"
import { useUser } from "@clerk/nextjs"
import { useRealmInventory } from '@/hooks/use-realm-inventory'
import { Skeleton } from "@/components/ui/skeleton"
import { AnimatedNumber } from "@/components/ui/animated-number"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/components/ui/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TileType } from "@/types/tiles"
import { PACK_TYPES, FREE_PACK_TYPES, generatePack } from "@/lib/pack-generator"
import dynamic from 'next/dynamic'
const PackOpeningModal = dynamic(
  () => import('@/components/pack-opening-modal').then((mod) => mod.PackOpeningModal),
  { ssr: false }
)
import { formatGold, cn } from "@/lib/utils"

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

export default function MarketPage() {
  const { user } = useUser()
  const [goldBalance, setGoldBalance] = useState(0)
  const [gemBalance, setGemBalance] = useState(0)
  const { inventoryAsItems, updateTileQuantity } = useRealmInventory(user?.id, true)
  const [mainTab, setMainTab] = useState("trading-post")
  const [activeTab, setActiveTab] = useState("buy")
  const [isProcessing, setIsProcessing] = useState(false)
  const [openingPack, setOpeningPack] = useState<any>(null)

  // Tavern Dice Game State (Point 4)
  const [diceBetType, setDiceBetType] = useState<'under' | 'exact' | 'over'>('over')
  const [diceBetAmount, setDiceBetAmount] = useState<number>(20)
  const [isRolling, setIsRolling] = useState(false)
  const [dice1, setDice1] = useState(1)
  const [dice2, setDice2] = useState(6)
  const [rollsToday, setRollsToday] = useState(0)
  const [diceResultMsg, setDiceResultMsg] = useState<string | null>(null)
  const [diceWinStatus, setDiceWinStatus] = useState<'win' | 'lose' | null>(null)

  // Initialize/retrieve daily rolls limit
  useEffect(() => {
    if (typeof window !== "undefined") {
      const todayStr = new Date().toISOString().slice(0, 10)
      const stored = localStorage.getItem(`tavern_dice_rolls_${todayStr}`)
      if (stored) {
        setRollsToday(parseInt(stored, 10))
      }
    }
  }, [mainTab])

  // Search, Filter & Sort State
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState("name-asc")
  const [filterBy, setFilterBy] = useState("all")

  // Transaction state
  const [quantities, setQuantities] = useState<Record<string, number>>({})

  // Free pack claiming and cooldowns state
  const [claimedTimestamps, setClaimedTimestamps] = useState<Record<string, number>>({})
  const [unlockStartTimestamps, setUnlockStartTimestamps] = useState<Record<string, number>>({})
  const [currentTime, setCurrentTime] = useState(Date.now())

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("claimed_packs_timestamps")
      if (stored) {
        try {
          setClaimedTimestamps(JSON.parse(stored))
        } catch (e) {}
      }
      const storedUnlocks = localStorage.getItem("unlock_packs_timestamps")
      if (storedUnlocks) {
        try {
          setUnlockStartTimestamps(JSON.parse(storedUnlocks))
        } catch (e) {}
      }
    }

    const timer = setInterval(() => {
      setCurrentTime(Date.now())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const [ownedMythics, setOwnedMythics] = useState<{ cardId: number; variantId: number }[]>([]);
  const [hasAstralFortune, setHasAstralFortune] = useState(false);

  useEffect(() => {
    const loadMythics = async () => {
      try {
        const res = await fetch('/api/packs/mythics');
        if (res.ok) {
          const json = await res.json();
          if (json.mythics) {
            setOwnedMythics(json.mythics.map((m: any) => ({
              cardId: parseInt(m.card_id, 10),
              variantId: parseInt(m.variant_id, 10)
            })));
          }
        }
      } catch (err) {
        console.error('Failed to load owned mythics:', err);
      }
    };
    loadMythics();

    const checkPerks = async () => {
      try {
        const res = await fetch('/api/active-perks');
        if (res.ok) {
          const json = await res.json();
          const list = json.data || [];
          const now = new Date();
          const hasAstral = list.some((p: any) => p.perk_name === 'Astral Fortune' && new Date(p.expires_at) > now);
          setHasAstralFortune(hasAstral);
        }
      } catch (err) {
        console.error('Failed to load active perks for market:', err);
      }
    };
    checkPerks();
  }, [openingPack]);

  const isPackOnCooldown = (pack: any) => {
    if (!pack.cooldownType) return false
    const lastClaimed = claimedTimestamps[pack.id]
    if (!lastClaimed) return false

    const diff = currentTime - lastClaimed

    if (pack.cooldownType === 'daily' || pack.cooldownType === 'mystery') {
      return diff < 24 * 60 * 60 * 1000
    }
    if (pack.cooldownType === 'weekly') {
      return diff < 7 * 24 * 60 * 60 * 1000
    }
    if (pack.cooldownType === 'monthly') {
      return diff < 30 * 24 * 60 * 60 * 1000
    }
    return false
  }

  const getCooldownRemaining = (pack: any) => {
    if (!pack.cooldownType) return ""
    const lastClaimed = claimedTimestamps[pack.id]
    if (!lastClaimed) return ""

    const diff = currentTime - lastClaimed
    let remaining = 0

    if (pack.cooldownType === 'daily' || pack.cooldownType === 'mystery') {
      remaining = 24 * 60 * 60 * 1000 - diff
    } else if (pack.cooldownType === 'weekly') {
      remaining = 7 * 24 * 60 * 60 * 1000 - diff
    } else if (pack.cooldownType === 'monthly') {
      remaining = 30 * 24 * 60 * 60 * 1000 - diff
    }

    if (remaining <= 0) return ""

    const totalSeconds = Math.floor(remaining / 1000)
    const hours = Math.floor(totalSeconds / 3600)
    const days = Math.floor(hours / 24)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const seconds = totalSeconds % 60

    if (days > 0) {
      return `${days}d ${hours % 24}h ${minutes}m remaining`
    }
    if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s remaining`
    }
    return `${minutes}m ${seconds}s remaining`
  }

  useEffect(() => {
    // Initial stats fetch
    const stats = getCharacterStats()
    setGoldBalance(stats.gold)
    setGemBalance(stats.gems || 0)

    fetchFreshCharacterStats().then(fresh => {
      if (fresh) {
        setGoldBalance(fresh.gold)
        setGemBalance(fresh.gems || 0)
      }
    })

    const handleStatsUpdate = () => {
      const updated = getCharacterStats()
      setGoldBalance(updated.gold)
      setGemBalance(updated.gems || 0)
    }
    window.addEventListener('character-stats-update', handleStatsUpdate)
    return () => window.removeEventListener('character-stats-update', handleStatsUpdate)
  }, [user])

  const getInventoryQuantity = (materialId: string) => {
    const item = inventoryAsItems.find(i => i.id === materialId || i.id === materialId.replace('material-', ''))
    if (!item) {
      const byType = inventoryAsItems.find(i => i.type === materialId as any);
      return byType?.quantity || 0;
    }
    return item ? (item.quantity || 0) : 0
  }

  const rollDiceGame = async () => {
    if (isRolling || rollsToday >= 5) return;
    
    if (goldBalance < diceBetAmount) {
      toast({
        title: "⚠️ Insufficient Gold",
        description: "You do not have enough gold to place this bet.",
        variant: "destructive",
      });
      return;
    }

    setIsRolling(true);
    setDiceResultMsg(null);
    setDiceWinStatus(null);

    try {
      await addToCharacterStat('gold', -diceBetAmount, 'tavern-dice-bet');
      setGoldBalance(prev => prev - diceBetAmount);
    } catch (e) {
      console.error(e);
    }

    let animationInterval = setInterval(() => {
      setDice1(Math.floor(Math.random() * 6) + 1);
      setDice2(Math.floor(Math.random() * 6) + 1);
    }, 80);

    setTimeout(async () => {
      clearInterval(animationInterval);
      
      const finalD1 = Math.floor(Math.random() * 6) + 1;
      const finalD2 = Math.floor(Math.random() * 6) + 1;
      const total = finalD1 + finalD2;

      setDice1(finalD1);
      setDice2(finalD2);

      let won = false;
      let payout = 0;

      if (diceBetType === 'under' && total < 7) {
        won = true;
        payout = diceBetAmount * 2;
      } else if (diceBetType === 'over' && total > 7) {
        won = true;
        payout = diceBetAmount * 2;
      } else if (diceBetType === 'exact' && total === 7) {
        won = true;
        payout = diceBetAmount * 4;
      }

      const todayStr = new Date().toISOString().slice(0, 10);
      const newRolls = rollsToday + 1;
      setRollsToday(newRolls);
      localStorage.setItem(`tavern_dice_rolls_${todayStr}`, String(newRolls));

      if (won) {
        setDiceWinStatus('win');
        setDiceResultMsg(`You rolled a total of ${total} (${finalD1} + ${finalD2}). You won ${payout} Gold! 🎉`);
        try {
          await addToCharacterStat('gold', payout, 'tavern-dice-payout');
          setGoldBalance(prev => prev + payout);
          
          window.dispatchEvent(new CustomEvent('coin-burst', {
            detail: { amount: payout, x: window.innerWidth / 2, y: window.innerHeight / 2 }
          }));
        } catch (e) {
          console.error(e);
        }
      } else {
        setDiceWinStatus('lose');
        setDiceResultMsg(`You rolled a total of ${total} (${finalD1} + ${finalD2}). Better luck next time! 😭`);
      }

      setIsRolling(false);
    }, 1200);
  };

  const handleQuantityChange = (id: string, value: string) => {
    const qty = parseInt(value)
    if (isNaN(qty) || qty < 0) {
      setQuantities(prev => ({ ...prev, [id]: 0 }))
    } else {
      setQuantities(prev => ({ ...prev, [id]: qty }))
    }
  }

  const handleBuy = async (material: typeof MATERIALS[0]) => {
    if (isProcessing) return
    const qty = quantities[material.id] || 1
    const totalCost = qty * material.buyPrice

    if (qty <= 0) return

    setIsProcessing(true)
    setTimeout(() => setIsProcessing(false), 600)

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

    // Update inventory (add)
    updateTileQuantity(material.id as TileType, qty)

    setGoldBalance(prev => prev - totalCost)
    toast({
      title: "Purchase Successful",
      description: `Bought ${qty} ${material.name} for ${totalCost} gold.`
    })
    setQuantities(prev => ({ ...prev, [material.id]: 0 }))
  }

  const handleSell = async (material: typeof MATERIALS[0]) => {
    if (isProcessing) return
    const qty = quantities[material.id] || 1
    const totalValue = qty * material.sellPrice
    const currentOwned = getInventoryQuantity(material.id)

    if (qty <= 0) return

    setIsProcessing(true)
    setTimeout(() => setIsProcessing(false), 600)

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

    // Add gold
    addToCharacterStat('gold', totalValue, 'market-sell-material')
    setGoldBalance(prev => prev + totalValue) // Optimistic update

    toast({
      title: "Sale Successful",
      description: `Sold ${qty} ${material.name} for ${totalValue} gold.`
    })
    setQuantities(prev => ({ ...prev, [material.id]: 0 }))
  }

  const handleBuyPack = (packType: any) => {
    if (isProcessing) return
    if (packType.cooldownType && isPackOnCooldown(packType)) {
      toast({
        title: "Pack on Cooldown",
        description: `This pack can only be claimed once per ${packType.cooldownType === 'mystery' ? 'day' : packType.cooldownType}.`,
        variant: "destructive"
      })
      return
    }

    if (packType.cooldownType === 'mystery') {
      const unlockStarted = unlockStartTimestamps[packType.id]
      if (!unlockStarted) {
        // Start unlocking
        const updated = { ...unlockStartTimestamps, [packType.id]: Date.now() }
        setUnlockStartTimestamps(updated)
        if (typeof window !== "undefined") {
          localStorage.setItem("unlock_packs_timestamps", JSON.stringify(updated))
        }
        toast({ title: "Unlocking Started", description: "Come back in 3 hours to claim your mystery chest!" })
        return
      }
      const diff = currentTime - unlockStarted
      if (diff < 3 * 60 * 60 * 1000) {
        toast({ title: "Still Unlocking", description: "The mystery chest is not ready yet.", variant: "destructive" })
        return
      }
      
      // Clear unlock timestamp
      const updatedUnlocks = { ...unlockStartTimestamps }
      delete updatedUnlocks[packType.id]
      setUnlockStartTimestamps(updatedUnlocks)
      if (typeof window !== "undefined") {
        localStorage.setItem("unlock_packs_timestamps", JSON.stringify(updatedUnlocks))
      }
    }

    setIsProcessing(true)
    setTimeout(() => setIsProcessing(false), 600)

    const isGemPurchase = packType.currency === 'gems'
    const balance = isGemPurchase ? gemBalance : goldBalance
    const currencyName = isGemPurchase ? 'gems' : 'gold'
    const currencyLabel = isGemPurchase ? 'Gems' : 'Gold'

    if (balance < packType.price) {
      toast({
        title: `Insufficient ${currencyLabel}`,
        description: `You need ${packType.price} ${currencyLabel} to buy this pack.`,
        variant: "destructive"
      })
      return
    }

    // Deduct currency
    if (packType.price > 0) {
      addToCharacterStat(currencyName, -packType.price, `market-buy-${packType.id}`)
      if (isGemPurchase) {
        setGemBalance(prev => prev - packType.price)
      } else {
        setGoldBalance(prev => prev - packType.price)
      }
    }

    // Update cooldown
    if (packType.cooldownType) {
      const updated = { ...claimedTimestamps, [packType.id]: Date.now() }
      setClaimedTimestamps(updated)
      if (typeof window !== "undefined") {
        localStorage.setItem("claimed_packs_timestamps", JSON.stringify(updated))
      }
    }
    
    // Generate and open pack
    const pack = generatePack(packType.id, Math.random, ownedMythics, hasAstralFortune)
    setOpeningPack(pack)
  }

  // Filter and sort standard materials dynamically
  const filteredAndSortedMaterials = useMemo(() => {
    return MATERIALS.filter(material => {
      // 1. Search Query filter
      const matchesSearch = material.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            material.description.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchesSearch) return false;

      // 2. Owned/Unowned filter
      const ownedQty = getInventoryQuantity(material.id);
      if (filterBy === "owned") return ownedQty > 0;
      if (filterBy === "unowned") return ownedQty === 0;

      return true;
    }).sort((a, b) => {
      // 3. Sorting logic
      if (sortBy === "name-asc") {
        return a.name.localeCompare(b.name);
      }
      if (sortBy === "name-desc") {
        return b.name.localeCompare(a.name);
      }
      if (sortBy === "price-asc") {
        const priceA = activeTab === "sell" ? a.sellPrice : a.buyPrice;
        const priceB = activeTab === "sell" ? b.sellPrice : b.buyPrice;
        return priceA - priceB;
      }
      if (sortBy === "price-desc") {
        const priceA = activeTab === "sell" ? a.sellPrice : a.buyPrice;
        const priceB = activeTab === "sell" ? b.sellPrice : b.buyPrice;
        return priceB - priceA;
      }
      if (sortBy === "owned-desc") {
        return getInventoryQuantity(b.id) - getInventoryQuantity(a.id);
      }
      return 0;
    });
  }, [searchQuery, sortBy, filterBy, activeTab, inventoryAsItems]);

  return (
    <div className="flex min-h-screen flex-col bg-zinc-950 text-white font-sans">
      <main className="flex-1 p-4 md:p-6 space-y-6 max-w-7xl mx-auto w-full">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8 bg-zinc-900 p-6 rounded-2xl border border-zinc-800">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-amber-500 font-serif">Royal Exchange</h1>
            <p className="text-zinc-400 mt-1">Trade standard construction materials and resources.</p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full md:w-auto">
            {/* Current Currency HUD */}
            <div className="flex items-center justify-between sm:justify-start gap-4 bg-zinc-950 border border-zinc-800 p-2.5 px-4 rounded-xl shadow-lg w-full sm:w-auto">
              <div className="flex items-center gap-2">
                <Gem className="h-5 w-5 text-pink-400 animate-pulse shrink-0" />
                <div className="text-left mr-2 border-r border-zinc-800 pr-4">
                  <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Gems</p>
                  <AnimatedNumber 
                    value={gemBalance} 
                    className="text-base font-serif font-bold text-pink-200" 
                    title={`${gemBalance.toLocaleString()} Gems`}
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Coins className="h-5 w-5 text-amber-400 animate-pulse shrink-0" />
                <div className="text-right">
                  <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Your Treasury</p>
                  <div className="text-base font-serif font-bold text-amber-200" title={`${goldBalance.toLocaleString()} Gold`}>
                    <AnimatedNumber value={goldBalance} formatFn={formatGold} /> <span className="text-xs text-amber-600">Gold</span>
                  </div>
                </div>
              </div>
            </div>

            <Link href="/" className="w-full sm:w-auto">
              <Button variant="outline" className="w-full border-zinc-700 hover:bg-zinc-800 text-zinc-300 justify-center">
                <ArrowLeft className="h-4 w-4" />
                Return to Kingdom
              </Button>
            </Link>
          </div>
        </div>

        <Tabs value={mainTab} onValueChange={(val) => { setMainTab(val); setSearchQuery(""); }} className="space-y-6">
          <TabsList className="mb-8">
            <TabsTrigger value="trading-post">
              <ShoppingBag className="w-5 h-5" /> Trading Post
            </TabsTrigger>
            <TabsTrigger value="mystic-shop">
              <Package className="w-5 h-5" /> Mystic Shop
            </TabsTrigger>
            <TabsTrigger value="tavern-dice">
              <Dices className="w-5 h-5" /> Tavern Dice
            </TabsTrigger>
          </TabsList>

          {/* MYSTIC SHOP TAB */}
          <TabsContent value="mystic-shop" className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Free Packs Section */}
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🎁</span>
                <h2 className="text-2xl font-bold tracking-tight text-amber-400 font-serif">Free Chrono Chests</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {FREE_PACK_TYPES.map((pack, index) => {
                  const onCooldown = isPackOnCooldown(pack);
                  const remaining = getCooldownRemaining(pack);

                  let isUnlocking = false;
                  let unlockRemaining = "";
                  let canClaimMystery = false;
                  let mysteryStarted = false;
                  
                  if (pack.cooldownType === 'mystery' && !onCooldown) {
                    const unlockStarted = unlockStartTimestamps[pack.id];
                    if (unlockStarted) {
                      mysteryStarted = true;
                      const diff = currentTime - unlockStarted;
                      const remainingMs = 3 * 60 * 60 * 1000 - diff;
                      if (remainingMs > 0) {
                        isUnlocking = true;
                        const totalSeconds = Math.floor(remainingMs / 1000);
                        const hours = Math.floor(totalSeconds / 3600);
                        const minutes = Math.floor((totalSeconds % 3600) / 60);
                        const seconds = totalSeconds % 60;
                        unlockRemaining = hours > 0 ? `${hours}h ${minutes}m ${seconds}s` : `${minutes}m ${seconds}s`;
                      } else {
                        canClaimMystery = true;
                      }
                    }
                  }
                  
                  const isButtonDisabled = onCooldown || isProcessing || isUnlocking;
                  let buttonLabel = onCooldown ? "Claimed" : (isProcessing ? "Processing..." : `Claim Free ${pack.shortLabel}`);
                  
                  if (pack.cooldownType === 'mystery' && !onCooldown && !isProcessing) {
                    if (!mysteryStarted) {
                      buttonLabel = "Start Unlock (3h)";
                    } else if (isUnlocking) {
                      buttonLabel = `Unlocking... (${unlockRemaining})`;
                    } else if (canClaimMystery) {
                      buttonLabel = "Claim Mystery Chest!";
                    }
                  }

                  return (
                    <Card key={pack.id} style={{ animationDelay: `${index * 75}ms`, animationFillMode: 'backwards' }} className={`bg-zinc-900 border-amber-900/30 hover:border-amber-500/50 transition-all duration-300 shadow-lg group flex flex-col relative overflow-hidden animate-in fade-in slide-in-from-bottom-4 ${onCooldown ? 'opacity-70' : 'shadow-amber-500/5'}`}>
                      <div className="absolute inset-0 bg-gradient-to-b from-amber-900/10 to-transparent opacity-50"></div>
                      <CardHeader className="text-center relative z-10 pb-4">
                        <CardTitle className="text-2xl font-black text-amber-300 tracking-wide">{pack.title}</CardTitle>
                        <CardDescription className="text-amber-200/60 font-bold">{pack.shortLabel}</CardDescription>
                      </CardHeader>
                      <CardContent className="flex-1 text-center relative z-10 space-y-4">
                        <div className={`w-32 h-40 mx-auto bg-gradient-to-br from-amber-800/80 to-yellow-950 rounded-lg shadow-2xl flex items-center justify-center border-2 border-amber-500/30 transform transition-transform duration-500 ${onCooldown ? 'grayscale' : 'group-hover:scale-105 group-hover:rotate-3'}`}>
                          <span className="text-5xl drop-shadow-lg">{onCooldown ? '🔒' : '🎁'}</span>
                        </div>
                        <p className="text-sm text-zinc-300 px-4">{pack.description}</p>
                        {(onCooldown && remaining) ? (
                          <div className="text-xs font-semibold text-amber-400 bg-amber-950/40 py-1 px-3 rounded-full inline-block border border-amber-900/30">
                            ⏱️ {remaining}
                          </div>
                        ) : (isUnlocking && unlockRemaining) ? (
                          <div className="text-xs font-semibold text-amber-400 bg-amber-950/40 py-1 px-3 rounded-full inline-block border border-amber-900/30">
                            ⏳ {unlockRemaining}
                          </div>
                        ) : null}
                      </CardContent>
                      <CardFooter className="relative z-10 pt-4">
                        <Button 
                          className={`w-full h-14 text-base font-black uppercase tracking-wider rounded-xl transition-all duration-300 ${isButtonDisabled ? 'bg-zinc-800 text-zinc-500 border border-zinc-700/50 cursor-not-allowed shadow-none' : 'bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white shadow-lg shadow-amber-900/50'}`}
                          onClick={() => handleBuyPack(pack)}
                          disabled={isButtonDisabled}
                        >
                          {buttonLabel}
                        </Button>
                      </CardFooter>
                    </Card>
                  );
                })}
              </div>
            </div>

            {/* Paid Packs Section */}
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🪙</span>
                <h2 className="text-2xl font-bold tracking-tight text-purple-400 font-serif">Royal Exchange Card Packs</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {PACK_TYPES.map((pack, index) => (
                  <Card key={pack.id} style={{ animationDelay: `${index * 75}ms`, animationFillMode: 'backwards' }} className={cn(
                    "bg-zinc-900 transition-all duration-300 shadow-lg group flex flex-col relative overflow-hidden animate-in fade-in slide-in-from-bottom-4",
                    pack.id === 'crown' 
                      ? "border-2 border-purple-500/40 hover:border-purple-300 shadow-[0_0_15px_rgba(168,85,247,0.15)]" 
                      : "border border-purple-900/50 hover:border-purple-500/50"
                  )}>
                    <div className="absolute inset-0 bg-gradient-to-b from-purple-900/20 to-transparent opacity-50"></div>
                    <CardHeader className="text-center relative z-10 pb-4">
                      <CardTitle className="text-2xl font-black text-purple-300 tracking-wide">{pack.title}</CardTitle>
                      <CardDescription className="text-purple-200/60 font-bold">{pack.shortLabel}</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 text-center relative z-10 space-y-4">
                      <div className="w-32 h-40 mx-auto bg-gradient-to-br from-purple-800 to-indigo-900 rounded-lg shadow-2xl flex items-center justify-center border-2 border-purple-500/30 transform group-hover:scale-105 group-hover:rotate-3 transition-transform duration-500">
                        <span className="text-5xl drop-shadow-lg">🎴</span>
                      </div>
                      <p className="text-sm text-zinc-300 px-4">{pack.description}</p>
                    </CardContent>
                    <CardFooter className="relative z-10 pt-4">
                      <Button 
                        className="w-full h-14 text-lg font-black bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-lg shadow-purple-900/50 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={() => handleBuyPack(pack)}
                        disabled={(pack.currency === 'gems' ? gemBalance < pack.price : goldBalance < pack.price) || isProcessing}
                      >
                        {isProcessing ? "Processing..." : `Buy for ${pack.currency === 'gems' ? pack.price : formatGold(pack.price)}`} 
                        {pack.currency === 'gems' ? <Gem className="w-5 h-5 ml-2 text-pink-400" /> : <Coins className="w-5 h-5 ml-2 text-yellow-400" />}
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* TRADING POST TAB */}
          <TabsContent value="trading-post" className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Tabs value={activeTab} onValueChange={(val) => { setActiveTab(val); setSearchQuery(""); }} className="space-y-6">
              <TabsList className="mb-6">
                <TabsTrigger value="buy">
                  Buy Materials
                </TabsTrigger>
                <TabsTrigger value="sell">
                  Sell Resources
                </TabsTrigger>
              </TabsList>

              {/* BUY TAB */}
              <TabsContent value="buy" className="space-y-6">
            {/* Search, Filter & Sort Controls */}
            <div className="flex flex-col md:flex-row gap-4 bg-zinc-900 p-4 rounded-xl border border-zinc-800/60">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <Input
                  type="text"
                  placeholder="Search standard materials..."
                  className="bg-zinc-950 border-zinc-700 focus:border-amber-500 text-white pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex gap-4">
                <select
                  value={filterBy}
                  onChange={(e) => setFilterBy(e.target.value)}
                  className="bg-zinc-950 border border-zinc-700 text-zinc-200 rounded-lg px-3 py-2 text-sm focus:border-amber-500 focus:outline-none cursor-pointer"
                >
                  <option value="all">All Items</option>
                  <option value="owned">Owned Only</option>
                  <option value="unowned">Not Owned Only</option>
                </select>

                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-zinc-950 border border-zinc-700 text-zinc-200 rounded-lg px-3 py-2 text-sm focus:border-amber-500 focus:outline-none cursor-pointer"
                >
                  <option value="name-asc">Name (A-Z)</option>
                  <option value="name-desc">Name (Z-A)</option>
                  <option value="price-asc">Price (Low to High)</option>
                  <option value="price-desc">Price (High to Low)</option>
                  <option value="owned-desc">Most Owned</option>
                </select>
              </div>
            </div>

            {filteredAndSortedMaterials.length === 0 ? (
              <div className="text-center py-12 text-zinc-500">
                No materials match the selected filters.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredAndSortedMaterials.map((material, index) => (
                  <Card key={material.id} style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'backwards' }} className="bg-zinc-900 border-zinc-800 hover:border-amber-500/50 transition-all duration-300 shadow-lg group h-full flex flex-col animate-in fade-in slide-in-from-bottom-4">
                    <CardHeader className="pb-3 border-b border-zinc-800 bg-zinc-900 relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Package className="w-16 h-16 text-amber-500" />
                      </div>
                      <CardTitle className="flex items-center justify-between z-10">
                        <div className="flex items-center gap-3">
                          <span className="text-4xl filter drop-shadow-md">{material.icon}</span>
                          <div className="flex flex-col">
                            <span className="text-xl font-bold text-amber-100">{material.name}</span>
                            <span className="text-xs text-zinc-400 font-normal">{material.description}</span>
                          </div>
                        </div>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-4 flex-1">
                      <div className="flex justify-between items-center text-sm text-zinc-400 bg-zinc-950 p-2 rounded-lg">
                        <span>In Inventory:</span>
                        <span className="font-mono text-white font-bold">{getInventoryQuantity(material.id)}</span>
                      </div>

                      <div className="flex items-end gap-3">
                        <div className="flex-1 space-y-2">
                          <label className="text-xs font-bold uppercase text-zinc-500 tracking-wider">Quantity</label>
                          <Input
                            type="number"
                            min="0"
                            placeholder="0"
                            className="bg-zinc-950 border-zinc-700 focus:border-amber-500 text-lg font-mono text-center"
                            value={quantities[material.id] || ''}
                            onChange={(e) => handleQuantityChange(material.id, e.target.value)}
                          />
                        </div>
                        <div className="flex-1 space-y-2 text-right">
                          <label className="text-xs font-bold uppercase text-zinc-500 tracking-wider">Total Cost</label>
                          <div className="text-lg font-bold text-amber-500 font-mono flex items-center justify-end gap-1 h-10">
                            {(quantities[material.id] || 0) * material.buyPrice} <Coins className="w-4 h-4" />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="pt-2">
                      <Button
                        className="w-full bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-bold h-12 shadow-lg shadow-amber-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={() => handleBuy(material)}
                        disabled={goldBalance < (quantities[material.id] || 1) * material.buyPrice || (quantities[material.id] || 1) <= 0 || isProcessing}
                      >
                        {isProcessing ? "Processing..." : `Buy for ${material.buyPrice} G / unit`}
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* SELL TAB */}
          <TabsContent value="sell" className="space-y-6">
            {/* Search, Filter & Sort Controls */}
            <div className="flex flex-col md:flex-row gap-4 bg-zinc-900 p-4 rounded-xl border border-zinc-800/60">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <Input
                  type="text"
                  placeholder="Search resources..."
                  className="bg-zinc-950 border-zinc-700 focus:border-green-500 text-white pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex gap-4">
                <select
                  value={filterBy}
                  onChange={(e) => setFilterBy(e.target.value)}
                  className="bg-zinc-950 border border-zinc-700 text-zinc-200 rounded-lg px-3 py-2 text-sm focus:border-green-500 focus:outline-none cursor-pointer"
                >
                  <option value="all">All Items</option>
                  <option value="owned">Owned Only</option>
                  <option value="unowned">Not Owned Only</option>
                </select>

                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-zinc-950 border border-zinc-700 text-zinc-200 rounded-lg px-3 py-2 text-sm focus:border-green-500 focus:outline-none cursor-pointer"
                >
                  <option value="name-asc">Name (A-Z)</option>
                  <option value="name-desc">Name (Z-A)</option>
                  <option value="price-asc">Price (Low to High)</option>
                  <option value="price-desc">Price (High to Low)</option>
                  <option value="owned-desc">Most Owned</option>
                </select>
              </div>
            </div>

            {filteredAndSortedMaterials.length === 0 ? (
              <div className="text-center py-12 text-zinc-500">
                No materials match the selected filters.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredAndSortedMaterials.map((material, index) => (
                  <Card key={material.id} style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'backwards' }} className="bg-zinc-900 border-zinc-800 hover:border-green-500/50 transition-all duration-300 shadow-lg group h-full flex flex-col animate-in fade-in slide-in-from-bottom-4">
                    <CardHeader className="pb-3 border-b border-zinc-800 bg-zinc-900 relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                        <TrendingUp className="w-16 h-16 text-green-500" />
                      </div>
                      <CardTitle className="flex items-center justify-between z-10">
                        <div className="flex items-center gap-3">
                          <span className="text-4xl filter drop-shadow-md">{material.icon}</span>
                          <div className="flex flex-col">
                            <span className="text-xl font-bold text-zinc-100">{material.name}</span>
                            <span className="text-xs text-zinc-400 font-normal">{material.description}</span>
                          </div>
                        </div>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-4 flex-1">
                      <div className="flex justify-between items-center text-sm text-zinc-400 bg-zinc-950 p-2 rounded-lg">
                        <span>Available for Sale:</span>
                        <span className="font-mono text-white font-bold">{getInventoryQuantity(material.id)}</span>
                      </div>

                      <div className="flex items-end gap-3">
                        <div className="flex-1 space-y-2">
                          <label className="text-xs font-bold uppercase text-zinc-500 tracking-wider">Quantity</label>
                          <Input
                            type="number"
                            min="0"
                            max={getInventoryQuantity(material.id)}
                            placeholder="0"
                            className="bg-zinc-950 border-zinc-700 focus:border-green-500 text-lg font-mono text-center"
                            value={quantities[material.id] || ''}
                            onChange={(e) => handleQuantityChange(material.id, e.target.value)}
                          />
                        </div>
                        <div className="flex-1 space-y-2 text-right">
                          <label className="text-xs font-bold uppercase text-zinc-500 tracking-wider">Total Value</label>
                          <div className="text-lg font-bold text-green-400 font-mono flex items-center justify-end gap-1 h-10">
                            {(quantities[material.id] || 0) * material.sellPrice} <Coins className="w-4 h-4" />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="pt-2">
                      <Button
                        className="w-full bg-gradient-to-r from-green-700 to-green-800 hover:from-green-600 hover:to-green-700 text-white font-bold h-12 shadow-lg shadow-green-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={() => handleSell(material)}
                        disabled={getInventoryQuantity(material.id) < (quantities[material.id] || 1) || (quantities[material.id] || 1) <= 0 || isProcessing}
                      >
                        {isProcessing ? "Processing..." : `Sell for ${material.sellPrice} G / unit`}
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
            </Tabs>
          </TabsContent>

          {/* TAVERN DICE GAME TAB (Point 4) */}
          <TabsContent value="tavern-dice" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Card className="bg-zinc-900 border-zinc-800 shadow-2xl relative overflow-hidden max-w-2xl mx-auto">
              {/* Decorative top border */}
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500" />
              
              <CardHeader className="text-center pt-8">
                <div className="flex justify-center mb-2">
                  <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center border border-amber-500/30">
                    <Dices className="h-6 w-6 text-amber-400 animate-pulse" />
                  </div>
                </div>
                <CardTitle className="text-3xl font-serif text-amber-500 font-bold">The Green Dragon Tavern</CardTitle>
                <CardDescription className="text-zinc-400 max-w-md mx-auto">
                  Step up to the counter, traveler! Wager your gold on a roll of the bones. 
                  Get closer to fortune or lose it to the barkeep.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-6 px-6 sm:px-8 pb-8">
                {/* Daily rolls tracking */}
                <div className="flex justify-between items-center bg-zinc-950 p-3 rounded-xl border border-zinc-800">
                  <div className="flex flex-col text-left">
                    <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Barkeep's Rule</span>
                    <span className="text-xs text-zinc-300 font-medium">Daily Limit: 5 rolls max</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={cn(
                      "font-mono text-sm px-3 py-1 border-2",
                      rollsToday >= 5 ? "border-red-500/30 text-red-400 bg-red-950/20" : "border-amber-500/30 text-amber-400 bg-amber-500/5"
                    )}>
                      {rollsToday} / 5 Played Today
                    </Badge>
                  </div>
                </div>

                {rollsToday >= 5 ? (
                  <div className="bg-red-950/20 border border-red-500/20 rounded-xl p-4 text-center text-red-400 text-xs italic">
                    "The Barkeep wipes the glass and nods, 'That's enough excitement for you today, friend. Come back tomorrow!'"
                  </div>
                ) : (
                  <>
                    {/* Betting Target */}
                    <div className="space-y-3">
                      <label className="text-xs font-bold uppercase text-zinc-400 tracking-wider flex justify-center">1. Choose Your Prediction</label>
                      <div className="grid grid-cols-3 gap-3">
                        {(['under', 'exact', 'over'] as const).map((type) => {
                          const label = type === 'under' ? 'Under 7' : type === 'exact' ? 'Exactly 7' : 'Over 7';
                          const multiplier = type === 'exact' ? '4x Payout' : '2x Payout';
                          const selected = diceBetType === type;
                          return (
                            <button
                              key={type}
                              disabled={isRolling}
                              onClick={() => { setDiceBetType(type); setDiceResultMsg(null); }}
                              className={cn(
                                "flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all",
                                selected
                                  ? "border-amber-500 bg-amber-500/10 text-amber-200 shadow-[0_0_12px_rgba(245,158,11,0.2)]"
                                  : "border-zinc-800 bg-zinc-950/40 text-zinc-400 hover:border-zinc-700 hover:text-zinc-300"
                              )}
                            >
                              <span className="text-sm font-serif font-bold">{label}</span>
                              <span className="text-[10px] font-mono opacity-80 mt-0.5">{multiplier}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Betting Amount */}
                    <div className="space-y-3">
                      <label className="text-xs font-bold uppercase text-zinc-400 tracking-wider flex justify-center">2. Set Your Wager (Gold)</label>
                      <div className="flex justify-center gap-3">
                        {[10, 20, 50, 100].map((amount) => {
                          const selected = diceBetAmount === amount;
                          return (
                            <button
                              key={amount}
                              disabled={isRolling}
                              onClick={() => { setDiceBetAmount(amount); setDiceResultMsg(null); }}
                              className={cn(
                                "relative w-14 h-14 rounded-full border-2 flex flex-col items-center justify-center transition-all",
                                selected
                                  ? "border-yellow-500 bg-yellow-950/40 text-yellow-300 shadow-[0_0_15px_rgba(234,179,8,0.25)] scale-105"
                                  : "border-zinc-800 bg-zinc-950/30 text-zinc-400 hover:border-zinc-700 hover:text-zinc-300"
                              )}
                            >
                              <span className="text-xs font-bold font-mono">{amount}</span>
                              <span className="text-[9px] uppercase tracking-wider text-amber-600 font-extrabold -mt-0.5">Gold</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Dice Display Area */}
                    <div className="flex flex-col items-center justify-center py-4 bg-zinc-950 rounded-2xl border border-zinc-800 shadow-inner">
                      <div className="flex gap-6 justify-center items-center">
                        {/* Die 1 */}
                        <div className={cn(
                          "w-16 h-16 bg-zinc-900 border-2 border-amber-900/50 rounded-2xl flex items-center justify-center text-3xl font-bold font-serif text-amber-200 shadow-lg shadow-black/80",
                          isRolling && "animate-bounce"
                        )}>
                          {dice1}
                        </div>
                        {/* Die 2 */}
                        <div className={cn(
                          "w-16 h-16 bg-zinc-900 border-2 border-amber-900/50 rounded-2xl flex items-center justify-center text-3xl font-bold font-serif text-amber-200 shadow-lg shadow-black/80",
                          isRolling && "animate-bounce"
                        )} style={{ animationDelay: '0.15s' }}>
                          {dice2}
                        </div>
                      </div>

                      {/* Display Sum */}
                      {!isRolling && diceResultMsg && (
                        <div className="mt-4 font-serif text-sm text-zinc-400">
                          Total Rolled: <span className="text-lg font-bold text-amber-400 font-mono">{dice1 + dice2}</span>
                        </div>
                      )}
                    </div>

                    {/* Result Announcement */}
                    {diceResultMsg && (
                      <div className={cn(
                        "p-4 rounded-xl border text-center text-xs font-serif leading-relaxed",
                        diceWinStatus === 'win'
                          ? "bg-emerald-950/30 border-emerald-500/20 text-emerald-400"
                          : "bg-red-950/20 border-red-500/20 text-red-400"
                      )}>
                        {diceResultMsg}
                      </div>
                    )}

                    {/* Roll Button */}
                    <Button
                      onClick={rollDiceGame}
                      disabled={isRolling || goldBalance < diceBetAmount}
                      className="w-full h-12 bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-serif font-bold text-base rounded-xl shadow-[0_0_20px_rgba(245,158,11,0.3)] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      {isRolling ? "Rolling the Bones..." : "Roll the Bones 🎲"}
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {openingPack && (
        <PackOpeningModal 
          packData={openingPack} 
          onClose={() => setOpeningPack(null)} 
          onClaimed={(isNew) => {
            toast({
              title: isNew ? "NEW Mythic Discovered! 🎉" : "Card Claimed!",
              description: isNew ? "A new creature has been unlocked in your collection." : "It has been added to your Mythics collection."
            })
          }} 
        />
      )}
    </div>
  )
}
