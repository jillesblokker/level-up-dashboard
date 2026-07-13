"use client"

import { logger } from "@/lib/logger"
import { useState, useEffect } from "react"
import { useAuth } from "@clerk/nextjs"
import { motion, AnimatePresence } from "framer-motion"
import { Flame, Sparkles, RefreshCw, Shield, Zap } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"

interface InventoryItem {
  id: string
  name: string
  emoji: string
  quantity: number
  description: string
  rarity: string
}

interface Recipe {
  id: string
  name: string
  description: string
  emoji: string
  color: string
  ingredients: { id: string; name: string; emoji: string; qty: number }[]
  durationHours: number
  buffName: string
  buffEffect: string
  successSpeech: string
}

const RECIPES: Recipe[] = [
  {
    id: "potion-focus",
    name: "Elixir of Focus",
    description: "Channels mental energy to increase all experience earned.",
    emoji: "🧪",
    color: "from-cyan-500 to-blue-600",
    ingredients: [
      { id: "material-crystal", name: "Essence Crystal", emoji: "💎", qty: 2 },
      { id: "material-water", name: "Water", emoji: "💧", qty: 1 }
    ],
    durationHours: 24,
    buffName: "Elixir of Focus",
    buffEffect: "+25% Experience from all daily habits and challenges",
    successSpeech: "Fascinating choice! This elixir will sharpen your focus."
  },
  {
    id: "potion-dread",
    name: "Dread Tonic",
    description: "An unstable mixture that amplifies gold returns at a cost.",
    emoji: "🍷",
    color: "from-purple-600 to-red-700",
    ingredients: [
      { id: "material-steel", name: "Steel Ingots", emoji: "⚔️", qty: 1 },
      { id: "material-stone", name: "Cobblestone", emoji: "🪨", qty: 1 },
      { id: "material-water", name: "Water", emoji: "💧", qty: 1 }
    ],
    durationHours: 12,
    buffName: "Dread Tonic",
    buffEffect: "+50% Gold from all quests and completed duels",
    successSpeech: "Be careful! The Dread Tonic holds heavy rewards."
  },
  {
    id: "potion-aegis",
    name: "Aegis Draught",
    description: "Protects your active habits from failing their streaks.",
    emoji: "🛡️",
    color: "from-amber-500 to-yellow-600",
    ingredients: [
      { id: "material-stone", name: "Cobblestone", emoji: "🪨", qty: 2 },
      { id: "material-planks", name: "Wooden Planks", emoji: "🪵", qty: 1 },
      { id: "material-water", name: "Water", emoji: "💧", qty: 1 }
    ],
    durationHours: 24,
    buffName: "Aegis Shield",
    buffEffect: "Streak protector active for all daily checkmarks",
    successSpeech: "Sturdy! The Aegis Draught will shield your progress."
  }
]

const GUARDIAN_DATA = {
  "ember-drake": { name: "Ember Drake", emoji: "🐉", focus: "Might & Craft", color: "text-orange-500" },
  "sage-owl": { name: "Sage Owl", emoji: "🦉", focus: "Knowledge & Honor", color: "text-cyan-400" },
  "spirit-sprite": { name: "Spirit Sprite", emoji: "🧚", focus: "Vitality & Castle", color: "text-emerald-400" }
}

export function AlchemyLab() {
  const { getToken, userId } = useAuth()
  const { toast } = useToast()

  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [activeModifiers, setActiveModifiers] = useState<any[]>([])
  const [guardian, setGuardian] = useState<any | null>(null)
  const [petSpeech, setPetSpeech] = useState<string>("Welcome to the Lab! Let's brew something magical.")
  
  // Cauldron state
  const [cauldron, setCauldron] = useState<Record<string, number>>({}) // id -> quantity
  const [brewState, setBrewState] = useState<"idle" | "brewing" | "success" | "error">("idle")
  const [brewedPotion, setBrewedPotion] = useState<Recipe | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const fetchLabData = async () => {
    try {
      const token = await getToken({ template: 'supabase' })
      if (!token) return

      // Fetch Inventory
      const invRes = await fetch("/api/inventory", {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (invRes.ok) {
        const invData = await invRes.json()
        const items = (invData && invData.success && Array.isArray(invData.data)) ? invData.data : (Array.isArray(invData) ? invData : []);
        setInventory(items)
      }

      // Fetch Active Modifiers
      const modRes = await fetch("/api/active-modifiers", {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (modRes.ok) {
        const modData = await modRes.json()
        const mods = (modData && Array.isArray(modData.modifiers)) ? modData.modifiers : (Array.isArray(modData) ? modData : []);
        setActiveModifiers(mods)
      }

      // Fetch Guardian state
      const prefRes = await fetch("/api/user-preferences", {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (prefRes.ok) {
        const prefData = await prefRes.json()
        const petState = prefData.preferences?.habit_guardian_state
        if (petState && petState.companionId) {
          const matched = GUARDIAN_DATA[petState.companionId as keyof typeof GUARDIAN_DATA]
          if (matched) {
            setGuardian({ ...petState, ...matched })
          }
        }
      }
    } catch (err) {
      logger.error("Error loading lab data:", err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (userId) {
      fetchLabData()
    }
  }, [userId])

  const addIngredient = (id: string) => {
    if (brewState === "brewing") return
    
    const invItem = inventory.find(i => i.id === id)
    if (!invItem) return

    const currentInCauldron = cauldron[id] || 0
    if (currentInCauldron >= invItem.quantity) {
      toast({
        title: "Insufficient Reagents",
        description: `You only have ${invItem.quantity}x ${invItem.name}.`,
        variant: "destructive"
      })
      return
    }

    setCauldron(prev => ({
      ...prev,
      [id]: (prev[id] || 0) + 1
    }))

    // Dynamic dialogue
    if (guardian) {
      if (id === "material-crystal") {
        setPetSpeech(guardian.companionId === "ember-drake" ? "Ooh, shiny energy rocks! Drop it in!" : "Excellent. Energy crystals align the elixir parameters.")
      } else if (id === "material-water") {
        setPetSpeech("Fresh water forms the base of every draught.")
      } else {
        setPetSpeech("Let's see what happens when we mix these together...")
      }
    }
  }

  const removeIngredient = (id: string) => {
    if (brewState === "brewing") return
    if (!cauldron[id]) return

    setCauldron(prev => {
      const copy = { ...prev }
      const currentVal = copy[id] || 0
      if (currentVal <= 1) {
        delete copy[id]
      } else {
        copy[id] = currentVal - 1
      }
      return copy
    })
  }

  const clearCauldron = () => {
    if (brewState === "brewing") return
    setCauldron({})
    setPetSpeech("Clear pot, fresh start!")
  }

  const selectRecipe = (recipe: Recipe) => {
    if (brewState === "brewing") return

    // Verify ingredients are in inventory
    const missing: string[] = []
    recipe.ingredients.forEach(req => {
      const invItem = inventory.find(i => i.id === req.id)
      if (!invItem || invItem.quantity < req.qty) {
        missing.push(`${req.qty}x ${req.name}`)
      }
    })

    if (missing.length > 0) {
      toast({
        title: "Missing Reagents",
        description: `You need: ${missing.join(", ")}`,
        variant: "destructive"
      })
      if (guardian) {
        setPetSpeech(`Hoot! We don't have enough ingredients to brew ${recipe.name}. Check daily tasks!`)
      }
      return
    }

    // Set cauldron slots
    const newCauldron: Record<string, number> = {}
    recipe.ingredients.forEach(req => {
      newCauldron[req.id] = req.qty
    })
    setCauldron(newCauldron)
    setPetSpeech(`Perfect! Ready to brew ${recipe.name}?`)
  }

  const brewCauldron = async () => {
    if (brewState === "brewing") return

    // Match cauldron items with recipes
    const matched = RECIPES.find(recipe => {
      if (Object.keys(recipe.ingredients).length !== Object.keys(cauldron).length) return false
      return recipe.ingredients.every(req => cauldron[req.id] === req.qty)
    })

    if (!matched) {
      setBrewState("brewing")
      setPetSpeech("Stirring... wait, something smells burning!")
      setTimeout(() => {
        setBrewState("error")
        setPetSpeech("KABOOM! 💥 That was a volatile mixture. Be careful!")
        setCauldron({})
        setTimeout(() => setBrewState("idle"), 4000)
      }, 2500)
      return
    }

    try {
      setBrewState("brewing")
      setPetSpeech("Chanting the magical formulas... Cauldron is bubbling!")
      const token = await getToken({ template: 'supabase' })
      if (!token) return

      // 1. Deduct ingredients from inventory
      for (const ingredient of matched.ingredients) {
        await fetch("/api/inventory", {
          method: "DELETE",
          headers: { 
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}` 
          },
          body: JSON.stringify({ itemId: ingredient.id, quantity: ingredient.qty })
        })
      }

      // 2. Grant Active Modifier buff
      await fetch("/api/active-modifiers", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({
          name: matched.buffName,
          effect: matched.buffEffect,
          durationHours: matched.durationHours,
          source: "potion"
        })
      })

      // Success animation timing
      setTimeout(() => {
        setBrewState("success")
        setBrewedPotion(matched)
        setCauldron({})
        setPetSpeech(matched.successSpeech)
        fetchLabData() // Reload inventory/modifiers
        
        // Dispatch event to update quests page and profile page cache immediately
        window.dispatchEvent(new Event('character-modifiers-update'));
        window.dispatchEvent(new Event('character-inventory-update'));
        
        toast({
          title: `${matched.name} Brewed! 🧪✨`,
          description: `Active buff: ${matched.buffEffect}`
        })
      }, 3000)

    } catch (err) {
      logger.error("Error brewing potion:", err)
      setBrewState("idle")
    }
  }

  const renderCauldronBubbles = () => {
    const bubbleColors = {
      idle: "bg-purple-500/40 border-purple-400/50",
      brewing: "bg-yellow-500/80 border-yellow-400 animate-pulse",
      success: "bg-emerald-500/70 border-emerald-400",
      error: "bg-zinc-800/80 border-zinc-700"
    }

    return Array.from({ length: 12 }).map((_, i) => (
      <motion.div
        key={i}
        className={`absolute rounded-full border ${bubbleColors[brewState]}`}
        style={{
          width: Math.random() * 14 + 6,
          height: Math.random() * 14 + 6,
          left: `${Math.random() * 80 + 10}%`,
          bottom: `${Math.random() * 30 + 10}%`
        }}
        animate={{
          y: [-10, -80],
          opacity: [0, 0.9, 0],
          scale: [0.8, 1.2, 0.4]
        }}
        transition={{
          duration: Math.random() * 1.5 + 1.2,
          repeat: Infinity,
          delay: Math.random() * 1.5
        }}
      />
    ))
  }

  return (
    <div className="w-full text-white bg-transparent">
      {isLoading ? (
        <div className="flex flex-col items-center justify-center h-96 space-y-4">
          <RefreshCw className="w-10 h-10 text-purple-500 animate-spin" />
          <p className="text-zinc-500 font-serif text-sm">Entering the Laboratory...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* LEFT COLUMN: Cauldron and Companion (7 cols on desktop) */}
          <div className="lg:col-span-7 flex flex-col space-y-6">
            
            {/* CAULDRON CARD */}
            <Card className="bg-zinc-950/70 border-amber-900/30 shadow-2xl relative overflow-hidden rounded-3xl">
              <CardHeader className="border-b border-white/5 pb-4">
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="font-serif text-lg text-white">Alchemist&apos;s Cauldron</CardTitle>
                    <CardDescription className="text-zinc-400 text-xs">Drop reagents inside to brew booster elixirs</CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearCauldron}
                    disabled={brewState === "brewing" || Object.keys(cauldron).length === 0}
                    className="text-zinc-500 hover:text-red-400 text-xs font-bold flex items-center gap-1.5"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Reset Pot
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-8 flex flex-col items-center relative min-h-[380px]">
                
                {/* Cauldron Liquid area */}
                <div className="relative w-64 h-64 flex items-center justify-center select-none">
                  
                  {/* Glowing cauldron backdrop */}
                  <div className={`absolute inset-0 rounded-full blur-2xl opacity-20 transition-colors duration-1000 ${
                    brewState === "idle" ? "bg-purple-600" :
                    brewState === "brewing" ? "bg-amber-500 animate-pulse" :
                    brewState === "success" ? "bg-emerald-500" : "bg-red-800"
                  }`} />

                  {/* Animated Steam particles */}
                  <AnimatePresence>
                    {brewState !== "error" && renderCauldronBubbles()}
                  </AnimatePresence>

                  {/* Cauldron Pot Graphic (HTML styled) */}
                  <motion.div
                    animate={brewState === "brewing" ? {
                      x: [0, -4, 4, -4, 4, 0],
                      y: [0, 2, -2, 2, -2, 0]
                    } : {}}
                    transition={{ duration: 0.5, repeat: Infinity }}
                    className="absolute bottom-2 w-52 h-44 bg-zinc-950 border-4 border-zinc-800 rounded-b-[80px] rounded-t-[20px] shadow-2xl flex flex-col items-center justify-start overflow-hidden pt-4"
                  >
                    {/* Boiling Liquid surface */}
                    <div className={`w-full h-8 absolute top-0 left-0 transition-colors duration-1000 ${
                      brewState === "idle" ? "bg-purple-950/80 border-b border-purple-500/30" :
                      brewState === "brewing" ? "bg-yellow-950/90 border-b border-yellow-500/40" :
                      brewState === "success" ? "bg-emerald-950/90 border-b border-emerald-500/40" :
                      "bg-red-950/90 border-b border-red-500/40"
                    }`} />

                    {/* Display floating ingredients loaded in cauldron */}
                    <div className="flex gap-2 flex-wrap max-w-[80%] justify-center z-10 mt-6 select-none">
                      {Object.entries(cauldron).map(([id, qty]) => {
                        const item = inventory.find(i => i.id === id)
                        return (
                          <motion.button
                            key={id}
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0 }}
                            onClick={() => removeIngredient(id)}
                            className="px-2 py-1 bg-zinc-900 border border-white/5 rounded-lg flex items-center gap-1 hover:border-red-500/30 group"
                          >
                            <span className="text-sm">{item?.emoji || "📦"}</span>
                            <span className="text-[10px] font-bold text-zinc-400 group-hover:text-red-400">x{qty}</span>
                          </motion.button>
                        )
                      })}
                      {Object.keys(cauldron).length === 0 && brewState === "idle" && (
                        <span className="text-zinc-600 text-xs italic font-serif mt-4">Cauldron is empty...</span>
                      )}
                    </div>
                  </motion.div>

                  {/* Cauldron base flame */}
                  <div className="absolute -bottom-4 flex justify-center w-full">
                    <Flame className="w-10 h-10 text-orange-600 animate-pulse" />
                    <Flame className="w-8 h-8 text-yellow-500 animate-bounce -ml-2" />
                  </div>
                </div>

                {/* Brew Trigger Action */}
                <div className="mt-8 z-10">
                  <Button
                    onClick={brewCauldron}
                    disabled={brewState === "brewing" || Object.keys(cauldron).length === 0}
                    className={`px-8 py-3.5 rounded-2xl font-extrabold shadow-lg transition-all ${
                      Object.keys(cauldron).length === 0
                        ? "bg-zinc-800 border-zinc-700 text-zinc-500 cursor-not-allowed"
                        : "bg-purple-600 hover:bg-purple-700 text-white shadow-purple-500/20 hover:scale-105"
                    }`}
                  >
                    {brewState === "brewing" ? "Brewing..." : "Brew Cauldron"}
                  </Button>
                </div>

                {/* Success Potion Overlay Popup */}
                <AnimatePresence>
                  {brewState === "success" && brewedPotion && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="absolute inset-0 bg-black/95 flex flex-col items-center justify-center p-6 z-20"
                    >
                      <div className="p-6 rounded-full bg-emerald-500/10 border-2 border-emerald-500 text-emerald-400 text-5xl mb-4 animate-bounce">
                        {brewedPotion.emoji}
                      </div>
                      <h3 className="font-serif text-xl font-bold text-white mb-1">{brewedPotion.name} Successfully Brewed!</h3>
                      <p className="text-xs text-zinc-400 mb-4">{brewedPotion.buffEffect}</p>
                      <Button
                        onClick={() => {
                          setBrewState("idle")
                          setBrewedPotion(null)
                        }}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white"
                      >
                        Collect Potion
                      </Button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>

            {/* COMPANION PET PANEL */}
            {guardian && (
              <div className="p-4 bg-zinc-950/70 border border-amber-900/30 rounded-3xl flex items-center gap-4 relative">
                <div className="text-5xl select-none animate-bounce flex-shrink-0" style={{ animationDuration: '3s' }}>
                  {guardian.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-[9px] uppercase tracking-wider font-extrabold text-zinc-500">{guardian.name} (Lvl {guardian.level})</span>
                  <div className="relative mt-1 bg-zinc-900/50 border border-white/5 p-3 rounded-2xl text-xs font-serif italic text-zinc-300">
                    <div className="absolute left-4 -top-1.5 w-3 h-3 bg-zinc-900/50 border-l border-t border-white/5 transform rotate-45" />
                    &ldquo;{petSpeech}&rdquo;
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: Recipes & Inventory (5 cols on desktop) */}
          <div className="lg:col-span-5 flex flex-col space-y-6">
            
            {/* REAGENTS INVENTORY CARD */}
            <Card className="bg-zinc-950/70 border-amber-900/30 shadow-2xl rounded-3xl">
              <CardHeader className="border-b border-white/5 pb-4">
                <CardTitle className="font-serif text-sm text-white">Your Reagent Bag</CardTitle>
                <CardDescription className="text-zinc-400 text-xs">Ingredients collected from daily checkmarks</CardDescription>
              </CardHeader>
              <CardContent className="p-4">
                <div className="grid grid-cols-2 gap-3">
                  {inventory.filter(i => i.id.startsWith('material-')).map(item => {
                    const qtyInCauldron = cauldron[item.id] || 0
                    const availableQty = item.quantity - qtyInCauldron

                    return (
                      <div
                        key={item.id}
                        onClick={() => availableQty > 0 && addIngredient(item.id)}
                        className={`p-3 bg-zinc-900/40 border rounded-2xl flex items-center justify-between cursor-pointer transition-all ${
                          availableQty > 0
                            ? "border-white/5 hover:border-purple-500/40 hover:bg-zinc-900/80"
                            : "border-zinc-900 opacity-40 cursor-not-allowed"
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-2xl">{item.emoji}</span>
                          <div className="min-w-0">
                            <h5 className="font-bold text-xs text-white truncate">{item.name}</h5>
                            <p className="text-[9px] text-zinc-500 capitalize">{item.rarity}</p>
                          </div>
                        </div>
                        <Badge className="bg-zinc-950 text-zinc-300 font-extrabold text-xs">
                          {availableQty}
                        </Badge>
                      </div>
                    )
                  })}
                  {inventory.filter(i => i.id.startsWith('material-')).length === 0 && (
                    <div className="col-span-2 py-6 text-center text-zinc-600 text-xs italic font-serif">
                      Your bag is currently empty. Complete daily habits to gather reagents!
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* RECIPES CARD */}
            <Card className="bg-zinc-950/70 border-amber-900/30 shadow-2xl rounded-3xl">
              <CardHeader className="border-b border-white/5 pb-4">
                <CardTitle className="font-serif text-sm text-white">Known Recipes</CardTitle>
                <CardDescription className="text-zinc-400 text-xs">Formulas to brew active temporary buffs</CardDescription>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                {RECIPES.map(recipe => {
                  return (
                    <div
                      key={recipe.id}
                      onClick={() => selectRecipe(recipe)}
                      className="p-3.5 bg-zinc-900/40 border border-white/5 hover:border-purple-500/30 rounded-2xl transition-all cursor-pointer group"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className={`p-2.5 rounded-xl bg-gradient-to-br ${recipe.color} text-white text-xl shadow-md`}>
                            {recipe.emoji}
                          </div>
                          <div>
                            <h5 className="font-bold text-xs text-white group-hover:text-purple-400 transition-colors">{recipe.name}</h5>
                            <p className="text-[10px] text-zinc-400 leading-normal mt-0.5">{recipe.description}</p>
                          </div>
                        </div>
                      </div>

                      {/* Ingredients Requirements list */}
                      <div className="flex gap-2 flex-wrap mt-3 border-t border-white/5 pt-2.5">
                        {recipe.ingredients.map(req => {
                          const invItem = inventory.find(i => i.id === req.id)
                          const currentQty = invItem ? invItem.quantity : 0
                          const isMet = currentQty >= req.qty

                          return (
                            <Badge
                              key={req.id}
                              variant="outline"
                              className={`text-[10px] font-bold py-0.5 px-2 rounded-full flex items-center gap-1 border ${
                                isMet ? "border-emerald-900/20 bg-emerald-500/10 text-emerald-400" : "border-red-900/20 bg-red-500/10 text-red-400"
                              }`}
                            >
                              <span>{req.emoji}</span>
                              <span>{req.name} {currentQty}/{req.qty}</span>
                            </Badge>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </CardContent>
            </Card>

            {/* ACTIVE POTIONS CARD */}
            <Card className="bg-zinc-950/70 border-amber-900/30 shadow-2xl rounded-3xl">
              <CardHeader className="border-b border-white/5 pb-4">
                <CardTitle className="font-serif text-sm text-white">Active Modifiers</CardTitle>
                <CardDescription className="text-zinc-400 text-xs">Potions currently granting multipliers</CardDescription>
              </CardHeader>
              <CardContent className="p-4 space-y-2.5">
                {activeModifiers.map((mod, idx) => (
                  <div key={idx} className="p-3 bg-zinc-900/40 border border-white/5 rounded-2xl flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {mod.name.includes("Focus") ? <Zap className="w-4 h-4 text-cyan-400" /> :
                       mod.name.includes("Shield") || mod.name.includes("Aegis") ? <Shield className="w-4 h-4 text-amber-500" /> :
                       <Sparkles className="w-4 h-4 text-purple-400" />}
                      <div>
                        <h5 className="font-bold text-xs text-white">{mod.name}</h5>
                        <p className="text-[10px] text-zinc-400">{mod.effect}</p>
                      </div>
                    </div>
                    <Badge className="bg-zinc-950 text-zinc-500 text-[10px] border border-white/5">
                      Expires: {new Date(mod.expires_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Badge>
                  </div>
                ))}
                {activeModifiers.length === 0 && (
                  <div className="py-4 text-center text-zinc-600 text-xs italic font-serif">
                    No active elixirs or tonics. Stir the cauldron to brew!
                  </div>
                )}
              </CardContent>
            </Card>

          </div>

        </div>
      )}
    </div>
  )
}
