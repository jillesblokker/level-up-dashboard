"use client"

import { useState, useEffect, useMemo } from "react"
import { ArrowLeft, Coins, TrendingUp, TrendingDown, Package, ShoppingBag, Search, Gem, Sparkles } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
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
import { TreasureChestVisual } from "@/components/ui/treasure-chest-visual"
import dynamic from 'next/dynamic'
const PackOpeningModal = dynamic(
  () => import('@/components/pack-opening-modal').then((mod) => mod.PackOpeningModal),
  { ssr: false }
)
const ApothecaModal = dynamic(
  () => import('@/components/kingdom/apotheca-modal').then((mod) => mod.ApothecaModal),
  { ssr: false }
)
import { formatGold, cn } from "@/lib/utils"
import { CollectibleRune } from "@/components/runes/collectible-rune"
import { getOwnedPacks, saveOwnedPack, OwnedPack } from "@/lib/owned-packs-service"
import { hapticSuccess } from "@/lib/haptics"
import { playSFX } from "@/lib/sound-manager"

// Define available materials for trade
const MATERIALS = [
  { id: 'material-water', name: 'Water', icon: '💧', buyPrice: 200, sellPrice: 100, description: 'Essential for life and growth.' },
  { id: 'material-logs', name: 'Logs', icon: '🪵', buyPrice: 300, sellPrice: 150, description: 'Raw wood for construction.' },
  { id: 'material-stone', name: 'Stone', icon: '🪨', buyPrice: 400, sellPrice: 200, description: 'Heavy stone for foundations.' },
  { id: 'material-planks', name: 'Planks', icon: '🪚', buyPrice: 550, sellPrice: 275, description: 'Refined wood for structures.' },
  { id: 'material-stone-block', name: 'Blocks', icon: '🧱', buyPrice: 700, sellPrice: 350, description: 'Cut stone for walls.' },
  { id: 'material-steel', name: 'Steel', icon: '⚔️', buyPrice: 850, sellPrice: 425, description: 'Strong metal for reinforcements.' },
  { id: 'material-crystal', name: 'Crystal', icon: '🔮', buyPrice: 1000, sellPrice: 500, description: 'Rare magical resource.' },
  { id: 'waterway_canal', name: 'Waterway canal', icon: '🌉', buyPrice: 750, sellPrice: 375, description: 'Serene stone canal tile with vertical aquamarine waters and arched stone bridge.' },
  { id: 'astral_citadel_monument', name: 'Astral Citadel Monument', icon: '🔮', buyPrice: 1500, sellPrice: 750, description: 'Colossal monument crowned with a glowing floating purple crystal orb.' },
  { id: 'serene_lake', name: 'Serene Lake', icon: '🌊', buyPrice: 25, sellPrice: 12, description: 'Tranquil aquamarine lake tile with pure shimmering water ripples.' },
]

export default function MarketPage() {
  const { user } = useUser()
  const [goldBalance, setGoldBalance] = useState(0)
  const [gemBalance, setGemBalance] = useState(0)
  const [playerLevel, setPlayerLevel] = useState(1)
  const { inventoryAsItems, updateTileQuantity } = useRealmInventory(user?.id, true)
  const [mainTab, setMainTab] = useState("trading-post")
  const [activeTab, setActiveTab] = useState("buy")
  const [isProcessing, setIsProcessing] = useState(false)
  const [openingPack, setOpeningPack] = useState<any>(null)
  const [apothecaOpen, setApothecaOpen] = useState(false)
  const [ownedPacksList, setOwnedPacksList] = useState<OwnedPack[]>([])

  useEffect(() => {
    setOwnedPacksList(getOwnedPacks());
    const handleOwnedPacksChanged = (e: Event) => {
      const detail = (e as CustomEvent)?.detail;
      setOwnedPacksList(Array.isArray(detail) ? detail : getOwnedPacks());
    };
    window.addEventListener('owned-packs-changed', handleOwnedPacksChanged);
    return () => window.removeEventListener('owned-packs-changed', handleOwnedPacksChanged);
  }, []);

  const scaledMaterials = useMemo(() => {
    return MATERIALS.map(mat => {
      const multiplier = 1 + playerLevel * 0.1;
      const scaledBuy = Math.floor(mat.buyPrice * multiplier);
      const scaledSell = Math.floor(scaledBuy * 0.5); // Sell price is 50% of scaled buy price
      return {
        ...mat,
        buyPrice: scaledBuy,
        sellPrice: scaledSell
      };
    });
  }, [playerLevel]);

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

      const params = new URLSearchParams(window.location.search)
      const tabParam = params.get("tab")
      if (tabParam === "mystic-bazaar" || tabParam === "mystic-shop" || tabParam === "mystic_bazaar") {
        setActiveTab("mystic-shop")
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

    if (pack.cooldownType === 'daily' || pack.cooldownType === 'mystery') {
      const lastDate = new Date(lastClaimed).toLocaleDateString('en-CA')
      const todayDate = new Date(currentTime).toLocaleDateString('en-CA')
      return lastDate === todayDate
    }

    const diff = currentTime - lastClaimed

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

    let remaining = 0

    if (pack.cooldownType === 'daily' || pack.cooldownType === 'mystery') {
      const lastDate = new Date(lastClaimed).toLocaleDateString('en-CA')
      const todayDate = new Date(currentTime).toLocaleDateString('en-CA')
      if (lastDate !== todayDate) return ""
      const tomorrow = new Date(currentTime)
      tomorrow.setHours(24, 0, 0, 0)
      remaining = tomorrow.getTime() - currentTime
    } else {
      const diff = currentTime - lastClaimed
      if (pack.cooldownType === 'weekly') {
        remaining = 7 * 24 * 60 * 60 * 1000 - diff
      } else if (pack.cooldownType === 'monthly') {
        remaining = 30 * 24 * 60 * 60 * 1000 - diff
      }
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
    if (stats.level) setPlayerLevel(stats.level)

    fetchFreshCharacterStats().then(fresh => {
      if (fresh) {
        setGoldBalance(fresh.gold)
        setGemBalance(fresh.gems || 0)
        if (fresh.level) setPlayerLevel(fresh.level)
      }
    })

    const handleStatsUpdate = () => {
      const updated = getCharacterStats()
      setGoldBalance(updated.gold)
      setGemBalance(updated.gems || 0)
      if (updated.level) setPlayerLevel(updated.level)
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
    
    // Generate and save pack to Owned Packs inventory (Buy Moment!)
    const generatedPackData = generatePack(packType.id, Math.random, ownedMythics, hasAstralFortune)
    const cleanStoredTitle = packType.title ? packType.title.replace(/\bChest\b/gi, 'Pack').trim() : 'Mystery Card Pack'
    const newOwnedPack: OwnedPack = {
      id: `owned_pack_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      packTypeId: packType.id,
      packTitle: cleanStoredTitle,
      shortLabel: packType.shortLabel || 'Card Pack',
      purchasedAt: Date.now(),
      packData: generatedPackData
    }

    saveOwnedPack(newOwnedPack)
    setOwnedPacksList(getOwnedPacks())
    hapticSuccess()

    if (packType.price === 0) {
      if (typeof window !== 'undefined') {
        import('canvas-confetti').then(confetti => {
          confetti.default({
            particleCount: 120,
            spread: 80,
            origin: { y: 0.5 },
            colors: ['#f59e0b', '#fbbf24', '#fcd34d', '#10b981', '#ffffff']
          });
        }).catch(() => {});
      }
      playSFX('sparkle');
    }

    toast({
      title: "🎴 Pack Added to Inventory!",
      description: `Bought ${packType.title || 'Pack'}! Click your Owned Packs in the Mystic Bazaar to unpack anytime.`
    })
  }

  // Filter and sort standard materials dynamically
  const filteredAndSortedMaterials = useMemo(() => {
    return scaledMaterials.filter(material => {
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
  }, [searchQuery, sortBy, filterBy, activeTab, inventoryAsItems, scaledMaterials]);

  // Helper to resolve styling, image, and visual type for Owned Packs
  const getOwnedPackMeta = (op: OwnedPack) => {
    const typeId = op.packTypeId?.toLowerCase() || '';
    const rawTitle = op.packTitle || '';
    const titleLower = rawTitle.toLowerCase();
    const cleanTitle = rawTitle.replace(/\bChest\b/gi, 'Pack').trim();

    if (typeId === 'free_monthly' || titleLower.includes('monthly')) {
      return {
        cleanTitle,
        image: '/images/packs/monthly-pack.jpg',
        cardBorder: 'border-2 border-amber-500/50 hover:border-amber-400/90 shadow-[0_0_20px_rgba(245,158,11,0.25)] hover:shadow-[0_0_35px_rgba(245,158,11,0.45)]',
        packBorder: 'border-amber-400/80 shadow-[0_10px_25px_rgba(245,158,11,0.4)]',
        gradient: 'from-amber-950/30 via-zinc-900 to-zinc-900',
        titleColor: 'text-amber-300',
        subColor: 'text-amber-400/80',
        btnColor: 'bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 hover:from-amber-400 hover:to-yellow-500 text-zinc-950 font-black shadow-amber-500/25',
      };
    }
    if (typeId === 'free_mystery' || titleLower.includes('mystery')) {
      return {
        cleanTitle: cleanTitle.includes('Pack') ? cleanTitle : `${cleanTitle} Pack`,
        image: '/images/packs/mystery-pack.jpg',
        cardBorder: 'border-2 border-purple-500/40 hover:border-purple-400/90 shadow-[0_0_20px_rgba(168,85,247,0.2)] hover:shadow-[0_0_35px_rgba(168,85,247,0.35)]',
        packBorder: 'border-purple-400/80 shadow-[0_10px_25px_rgba(168,85,247,0.4)]',
        gradient: 'from-purple-950/25 via-zinc-900 to-zinc-900',
        titleColor: 'text-purple-300',
        subColor: 'text-purple-400/80',
        btnColor: 'bg-gradient-to-r from-purple-600 via-purple-600 to-indigo-700 hover:from-purple-500 hover:to-indigo-600 text-white shadow-purple-950/50',
      };
    }
    if (typeId === 'free_weekly' || titleLower.includes('weekly')) {
      return {
        cleanTitle,
        image: '/images/packs/weekly-pack.jpg',
        cardBorder: 'border-2 border-blue-500/40 hover:border-blue-400/90 shadow-[0_0_20px_rgba(59,130,246,0.2)] hover:shadow-[0_0_35px_rgba(59,130,246,0.35)]',
        packBorder: 'border-blue-400/80 shadow-[0_10px_25px_rgba(59,130,246,0.35)]',
        gradient: 'from-blue-950/25 via-zinc-900 to-zinc-900',
        titleColor: 'text-blue-300',
        subColor: 'text-blue-400/80',
        btnColor: 'bg-gradient-to-r from-blue-600 via-blue-600 to-cyan-700 hover:from-blue-500 hover:to-cyan-600 text-white shadow-blue-950/50',
      };
    }
    if (typeId === 'free_daily' || titleLower.includes('daily')) {
      return {
        cleanTitle,
        image: '/images/packs/daily-pack.jpg',
        cardBorder: 'border-2 border-emerald-500/40 hover:border-emerald-400/90 shadow-[0_0_20px_rgba(16,185,129,0.2)] hover:shadow-[0_0_35px_rgba(16,185,129,0.35)]',
        packBorder: 'border-emerald-400/80 shadow-[0_10px_25px_rgba(16,185,129,0.35)]',
        gradient: 'from-emerald-950/25 via-zinc-900 to-zinc-900',
        titleColor: 'text-emerald-300',
        subColor: 'text-emerald-400/80',
        btnColor: 'bg-gradient-to-r from-emerald-600 via-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white shadow-emerald-950/50',
      };
    }

    // Paid Card Packs (Crown, Vault, Drift)
    if (typeId === 'crown' || titleLower.includes('crown')) {
      return {
        cleanTitle,
        image: '/images/packs/crown-pack.jpg',
        cardBorder: 'border-2 border-amber-500/50 hover:border-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.25)] hover:shadow-[0_0_35px_rgba(245,158,11,0.45)]',
        packBorder: 'border-amber-400/80 shadow-[0_10px_25px_rgba(245,158,11,0.4)]',
        gradient: 'from-amber-600/20 via-zinc-900 to-zinc-900',
        titleColor: 'text-amber-300',
        subColor: 'text-amber-200/80',
        btnColor: 'bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 hover:from-amber-400 hover:to-yellow-500 text-zinc-950 font-black shadow-amber-500/25',
      };
    }
    if (typeId === 'vault' || titleLower.includes('vault')) {
      return {
        cleanTitle,
        image: '/images/packs/vault-pack.jpg',
        cardBorder: 'border-2 border-purple-500/50 hover:border-purple-400 shadow-[0_0_20px_rgba(168,85,247,0.2)] hover:shadow-[0_0_35px_rgba(168,85,247,0.4)]',
        packBorder: 'border-purple-400/80 shadow-[0_10px_25px_rgba(168,85,247,0.4)]',
        gradient: 'from-purple-600/20 via-zinc-900 to-zinc-900',
        titleColor: 'text-purple-300',
        subColor: 'text-purple-200/80',
        btnColor: 'bg-gradient-to-r from-purple-600 via-fuchsia-600 to-indigo-600 hover:from-purple-500 hover:to-fuchsia-500 text-white shadow-purple-600/30',
      };
    }
    // Default Drift pack (Tier I)
    return {
      cleanTitle,
      image: '/images/packs/drift-pack.jpg',
      cardBorder: 'border-2 border-cyan-500/40 hover:border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.15)] hover:shadow-[0_0_30px_rgba(6,182,212,0.35)]',
      packBorder: 'border-cyan-400/80 shadow-[0_10px_25px_rgba(6,182,212,0.3)]',
      gradient: 'from-cyan-600/20 via-zinc-900 to-zinc-900',
      titleColor: 'text-cyan-300',
      subColor: 'text-cyan-200/80',
      btnColor: 'bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-cyan-600/30',
    };
  };

  // Group owned packs by pack type so duplicate packs stack together
  const groupedOwnedPacks = useMemo(() => {
    const groups: {
      key: string;
      packTypeId: string;
      packTitle: string;
      shortLabel: string;
      count: number;
      packs: OwnedPack[];
      latestPack: OwnedPack;
    }[] = [];

    const map = new Map<string, typeof groups[0]>();

    for (const op of ownedPacksList) {
      const key = op.packTypeId || op.packTitle.toLowerCase().trim();
      let existing = map.get(key);
      if (!existing) {
        existing = {
          key,
          packTypeId: op.packTypeId,
          packTitle: op.packTitle,
          shortLabel: op.shortLabel,
          count: 0,
          packs: [],
          latestPack: op
        };
        map.set(key, existing);
        groups.push(existing);
      }
      existing.count += 1;
      existing.packs.push(op);
      existing.latestPack = op;
    }

    return groups;
  }, [ownedPacksList]);

  return (
    <div className="min-h-screen thrivehaven-page-bg text-zinc-100 p-4 sm:p-6 lg:p-8 font-serif">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Top Bento Header Bar: Back, Balances & Apotheca Glasshouse */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-4 rounded-2xl bg-zinc-950/90 border border-amber-900/40 shadow-xl">
          <div className="flex items-center gap-3">
            <Link href="/kingdom">
              <Button
                variant="ghost"
                size="icon"
                className="text-amber-400 hover:text-amber-200 hover:bg-amber-950/60 rounded-full h-10 w-10 border border-amber-500/40 shadow-lg shrink-0 cursor-pointer"
                title="Back to Kingdom"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-lg font-bold font-medieval text-amber-300">Market & mystic bazaar</h1>
              <p className="text-xs text-zinc-400 font-serif">Trade resources, claim chests & uncover cards</p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
            {/* Gold balance pill */}
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-amber-950/40 border border-amber-500/30 text-xs font-mono font-bold text-amber-300 shadow-inner">
              <span>🪙</span>
              <span>{formatGold(goldBalance)} gold</span>
            </div>
            {/* Gems balance pill */}
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-pink-950/40 border border-pink-500/30 text-xs font-mono font-bold text-pink-300 shadow-inner">
              <span>💎</span>
              <span>{gemBalance} gems</span>
            </div>
            {/* Apotheca Glasshouse button */}
            <Button
              size="sm"
              onClick={() => setApothecaOpen(true)}
              className="bg-purple-950/90 border border-purple-500/60 text-purple-200 hover:bg-purple-900 text-xs px-3.5 py-2 rounded-xl font-serif flex items-center gap-2 shadow-lg shadow-purple-950/40 font-bold shrink-0"
            >
              <span>🧪 Apotheca glasshouse</span>
              <CollectibleRune
                id="berkano_apotheca"
                runeId="berkano"
                symbol="ᛒ"
                name="Berkano"
                meaning="The birch goddess, botanical vitality & gentle healing"
                className="text-emerald-400"
              />
              <Badge className="bg-purple-500/30 text-purple-200 text-[9px] font-mono border-purple-400/40 ml-0.5">
                Brew ready ✨
              </Badge>
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={(val) => { setActiveTab(val); setSearchQuery(""); }} className="space-y-6">
          <TabsList className="mb-8 bg-zinc-950 border border-amber-900/40 p-1 rounded-xl">
            <TabsTrigger value="buy" className="rounded-lg text-xs font-bold font-serif py-2.5">
              <ShoppingBag className="w-4 h-4 mr-1.5 text-amber-400" /> Buy materials
              <CollectibleRune
                id="fehu_buy"
                runeId="fehu"
                symbol="ᚠ"
                name="Fehu"
                meaning="Wealth, mobile property, and abundance"
                className="ml-1.5"
              />
            </TabsTrigger>
            <TabsTrigger value="sell" className="rounded-lg text-xs font-bold font-serif py-2.5">
              <Coins className="w-4 h-4 mr-1.5 text-green-400" /> Sell resources
              <CollectibleRune
                id="jera_sell"
                runeId="jera"
                symbol="ᛃ"
                name="Jera"
                meaning="Fruitful harvest and reward for labor"
                className="ml-1.5"
              />
            </TabsTrigger>
            <TabsTrigger value="mystic-shop" className="rounded-lg text-xs font-bold font-serif py-2.5">
              <Package className="w-4 h-4 mr-1.5 text-pink-400" /> Mystic bazaar
              <CollectibleRune
                id="perthro_mystic"
                runeId="perthro"
                symbol="ᛈ"
                name="Perthro"
                meaning="Mystery, fate, and occult chance"
                className="ml-1.5"
              />
            </TabsTrigger>
          </TabsList>

          {/* MYSTIC SHOP TAB */}
          <TabsContent value="mystic-shop" className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* MYSTIC BAZAAR HERO HEADER BANNER */}
            <div className="relative h-52 md:h-64 rounded-2xl overflow-hidden border border-emerald-500/40 shadow-2xl flex items-end">
              <Image
                src="/images/headers/mystic-bazaar-header.jpg"
                alt="Mystic Bazaar Card Shop"
                fill
                priority
                className="object-cover brightness-90 select-none pointer-events-none"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
              <div className="p-6 relative z-10 space-y-2">
                <Badge className="bg-emerald-600 text-black font-extrabold text-[9px] tracking-wider uppercase mb-1">
                  ✨ Mystic bazaar • Cards of fate
                </Badge>
                <h2 className="font-medieval text-2xl sm:text-4xl text-amber-300 tracking-wide drop-shadow-md">
                  Mystic bazaar
                </h2>
                <p className="text-xs sm:text-sm text-zinc-200 max-w-2xl leading-relaxed italic drop-shadow-sm">
                  Find your destiny! Unlock daily mystic chests, collect mystery cards, and unlock legendary realm blueprint tiles.
                </p>
                <div className="flex items-center gap-2 flex-wrap pt-1">
                  <Badge className="bg-emerald-950/90 border border-emerald-500/50 text-emerald-300 text-[10px] font-mono font-bold px-2.5 py-1 backdrop-blur-sm">
                    🎁 Mystic chests
                  </Badge>
                  <Badge className="bg-amber-950/90 border border-amber-500/50 text-amber-300 text-[10px] font-mono font-bold px-2.5 py-1 backdrop-blur-sm">
                    🃏 Buy card packs
                  </Badge>
                </div>
              </div>
            </div>

            {/* BENTO ROW 1 — Owned Packs & Mystic Chests */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
              {/* Left: Owned Packs Section (lg:col-span-7) */}
              <div className="lg:col-span-7 flex flex-col gap-4 bg-gradient-to-b from-amber-950/30 via-zinc-950 to-zinc-950 p-5 sm:p-6 rounded-2xl border-2 border-amber-500/40 shadow-2xl">
                <div className="space-y-4 flex flex-col flex-1">
                  <div className="flex items-center justify-between flex-wrap gap-3 pb-3 border-b border-amber-900/30">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">📦</span>
                      <div>
                        <h3 className="text-xl sm:text-2xl font-bold text-amber-300 font-serif">
                          Owned packs ({ownedPacksList.length})
                        </h3>
                        <p className="text-xs text-zinc-400 font-serif">
                          Scratch cards to reveal matching symbols and claim mystery cards
                        </p>
                      </div>
                    </div>
                    {ownedPacksList.length > 0 && (
                      <Badge className="bg-amber-950/90 border border-amber-500/50 text-amber-300 text-xs font-mono font-bold px-3 py-1 shadow-md">
                        Ready to unpack ✨
                      </Badge>
                    )}
                  </div>

                  {ownedPacksList.length === 0 ? (
                    <div className="p-5 sm:p-6 rounded-2xl border border-amber-500/25 bg-zinc-950/80 flex flex-col justify-between gap-5 my-auto shadow-inner">
                      <div className="flex items-start sm:items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-3xl shrink-0 shadow-inner">
                          <span>🃏</span>
                        </div>
                        <div>
                          <h4 className="text-base font-bold text-amber-300 font-serif mb-1">Mystic scratch card workshop</h4>
                          <p className="text-xs text-zinc-400 leading-relaxed">
                            No packs waiting in your inventory. Claim free gifts from the chests on the right or purchase booster packs below to scratch and reveal mystery creatures.
                          </p>
                        </div>
                      </div>

                      {/* Card Rarity Showcase preview */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1 text-center text-xs font-mono">
                        <div className="p-2.5 bg-zinc-900/80 rounded-xl border border-zinc-800">
                          <span className="text-zinc-400 text-[10px] block font-sans">Common</span>
                          <span className="text-zinc-300 font-bold">50% chance</span>
                        </div>
                        <div className="p-2.5 bg-blue-950/40 rounded-xl border border-blue-500/30">
                          <span className="text-blue-300 text-[10px] block font-sans">Rare</span>
                          <span className="text-blue-200 font-bold">30% chance</span>
                        </div>
                        <div className="p-2.5 bg-purple-950/40 rounded-xl border border-purple-500/30">
                          <span className="text-purple-300 text-[10px] block font-sans">Epic</span>
                          <span className="text-purple-200 font-bold">15% chance</span>
                        </div>
                        <div className="p-2.5 bg-amber-950/50 rounded-xl border border-amber-500/40 shadow-sm">
                          <span className="text-amber-300 text-[10px] block font-sans">Mythic</span>
                          <span className="text-amber-200 font-bold">5% jackpot</span>
                        </div>
                      </div>

                      <div className="p-3 bg-gradient-to-r from-amber-950/40 via-zinc-900 to-zinc-950 rounded-xl border border-amber-500/30 flex items-center justify-between text-xs font-serif">
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-amber-400" />
                          <span className="text-zinc-300">Scratch 3 matching glyphs to win full card drops!</span>
                        </div>
                        <span className="text-amber-400 font-mono text-[10px] font-bold">Guaranteed drop</span>
                      </div>
                    </div>
                  ) : (
                    <div className={cn(
                      "grid gap-4 pt-2",
                      groupedOwnedPacks.length === 1 ? "grid-cols-1 max-w-sm mx-auto" : "grid-cols-1 sm:grid-cols-2"
                    )}>
                      {groupedOwnedPacks.map((group, index) => {
                        const meta = getOwnedPackMeta(group.latestPack);
                        const currentPackToOpen = group.packs[0] || group.latestPack;

                        return (
                          <Card
                            key={group.key}
                            style={{ animationDelay: `${index * 60}ms` }}
                            onClick={() => {
                              if (!currentPackToOpen) return;
                              hapticSuccess();
                              setOpeningPack({ ...currentPackToOpen.packData, ownedPackId: currentPackToOpen.id });
                            }}
                            className={cn(
                              "bg-gradient-to-b transition-all duration-300 group flex flex-col justify-between relative overflow-hidden animate-in fade-in slide-in-from-bottom-3 cursor-pointer hover:scale-[1.02] shadow-xl min-h-[400px] w-full",
                              meta.gradient,
                              meta.cardBorder
                            )}
                          >
                            <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent opacity-40 pointer-events-none" />

                            <div>
                              <CardHeader className="text-center relative z-10 pb-2 pt-4">
                                <CardTitle className={cn("text-lg font-bold font-serif tracking-wide truncate", meta.titleColor)}>
                                  {meta.cleanTitle}
                                </CardTitle>
                                <CardDescription className={cn("text-[10px] font-mono font-bold tracking-wider uppercase", meta.subColor)}>
                                  {group.shortLabel || 'Card pack'}
                                </CardDescription>
                              </CardHeader>

                              <CardContent className="text-center relative z-10 space-y-3 px-3">
                                <div className="relative w-28 h-36 sm:w-32 sm:h-40 mx-auto">
                                  <div className={cn(
                                    "relative w-full h-full rounded-2xl overflow-hidden shadow-2xl border-2 transition-all duration-500 group-hover:scale-105 group-hover:rotate-1 group-hover:-translate-y-1",
                                    meta.packBorder
                                  )}>
                                    <Image
                                      src={meta.image}
                                      alt={meta.cleanTitle}
                                      fill
                                      sizes="(max-width: 768px) 140px, 160px"
                                      className="object-cover"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                                  </div>

                                  {group.count > 1 && (
                                    <div className="absolute -top-2.5 -right-2.5 z-30 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-zinc-950 font-black text-xs px-2 py-0.5 rounded-full shadow-[0_0_15px_rgba(245,158,11,0.8)] border-2 border-white flex items-center gap-1">
                                      <span>x{group.count}</span>
                                    </div>
                                  )}
                                </div>

                                <p className="text-xs text-zinc-300 leading-snug line-clamp-2 px-1">
                                  Tap to begin scratching cards and reveal 3 matching symbols to win!
                                </p>
                              </CardContent>
                            </div>

                            <CardFooter className="pt-2 pb-4 relative z-10">
                              <Button
                                className={cn(
                                  "w-full h-11 text-xs font-black uppercase tracking-wider rounded-xl shadow-lg transition-all duration-300 group-hover:brightness-110",
                                  meta.btnColor
                                )}
                              >
                                {group.count > 1 ? `Unpack (x${group.count}) ✨` : "Unpack now ✨"}
                              </Button>
                            </CardFooter>
                          </Card>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Right: Free Mystic Chests Section (lg:col-span-5) */}
              <div className="lg:col-span-5 flex flex-col gap-4 bg-zinc-950/90 p-5 sm:p-6 rounded-2xl border border-amber-900/40 shadow-xl h-full">
                <div className="flex flex-col flex-1 h-full">
                  <div className="flex items-center gap-3 mb-4 pb-3 border-b border-amber-900/30 shrink-0">
                    <span className="text-2xl">🎁</span>
                    <div>
                      <h3 className="text-xl font-bold text-amber-400 font-serif">Mystic chests</h3>
                      <p className="text-xs text-zinc-400">Daily and recurring free gifts</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1 items-stretch">
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
                      let buttonLabel = onCooldown ? "Claimed" : (isProcessing ? "Processing..." : `Claim free ${pack.shortLabel.toLowerCase()}`);
                      
                      if (pack.cooldownType === 'mystery' && !onCooldown && !isProcessing) {
                        if (!mysteryStarted) {
                          buttonLabel = "Start unlock (3h)";
                        } else if (isUnlocking) {
                          buttonLabel = `Unlocking... (${unlockRemaining})`;
                        } else if (canClaimMystery) {
                          buttonLabel = "Claim mystery chest!";
                        }
                      }

                      const isDaily = pack.id === 'free_daily';
                      const isMystery = pack.id === 'free_mystery';
                      const isWeekly = pack.id === 'free_weekly';

                      const cardTheme = isDaily
                        ? {
                            border: "border-emerald-500/35 hover:border-emerald-400/80 shadow-[0_0_15px_rgba(16,185,129,0.1)]",
                            gradient: "from-emerald-950/25 via-zinc-900 to-zinc-900",
                            title: "text-emerald-300",
                            sub: "text-emerald-400/80",
                            btn: "bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white shadow-emerald-950/50",
                            rarity: "uncommon" as const
                          }
                        : isMystery
                        ? {
                            border: "border-purple-500/35 hover:border-purple-400/80 shadow-[0_0_15px_rgba(168,85,247,0.1)]",
                            gradient: "from-purple-950/25 via-zinc-900 to-zinc-900",
                            title: "text-purple-300",
                            sub: "text-purple-400/80",
                            btn: "bg-gradient-to-r from-purple-600 to-indigo-700 hover:from-purple-500 hover:to-indigo-600 text-white shadow-purple-950/50",
                            rarity: "epic" as const
                          }
                        : isWeekly
                        ? {
                            border: "border-blue-500/35 hover:border-blue-400/80 shadow-[0_0_15px_rgba(59,130,246,0.1)]",
                            gradient: "from-blue-950/25 via-zinc-900 to-zinc-900",
                            title: "text-blue-300",
                            sub: "text-blue-400/80",
                            btn: "bg-gradient-to-r from-blue-600 to-cyan-700 hover:from-blue-500 hover:to-cyan-600 text-white shadow-blue-950/50",
                            rarity: "rare" as const
                          }
                        : {
                            border: "border-amber-500/45 hover:border-amber-400/90 shadow-[0_0_18px_rgba(245,158,11,0.15)]",
                            gradient: "from-amber-950/30 via-zinc-900 to-zinc-900",
                            title: "text-amber-300",
                            sub: "text-amber-400/80",
                            btn: "bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-yellow-500 text-zinc-950 font-black shadow-amber-500/25",
                            rarity: "legendary" as const
                          };

                      return (
                        <Card
                          key={pack.id}
                          style={{ animationDelay: `${index * 75}ms`, animationFillMode: 'backwards' }}
                          className={cn(
                            "bg-gradient-to-b transition-all duration-300 group flex flex-col justify-between relative overflow-hidden p-4 border-2 rounded-2xl flex-1 shadow-md hover:scale-[1.01]",
                            cardTheme.gradient,
                            cardTheme.border,
                            onCooldown && "opacity-70 saturate-75"
                          )}
                        >
                          <div className="flex-1 flex flex-col justify-between">
                            <div className="text-center pb-1">
                              <h4 className={cn("text-sm font-bold font-serif leading-tight", cardTheme.title)}>
                                {pack.title}
                              </h4>
                              <p className={cn("text-[10px] font-mono font-bold mt-0.5 tracking-wide normal-case", cardTheme.sub)}>
                                {pack.shortLabel}
                              </p>
                            </div>
                            
                            {/* Treasure chest image */}
                            <div className="relative w-full h-28 sm:h-32 mx-auto flex items-center justify-center my-2">
                              <TreasureChestVisual
                                state={onCooldown ? 'claimed' : isUnlocking ? 'opening' : 'ready'}
                                rarity={cardTheme.rarity}
                                tierLabel={pack.shortLabel}
                                hideLabels={true}
                                className="w-full h-full bg-transparent border-0 p-0 shadow-none"
                              />
                            </div>

                            {(onCooldown && remaining) ? (
                              <div className="text-[10px] font-semibold text-amber-400 bg-amber-950/50 py-1 px-2.5 rounded-full text-center border border-amber-900/40 font-mono my-1">
                                ⏱️ {remaining}
                              </div>
                            ) : (isUnlocking && unlockRemaining) ? (
                              <div className="text-[10px] font-semibold text-purple-300 bg-purple-950/50 py-1 px-2.5 rounded-full text-center border border-purple-900/40 font-mono my-1">
                                ⏳ {unlockRemaining}
                              </div>
                            ) : (
                              <div className="h-6 my-1" />
                            )}
                          </div>

                          <div className="mt-auto pt-2">
                            <Button 
                              className={cn(
                                "w-full h-10 text-xs font-bold font-serif normal-case rounded-xl transition-all shadow-md",
                                isButtonDisabled
                                  ? "bg-zinc-800 text-zinc-500 border border-zinc-700/50 cursor-not-allowed shadow-none"
                                  : cardTheme.btn
                              )}
                              onClick={() => handleBuyPack(pack)}
                              disabled={isButtonDisabled}
                            >
                              {buttonLabel}
                            </Button>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* BENTO ROW 2 — Paid Booster Card Packs */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🪙</span>
                <h3 className="text-2xl font-bold tracking-tight text-amber-300 font-serif">Buy card packs</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
                {PACK_TYPES.map((pack, index) => {
                  const packImg = (pack as any).image || (pack.id === 'starter' ? '/images/packs/drift-pack.jpg' : pack.id === 'vault' ? '/images/packs/vault-pack.jpg' : '/images/packs/crown-pack.jpg');
                  const isCrown = pack.id === 'crown';
                  const isVault = pack.id === 'vault';
                  
                  return (
                    <Card key={pack.id} style={{ animationDelay: `${index * 75}ms`, animationFillMode: 'backwards' }} className={cn(
                      "bg-zinc-900 transition-all duration-300 shadow-xl group flex flex-col justify-between relative overflow-hidden rounded-2xl",
                      isCrown 
                        ? "border-2 border-amber-500/50 hover:border-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.25)]" 
                        : isVault
                        ? "border-2 border-purple-500/50 hover:border-purple-400 shadow-[0_0_20px_rgba(168,85,247,0.2)]"
                        : "border-2 border-cyan-500/40 hover:border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.15)]"
                    )}>
                      <div className={cn(
                        "absolute inset-0 bg-gradient-to-b opacity-40 pointer-events-none",
                        isCrown ? "from-amber-600/20 to-transparent" : isVault ? "from-purple-600/20 to-transparent" : "from-cyan-600/20 to-transparent"
                      )} />
                      <div>
                        <CardHeader className="text-center relative z-10 pb-2 pt-5">
                          <CardTitle className={cn(
                            "text-xl font-bold font-serif tracking-wide",
                            isCrown ? "text-amber-300" : isVault ? "text-purple-300" : "text-cyan-300"
                          )}>
                            {pack.title}
                          </CardTitle>
                          <CardDescription className={cn(
                            "text-xs font-mono font-bold tracking-wider uppercase",
                            isCrown ? "text-amber-200/80" : isVault ? "text-purple-200/80" : "text-cyan-200/80"
                          )}>
                            {pack.shortLabel}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="text-center relative z-10 space-y-3 px-4">
                          <div className={cn(
                            "relative w-32 h-44 sm:w-36 sm:h-48 mx-auto rounded-2xl overflow-hidden shadow-2xl border-2 transition-all duration-500 group-hover:scale-105 group-hover:rotate-1 group-hover:-translate-y-1",
                            isCrown ? "border-amber-400/80 shadow-[0_10px_25px_rgba(245,158,11,0.4)]" : isVault ? "border-purple-400/80 shadow-[0_10px_25px_rgba(168,85,247,0.4)]" : "border-cyan-400/80 shadow-[0_10px_25px_rgba(6,182,212,0.3)]"
                          )}>
                            <Image
                              src={packImg}
                              alt={pack.title}
                              fill
                              sizes="(max-width: 768px) 140px, 160px"
                              className="object-cover"
                              priority={index === 0}
                            />
                            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                          </div>
                          <p className="text-xs text-zinc-300 px-2 line-clamp-2 min-h-[32px] leading-snug">
                            {pack.description}
                          </p>
                        </CardContent>
                      </div>
                      <CardFooter className="relative z-10 pb-5 pt-2">
                        <Button 
                          className={cn(
                            "w-full h-12 text-sm font-black tracking-wide rounded-xl shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed",
                            isCrown
                              ? "bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-yellow-500 text-zinc-950 font-black shadow-amber-500/25"
                              : isVault
                              ? "bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-fuchsia-500 text-white shadow-purple-600/30"
                              : "bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-cyan-600/30"
                          )}
                          onClick={() => handleBuyPack(pack)}
                          disabled={(pack.currency === 'gems' ? gemBalance < pack.price : goldBalance < pack.price) || isProcessing}
                        >
                          {isProcessing ? "Processing..." : `Buy for ${pack.currency === 'gems' ? `${pack.price} gems` : `${formatGold(pack.price)} gold`}`} 
                          {pack.currency === 'gems' ? <Gem className="w-4 h-4 ml-1.5 text-pink-300" /> : <Coins className="w-4 h-4 ml-1.5 text-yellow-300" />}
                        </Button>
                      </CardFooter>
                    </Card>
                  );
                })}
              </div>
            </div>
          </TabsContent>

          {/* BUY TAB */}
          <TabsContent value="buy" className="space-y-6">
            {/* BUY MATERIALS HERO HEADER BANNER */}
            <div className="relative h-60 md:h-72 rounded-2xl overflow-hidden border border-amber-500/40 shadow-2xl flex items-end">
              <Image
                src="/images/headers/market-buy-header.jpg"
                alt="Royal Material Exchange"
                fill
                priority
                className="object-cover brightness-90 select-none pointer-events-none"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
              <div className="p-6 relative z-10 space-y-2">
                <Badge className="bg-amber-600 text-black font-extrabold text-[9px] tracking-wider uppercase mb-1">
                  ⚖️ ROYAL TRADE WAREHOUSE • MATERIAL COMMERCE
                </Badge>
                <h2 className="font-medieval text-2xl sm:text-4xl text-amber-300 tracking-wide drop-shadow-md">
                  Royal Material Exchange
                </h2>
                <p className="text-xs sm:text-sm text-zinc-200 max-w-2xl leading-relaxed italic drop-shadow-sm">
                  Purchase essential construction timber, quarry stone, refined iron, and magical essences for kingdom realm building.
                </p>
                <div className="flex items-center gap-2 flex-wrap pt-1">
                  <Badge className="bg-amber-950/90 border border-amber-500/50 text-amber-300 text-[10px] font-mono font-bold px-2.5 py-1 backdrop-blur-sm">
                    🪵 Construction Timber & Planks
                  </Badge>
                  <Badge className="bg-amber-950/90 border border-amber-500/50 text-amber-300 text-[10px] font-mono font-bold px-2.5 py-1 backdrop-blur-sm">
                    ⛏️ Quarry Stone & Refined Iron
                  </Badge>
                  <Badge className="bg-emerald-950/90 border border-emerald-500/50 text-emerald-300 text-[10px] font-mono font-bold px-2.5 py-1 backdrop-blur-sm">
                    ⚡ Instant Delivery to Vault
                  </Badge>
                </div>
              </div>
            </div>
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

                      {/* 1-Tap Quick Quantity Multiplier Pills */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs font-bold uppercase text-zinc-500 tracking-wider">
                          <span>Quantity</span>
                          <div className="flex gap-1">
                            {[1, 5, 10, 50].map((qty) => (
                              <button
                                key={qty}
                                type="button"
                                onClick={() => handleQuantityChange(material.id, String(qty))}
                                className={`text-[10px] font-mono px-2 py-0.5 rounded border transition-all ${
                                  (quantities[material.id] || 0) === qty
                                    ? 'bg-amber-500 text-black font-extrabold border-amber-400 shadow-sm'
                                    : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:border-amber-500/40 hover:text-white'
                                }`}
                              >
                                {qty}x
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="flex items-end gap-3">
                          <div className="flex-1">
                            <Input
                              type="number"
                              min="0"
                              placeholder="0"
                              className="bg-zinc-950 border-zinc-700 focus:border-amber-500 text-lg font-mono text-center"
                              value={quantities[material.id] || ''}
                              onChange={(e) => handleQuantityChange(material.id, e.target.value)}
                            />
                          </div>
                          <div className="flex-1 text-right">
                            <label className="text-[10px] font-bold uppercase text-zinc-500 tracking-wider">Total Cost</label>
                            <div className="text-lg font-bold text-amber-500 font-mono flex items-center justify-end gap-1 h-10">
                              {(quantities[material.id] || 0) * material.buyPrice} <Coins className="w-4 h-4" />
                            </div>
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
            {/* SELL RESOURCES HERO HEADER BANNER */}
            <div className="relative h-60 md:h-72 rounded-2xl overflow-hidden border border-emerald-500/40 shadow-2xl flex items-end">
              <Image
                src="/images/headers/market-sell-header.jpg"
                alt="Royal Treasury Trade Post"
                fill
                priority
                className="object-cover brightness-90 select-none pointer-events-none"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
              <div className="p-6 relative z-10 space-y-2">
                <Badge className="bg-emerald-600 text-black font-extrabold text-[9px] tracking-wider uppercase mb-1">
                  💰 ROYAL HARVEST TREASURY • RESOURCE LIQUIDATION
                </Badge>
                <h2 className="font-medieval text-2xl sm:text-4xl text-amber-300 tracking-wide drop-shadow-md">
                  Royal Treasury Trade Post
                </h2>
                <p className="text-xs sm:text-sm text-zinc-200 max-w-2xl leading-relaxed italic drop-shadow-sm">
                  Liquidate excess kingdom crops, surplus minerals, and rare monster trophies for instant gold into your treasury.
                </p>
                <div className="flex items-center gap-2 flex-wrap pt-1">
                  <Badge className="bg-emerald-950/90 border border-emerald-500/50 text-emerald-300 text-[10px] font-mono font-bold px-2.5 py-1 backdrop-blur-sm">
                    🌾 Surplus Crops & Food Goods
                  </Badge>
                  <Badge className="bg-amber-950/90 border border-amber-500/50 text-amber-300 text-[10px] font-mono font-bold px-2.5 py-1 backdrop-blur-sm">
                    💎 Rare Minerals & Essences
                  </Badge>
                  <Badge className="bg-purple-950/90 border border-purple-500/50 text-purple-300 text-[10px] font-mono font-bold px-2.5 py-1 backdrop-blur-sm">
                    💰 100% Guaranteed Gold Yield
                  </Badge>
                </div>
              </div>
            </div>
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
                        <span>Available for sale:</span>
                        <span className="font-mono text-white font-bold">{getInventoryQuantity(material.id)}</span>
                      </div>

                      {/* 1-Tap Quick Quantity Multiplier Pills for Selling */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs font-bold text-zinc-400">
                          <span>Quantity</span>
                          <div className="flex gap-1">
                            {[1, 5, 10].map((qty) => (
                              <button
                                key={qty}
                                type="button"
                                onClick={() => handleQuantityChange(material.id, String(Math.min(qty, getInventoryQuantity(material.id))))}
                                disabled={getInventoryQuantity(material.id) < qty}
                                className={`text-[10px] font-mono px-2 py-0.5 rounded border transition-all ${
                                  (quantities[material.id] || 0) === qty
                                    ? 'bg-emerald-500 text-black font-extrabold border-emerald-400 shadow-sm'
                                    : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:border-emerald-500/40 hover:text-white disabled:opacity-40 disabled:hover:border-zinc-800'
                                }`}
                              >
                                {qty}x
                              </button>
                            ))}
                            {getInventoryQuantity(material.id) > 0 && (
                              <button
                                type="button"
                                onClick={() => handleQuantityChange(material.id, String(getInventoryQuantity(material.id)))}
                                className="text-[10px] font-mono px-2 py-0.5 rounded border bg-emerald-950/80 border-emerald-500/40 text-emerald-300 font-bold hover:bg-emerald-900 shadow-sm transition-all"
                              >
                                Max ({getInventoryQuantity(material.id)})
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="flex items-end gap-3">
                          <div className="flex-1">
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
                          <div className="flex-1 text-right">
                            <label className="text-[10px] font-bold text-zinc-400">Total value</label>
                            <div className="text-lg font-bold text-green-400 font-mono flex items-center justify-end gap-1 h-10">
                              {(quantities[material.id] || 0) * material.sellPrice} <Coins className="w-4 h-4" />
                            </div>
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
      </div>

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
      {apothecaOpen && (
        <ApothecaModal
          open={apothecaOpen}
          onOpenChange={setApothecaOpen}
          onComplete={() => { fetchFreshCharacterStats(); }}
        />
      )}
    </div>
  )
}
