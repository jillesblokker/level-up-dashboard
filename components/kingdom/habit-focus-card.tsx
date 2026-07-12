"use client"

import { logger } from "@/lib/logger";
import { useState, useEffect, useCallback } from "react"
import { Sparkles, Check, Flame, Shield, HelpCircle, Trophy, Coins, Compass, Gift, RotateCcw, AlertCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useUser } from "@clerk/nextjs"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/components/ui/use-toast"
import { Progress } from "@/components/ui/progress"
import { getUserPreference, setUserPreference } from "@/lib/user-preferences-manager";

interface HabitFocusData {
  locationName: string;
  locationType: 'settlement' | 'town' | 'city' | 'megapolis';
  categories: string[];
  boundHabitId?: string;
  boundHabitTitle?: string;
  streak?: number;
  taxGold?: number;
  taxReagent?: string;
  discountUntil?: string | null;
  guildCharges?: number;
  guildBlessingUntil?: string | null;
  monumentName?: string;
  monumentProgress?: number; // 0 to 10
}

interface HabitFocusCardProps {
  locationName: string;
  locationType: 'settlement' | 'town' | 'city' | 'megapolis';
}

const CATEGORY_NAMES = ['might', 'knowledge', 'honor', 'castle', 'craft', 'vitality'];

const MONUMENT_TYPES = [
  { id: 'monument-might', name: 'Pantheon of Might', category: 'might', rewardDesc: 'A colossal weapon treasury chest.' },
  { id: 'monument-knowledge', name: 'Observatory of Knowledge', category: 'knowledge', rewardDesc: 'An arcane library relic chest.' },
  { id: 'monument-honor', name: 'Citadel of Honor', category: 'honor', rewardDesc: 'A knightly badge & shield chest.' },
  { id: 'monument-castle', name: 'Palace of the Castle', category: 'castle', rewardDesc: 'A grand stone & wood masonry crate.' },
  { id: 'monument-craft', name: 'Workshop of Crafting', category: 'craft', rewardDesc: 'A rare steel & tool stockpile.' },
  { id: 'monument-vitality', name: 'Garden of Vitality', category: 'vitality', rewardDesc: 'A magical potion & herb supply.' }
];

const formatLocationTitle = (name: string, type: string) => {
  const decoded = decodeURIComponent(name);
  
  const coordMatch = decoded.match(/^(settlement|town|city|megapolis)-(\d+)-(\d+)$/i);
  if (coordMatch && coordMatch[1]) {
    const locType = coordMatch[1];
    const x = coordMatch[2];
    const y = coordMatch[3];
    const typeLabel = locType.charAt(0).toUpperCase() + locType.slice(1);
    return `${typeLabel} (Grid ${x}, ${y})`;
  }

  const cleaned = decoded.replace(/-/g, ' ');
  return cleaned.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
};

export function HabitFocusCard({ locationName, locationType }: HabitFocusCardProps) {
  const { user } = useUser();

  // State
  const [focusData, setFocusData] = useState<HabitFocusData | null>(null);
  const [activeQuests, setActiveQuests] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('might');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedHabitId, setSelectedHabitId] = useState<string>('');
  const [selectedMonumentId, setSelectedMonumentId] = useState<string>('monument-might');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isCollecting, setIsCollecting] = useState(false);

  // Load configuration and quests
  const loadData = useCallback(async () => {
    if (!user?.id) return;
    try {
      // 1. Load active focus districts
      const allDistricts: any = await getUserPreference('habit_focus_districts') || {};
      const current = allDistricts[locationName];
      if (current) {
        setFocusData(current);
      } else {
        setFocusData(null);
      }

      // 2. Fetch quests
      const qRes = await fetch('/api/quests');
      if (qRes.ok) {
        const list = await qRes.json();
        if (Array.isArray(list)) {
          setActiveQuests(list);
        }
      }
    } catch (err) {
      logger.error('[HabitFocus] Failed to load data:', err);
    }
  }, [user?.id, locationName]);

  useEffect(() => {
    if (user?.id) {
      loadData();
    }
  }, [user?.id, loadData]);

  // Handle multi-select for categories (Towns & Cities)
  const handleToggleCategory = (cat: string) => {
    const limit = locationType === 'town' ? 2 : 3;
    setSelectedCategories(prev => {
      if (prev.includes(cat)) {
        return prev.filter(c => c !== cat);
      }
      if (prev.length >= limit) {
        return [...prev.slice(1), cat];
      }
      return [...prev, cat];
    });
  };

  const handleSetup = async () => {
    if (!user?.id || isUpdating) return;

    const allDistricts: any = await getUserPreference('habit_focus_districts') || {};
    let newFocus: HabitFocusData = {
      locationName,
      locationType,
      categories: []
    };

    if (locationType === 'settlement') {
      if (!selectedHabitId) {
        toast({
          title: "Select a Habit",
          description: "You must choose a daily habit to bind to the Streak Shrine.",
          variant: "destructive"
        });
        return;
      }
      const boundQuest = activeQuests.find(q => q.id === selectedHabitId);
      newFocus.categories = [selectedCategory];
      newFocus.boundHabitId = selectedHabitId;
      newFocus.boundHabitTitle = boundQuest?.title || boundQuest?.name || 'Daily Habit';
      newFocus.streak = 0;
      newFocus.taxGold = 0;
    } else if (locationType === 'town') {
      if (selectedCategories.length < 2) {
        toast({
          title: "Select 2 Categories",
          description: "Town districts must focus on exactly 2 categories.",
          variant: "destructive"
        });
        return;
      }
      newFocus.categories = selectedCategories;
      newFocus.discountUntil = null;
    } else if (locationType === 'city') {
      if (selectedCategories.length < 3) {
        toast({
          title: "Select 3 Categories",
          description: "City districts must focus on exactly 3 categories.",
          variant: "destructive"
        });
        return;
      }
      newFocus.categories = selectedCategories;
      newFocus.guildCharges = 0;
      newFocus.guildBlessingUntil = null;
    } else if (locationType === 'megapolis') {
      const mon = MONUMENT_TYPES.find(m => m.id === selectedMonumentId)!;
      newFocus.categories = [mon.category];
      newFocus.monumentName = mon.name;
      newFocus.monumentProgress = 0;
    }

    try {
      setIsUpdating(true);
      allDistricts[locationName] = newFocus;
      await setUserPreference('habit_focus_districts', allDistricts);
      toast({
        title: "Focus District Configured! ✨",
        description: `Successfully activated the Habit Focus at ${locationName.replace(/-/g, ' ')}.`
      });
      await loadData();
    } catch (err) {
      toast({
        title: "Setup failed",
        description: "Failed to configure focus district.",
        variant: "destructive"
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCollectTax = async () => {
    if (!user?.id || !focusData || isCollecting) return;
    const goldReward = focusData.taxGold || 0;
    const reagentReward = focusData.taxReagent;

    try {
      setIsCollecting(true);
      
      // Award Gold
      if (goldReward > 0) {
        await fetch('/api/character-stats', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ gold: goldReward })
        });
      }

      // Award Reagent
      if (reagentReward) {
        await fetch('/api/inventory', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ item: { id: reagentReward, quantity: 1 } })
        });
      }

      // Update state in preferences
      const allDistricts: any = await getUserPreference('habit_focus_districts') || {};
      if (allDistricts[locationName]) {
        allDistricts[locationName].taxGold = 0;
        allDistricts[locationName].taxReagent = undefined;
      }
      await setUserPreference('habit_focus_districts', allDistricts);

      toast({
        title: "Taxes Collected! 🪙📦",
        description: `Collected ${goldReward} Gold ${reagentReward ? 'and 1 crafting material' : ''} from the Settlement Shrine.`
      });
      
      window.dispatchEvent(new Event('character-inventory-update'));
      await loadData();
    } catch (err) {
      toast({
        title: "Collection failed",
        description: "Failed to collect taxes.",
        variant: "destructive"
      });
    } finally {
      setIsCollecting(false);
    }
  };

  const handleActivateBlessing = async () => {
    if (!user?.id || !focusData || isUpdating) return;
    if ((focusData.guildCharges || 0) < 5) return;

    try {
      setIsUpdating(true);
      const expiration = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // Active for 1 hour

      const allDistricts: any = await getUserPreference('habit_focus_districts') || {};
      if (allDistricts[locationName]) {
        allDistricts[locationName].guildCharges = 0;
        allDistricts[locationName].guildBlessingUntil = expiration;
      }
      await setUserPreference('habit_focus_districts', allDistricts);

      toast({
        title: "Guild Blessing Channelled! 🔥📜",
        description: "City Guild Blessing active: +20% Forge success & Double Citizen training XP for 1 hour!"
      });
      await loadData();
    } catch (err) {
      toast({
        title: "Blessing Activation Failed",
        description: "Altar magic channeling failed.",
        variant: "destructive"
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleClaimMonumentChest = async () => {
    if (!user?.id || !focusData || isCollecting) return;
    if ((focusData.monumentProgress || 0) < 10) return;

    const chestType = focusData.categories[0] || 'might';
    let rewards = [
      { id: 'material-water', quantity: 2 },
      { id: 'material-logs', quantity: 2 }
    ];

    if (chestType === 'might') {
      rewards = [
        { id: 'material-steel', quantity: 3 },
        { id: 'material-logs', quantity: 4 }
      ];
    } else if (chestType === 'knowledge') {
      rewards = [
        { id: 'material-crystal', quantity: 3 },
        { id: 'material-water', quantity: 3 }
      ];
    } else if (chestType === 'honor') {
      rewards = [
        { id: 'material-silver', quantity: 3 },
        { id: 'material-steel', quantity: 2 }
      ];
    } else if (chestType === 'castle') {
      rewards = [
        { id: 'material-stone', quantity: 4 },
        { id: 'material-logs', quantity: 4 }
      ];
    } else if (chestType === 'craft') {
      rewards = [
        { id: 'material-planks', quantity: 4 },
        { id: 'material-steel', quantity: 3 }
      ];
    } else if (chestType === 'vitality') {
      rewards = [
        { id: 'fish-rainbow', quantity: 2 },
        { id: 'material-water', quantity: 4 }
      ];
    }

    try {
      setIsCollecting(true);

      // Award 500 gold
      await fetch('/api/character-stats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gold: 500 })
      });

      // Award chests
      for (const item of rewards) {
        await fetch('/api/inventory', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ item: { id: item.id, quantity: item.quantity } })
        });
      }

      // Reset progress
      const allDistricts: any = await getUserPreference('habit_focus_districts') || {};
      if (allDistricts[locationName]) {
        allDistricts[locationName].monumentProgress = 0;
      }
      await setUserPreference('habit_focus_districts', allDistricts);

      toast({
        title: "Monument Treasure Claimed! 🏛️📦",
        description: "Claimed 500 Gold & premium materials chest! Monument construction project reset."
      });

      window.dispatchEvent(new Event('character-inventory-update'));
      await loadData();
    } catch (err) {
      toast({
        title: "Failed to claim monument chest",
        description: "Action failed.",
        variant: "destructive"
      });
    } finally {
      setIsCollecting(false);
    }
  };

  const handleDecommission = async () => {
    const confirm = window.confirm("Are you sure you want to decommission this Focus District? You will lose all active progress, streaks, and unclaimed rewards.");
    if (!confirm) return;

    try {
      const allDistricts: any = await getUserPreference('habit_focus_districts') || {};
      delete allDistricts[locationName];
      await setUserPreference('habit_focus_districts', allDistricts);
      toast({
        title: "District Decommissioned",
        description: "The district has been cleared."
      });
      await loadData();
    } catch (err) {
      console.error(err);
    }
  };

  // Filtered active quests matching selected category
  const categoryQuests = activeQuests.filter(q => 
    (q.category || '').toLowerCase() === selectedCategory.toLowerCase()
  );

  return (
    <Card className="bg-[#0f1115] border border-amber-950/20 rounded-3xl p-6 shadow-2xl relative overflow-hidden mb-6">
      
      {/* Background Lighting Flare */}
      <div className="absolute -top-12 -right-12 w-32 h-32 bg-amber-500/5 blur-3xl rounded-full pointer-events-none" />

      {focusData ? (
        /* Active Focus District Display */
        <div className="space-y-5 animate-in fade-in duration-500">
          
          <div className="flex justify-between items-start border-b border-white/5 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-950/20 border border-amber-500/20 flex items-center justify-center shrink-0">
                <Compass className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-amber-500 tracking-wider">
                  {locationType.charAt(0).toUpperCase() + locationType.slice(1)} Focus Altar
                </span>
                <h3 className="font-cardo font-bold text-base text-[#e5c158] mt-0.5">
                  {formatLocationTitle(locationName, locationType)}
                </h3>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDecommission}
              className="text-[10px] text-zinc-500 hover:text-red-400 font-bold"
            >
              Reset focus
            </Button>
          </div>

          {locationType === 'settlement' && (
            /* Settlement Streak Shrine Info */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Streak Shrine Status:</div>
                <div className="p-4 bg-zinc-950/60 rounded-xl border border-white/5 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-pulse shrink-0" />
                    <span className="font-bold text-xs text-white truncate max-w-[200px]" title={focusData.boundHabitTitle}>
                      {focusData.boundHabitTitle}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs font-bold pt-1">
                    <span className="text-zinc-500">Current Streak:</span>
                    <span className="text-orange-400">{focusData.streak || 0} Days 🔥</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Accumulated Settlement Taxes:</div>
                <div className="p-4 bg-zinc-950/60 rounded-xl border border-white/5 flex flex-col justify-between h-[84px]">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-zinc-400">Available Loot:</span>
                    <span className="text-amber-500">{focusData.taxGold || 0} Gold</span>
                  </div>
                  <Button
                    disabled={(focusData.taxGold || 0) === 0 || isCollecting}
                    onClick={handleCollectTax}
                    size="sm"
                    className="w-full h-8 text-[10px] font-extrabold uppercase bg-amber-600 hover:bg-amber-700 text-black rounded-lg"
                  >
                    {isCollecting ? 'Collecting...' : 'Collect Taxes'}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {locationType === 'town' && (
            /* Town Market Discounts */
            <div className="space-y-3">
              <div className="p-4 bg-zinc-950/60 rounded-xl border border-white/5 space-y-2">
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="text-zinc-400">Town Focus Categories:</span>
                  <div className="flex gap-1">
                    {focusData.categories.map(cat => (
                      <Badge key={cat} className="bg-amber-500/10 text-amber-500 border border-amber-500/20 text-[9px] uppercase tracking-wider font-extrabold">
                        {cat}
                      </Badge>
                    ))}
                  </div>
                </div>
                {focusData.discountUntil && new Date(focusData.discountUntil).getTime() > Date.now() ? (
                  <p className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" /> Town Shop active bonus: 10% Discount applied to all items in this town&apos;s shops!
                  </p>
                ) : (
                  <p className="text-[10px] text-zinc-500 font-semibold leading-relaxed">
                    Completing any habit under the <strong className="text-amber-500 capitalize">{focusData.categories.join(' or ')}</strong> categories will activate a 10% shop discount in this town for 4 hours.
                  </p>
                )}
              </div>
            </div>
          )}

          {locationType === 'city' && (
            /* City Guild Power and Blessings */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">City Focus Categories:</div>
                <div className="p-4 bg-zinc-950/60 rounded-xl border border-white/5 space-y-2.5 h-[94px]">
                  <div className="flex flex-wrap gap-1">
                    {focusData.categories.map(cat => (
                      <Badge key={cat} className="bg-amber-500/10 text-amber-500 border border-amber-500/20 text-[9px] uppercase tracking-wider font-extrabold">
                        {cat}
                      </Badge>
                    ))}
                  </div>
                  {focusData.guildBlessingUntil && new Date(focusData.guildBlessingUntil).getTime() > Date.now() ? (
                    <p className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5" /> Guild Blessing active! (+20% Forge rate & Double Training XP)
                    </p>
                  ) : (
                    <p className="text-[9px] text-zinc-500 leading-normal font-semibold">
                      Charge Guild Power by completing matching habits to channel blessings.
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Guild Power Altar:</div>
                <div className="p-4 bg-zinc-950/60 rounded-xl border border-white/5 space-y-3">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-zinc-400">Power Meter:</span>
                    <span className="text-amber-500">{focusData.guildCharges || 0} / 5 charges</span>
                  </div>
                  <Progress value={((focusData.guildCharges || 0) / 5) * 100} className="h-2 bg-zinc-900 border border-white/5 animate-pulse" indicatorClassName="bg-gradient-to-r from-amber-600 to-amber-400" />
                  
                  <Button
                    disabled={(focusData.guildCharges || 0) < 5 || isUpdating}
                    onClick={handleActivateBlessing}
                    size="sm"
                    className="w-full h-8 text-[10px] font-extrabold uppercase bg-amber-600 hover:bg-amber-700 text-black rounded-lg"
                  >
                    Activate Guild Blessing
                  </Button>
                </div>
              </div>
            </div>
          )}

          {locationType === 'megapolis' && (
            /* Megapolis Grand Monument Projects */
            <div className="space-y-3">
              <div className="p-4 bg-zinc-950/60 rounded-xl border border-white/5 space-y-4">
                <div className="flex justify-between items-start border-b border-white/5 pb-2">
                  <div>
                    <h4 className="font-cardo font-bold text-white text-sm">{focusData.monumentName}</h4>
                    <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider mt-0.5">
                      Monument Focus: {focusData.categories[0]} habits
                    </p>
                  </div>
                  <Badge className="bg-amber-600 text-black font-extrabold text-[8px]">Monument Project</Badge>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-zinc-400">Construction Progress:</span>
                    <span className="text-amber-500">{focusData.monumentProgress || 0} / 10 Habit completions</span>
                  </div>
                  <Progress value={((focusData.monumentProgress || 0) / 10) * 100} className="h-3 bg-zinc-900 border border-white/5" indicatorClassName="bg-gradient-to-r from-amber-600 to-amber-400" />
                </div>

                <Button
                  disabled={(focusData.monumentProgress || 0) < 10 || isCollecting}
                  onClick={handleClaimMonumentChest}
                  className={cn(
                    "w-full text-xs font-bold py-4 rounded-xl uppercase tracking-wider flex items-center justify-center gap-1.5",
                    (focusData.monumentProgress || 0) >= 10
                      ? "bg-gradient-to-r from-emerald-600 to-emerald-500 text-black font-extrabold shadow-lg hover:brightness-110"
                      : "bg-zinc-950 text-zinc-600 border border-zinc-800 cursor-not-allowed"
                  )}
                >
                  <Gift className="w-4 h-4 mr-1" /> Retrieve Monument Treasure Chest
                </Button>
              </div>
            </div>
          )}

        </div>
      ) : (
        /* Configuration setup view */
        <div className="space-y-5 animate-in fade-in duration-500">
          <div className="flex items-center gap-3.5 pb-4 border-b border-white/5">
            <div className="w-12 h-12 rounded-xl bg-amber-950/20 border border-amber-500/20 flex items-center justify-center shrink-0">
              <Compass className="w-6 h-6 text-amber-500" />
            </div>
            <div>
              <h3 className="font-cardo font-bold text-white text-sm">Configure Habit Focus District</h3>
              <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mt-1">
                {locationType.charAt(0).toUpperCase() + locationType.slice(1)}: {formatLocationTitle(locationName, locationType)}
              </p>
            </div>
          </div>

          {locationType === 'settlement' && (
            /* Settlement Streak Shrine Configuration */
            <div className="space-y-4">
              <p className="text-xs text-zinc-400 leading-relaxed font-medium bg-zinc-950/60 p-3.5 rounded-xl border border-white/5">
                <strong>Streak Shrine:</strong> Bind a daily habit quest to this settlement. Keep the streak alive by checking it off every day. Generates daily gold and resources as taxes!
              </p>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">1. Select Habit Category:</label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => {
                      setSelectedCategory(e.target.value);
                      setSelectedHabitId('');
                    }}
                    className="w-full bg-zinc-950 border border-zinc-850 text-zinc-300 rounded-lg p-2.5 text-xs font-bold"
                  >
                    {CATEGORY_NAMES.map(cat => (
                      <option key={cat} value={cat} className="capitalize">{cat}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">2. Select Active Quest:</label>
                  <select
                    value={selectedHabitId}
                    onChange={(e) => setSelectedHabitId(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-850 text-zinc-300 rounded-lg p-2.5 text-xs font-bold"
                  >
                    <option value="">-- Choose Quest --</option>
                    {categoryQuests.map(q => (
                      <option key={q.id} value={q.id}>{q.title || q.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {(locationType === 'town' || locationType === 'city') && (
            /* Town or City Multi-Category Configuration */
            <div className="space-y-4">
              <p className="text-xs text-zinc-400 leading-relaxed font-medium bg-zinc-950/60 p-3.5 rounded-xl border border-white/5">
                {locationType === 'town' ? (
                  <><strong>Town Market focus:</strong> Select exactly 2 habit categories. Completing habits in these categories triggers a 4-hour 10% discount in town shops.</>
                ) : (
                  <><strong>City Guild focus:</strong> Select exactly 3 habit categories. Completing habits charges the Guild Altar. Once fully charged (5 completions), trigger a +20% Forge rate and double citizen training XP blessing.</>
                )}
              </p>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                  Select {locationType === 'town' ? '2' : '3'} Habit Categories:
                </label>
                <div className="flex gap-2.5">
                  {CATEGORY_NAMES.map(cat => {
                    const isSelected = selectedCategories.includes(cat);
                    return (
                      <div
                        key={cat}
                        onClick={() => handleToggleCategory(cat)}
                        className={cn(
                          "px-4 py-2 rounded-xl border text-xs font-bold capitalize cursor-pointer select-none transition-all",
                          isSelected
                            ? "bg-amber-950/20 border-amber-500/50 text-amber-400 shadow-inner"
                            : "bg-zinc-950/50 border-white/5 text-zinc-400 hover:border-zinc-800"
                        )}
                      >
                        {cat}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {locationType === 'megapolis' && (
            /* Megapolis Grand Monument Commissioning */
            <div className="space-y-4">
              <p className="text-xs text-zinc-400 leading-relaxed font-medium bg-zinc-950/60 p-3.5 rounded-xl border border-white/5">
                <strong>Grand Monument:</strong> Select a majestic monument project. Complete 10 habits of the matching category to construct the monument, unlocking massive gold & material rewards.
              </p>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Select Monument Project:</label>
                <div className="grid grid-cols-2 gap-2.5">
                  {MONUMENT_TYPES.map(m => {
                    const isSelected = selectedMonumentId === m.id;
                    return (
                      <div
                        key={m.id}
                        onClick={() => setSelectedMonumentId(m.id)}
                        className={cn(
                          "p-3 rounded-xl border text-left cursor-pointer transition-all flex flex-col gap-1",
                          isSelected
                            ? "bg-amber-950/20 border-amber-500/50"
                            : "bg-zinc-950/50 border-white/5 hover:border-zinc-800"
                        )}
                      >
                        <h4 className="font-bold text-white text-xs">{m.name}</h4>
                        <p className="text-[9px] text-zinc-500 font-bold uppercase">Focus: {m.category} habits</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Action Trigger */}
          <div className="pt-4 border-t border-white/5 mt-4">
            <Button
              disabled={isUpdating}
              onClick={handleSetup}
              className="w-full text-xs font-bold py-5 rounded-xl uppercase tracking-wider bg-gradient-to-r from-amber-600 to-amber-500 text-black font-extrabold shadow-lg hover:brightness-110 active:scale-[0.98]"
            >
              {isUpdating ? '⏳ Activating Altar...' : '✨ Activate Focus District'}
            </Button>
          </div>
        </div>
      )}

    </Card>
  );
}
