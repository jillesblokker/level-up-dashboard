"use client"

import { logger } from "@/lib/logger";

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useUser } from "@clerk/nextjs"
import { motion } from "framer-motion"
import Image from "next/image"
import { Users, UserPlus, Mail, Shield, Sword, Scroll, Trophy, Target, Star, Crown, Zap, Heart, Book, Hammer, Coins, Gift, HelpCircle, UserCheck, Flame, Dices } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { SigilCrestBadge } from '@/components/character/sigil-crest';
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import { HeaderSection } from "@/components/HeaderSection"
import { PageGuide } from "@/components/page-guide"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreHorizontal } from "lucide-react"
import { getCharacterStats } from "@/lib/character-stats-service"
import { calculateLevelFromExperience } from "@/types/character"
import dynamic from 'next/dynamic'
import { AllianceTitanRaidModal } from "@/components/social/AllianceTitanRaidModal";
import { AllianceComboBanner } from "@/components/alliance/alliance-combo-banner";
import { FriendDareModal } from "@/components/social/FriendDareModal";
import { useAchievementCatchUp } from "@/hooks/use-achievement-catch-up";

// Dynamically import heavy components to prevent initialization order issues (ReferenceError)
const AllianceDashboard = dynamic(() => import("@/components/alliance-dashboard"), { 
    ssr: false,
    loading: () => <div className="h-48 flex items-center justify-center text-amber-500/50 animate-pulse bg-zinc-950 rounded-xl">Loading fellowships...</div>
})
const Leaderboard = dynamic(() => import("@/components/leaderboard"), { 
    ssr: false,
    loading: () => <div className="h-48 flex items-center justify-center text-amber-500/50 animate-pulse bg-zinc-950 rounded-xl">Loading Leaderboards...</div>
})
const ActivityFeed = dynamic(() => import("@/components/activity-feed"), { 
    ssr: false,
    loading: () => <div className="h-48 flex items-center justify-center text-amber-500/50 animate-pulse bg-zinc-950 rounded-xl">Loading Activity Record...</div>
})
const HouseCupPanel = dynamic(() => import("@/components/house-cup/house-cup-panel").then(m => m.HouseCupPanel), { 
    ssr: false,
    loading: () => <div className="h-48 flex items-center justify-center text-amber-500/50 animate-pulse bg-zinc-950 rounded-xl">Loading House Cup...</div>
})
const TavernDiceGame = dynamic(() => import("@/components/tavern-dice-game").then(m => m.TavernDiceGame), { 
    ssr: false,
    loading: () => <div className="h-48 flex items-center justify-center text-amber-500/50 animate-pulse bg-zinc-950 rounded-xl">Loading Tavern Dice Game...</div>
})
import { GiftModal } from "@/components/gift-modal"
import { TEXT_CONTENT } from '@/lib/text-content'
import SocialLoading from './loading';


import { getCurrentTitle } from "@/lib/title-manager"

// ... types
interface Friend {
    id: string; // Friendship ID
    friendId: string; // User ID
    username: string;
    imageUrl: string;
    status: 'accepted' | 'pending';
    isSender: boolean;
    createdAt?: string;
    title?: string;
    lastSeen?: string;
    stats?: {
        level: number;
        xp: number;
        questsFinished: number;
        giftsShared: number;
        challengesFinished?: number;
        streak?: number;
        allianceName?: string | null;
    };
}

const CATEGORY_ICONS: Record<string, any> = {
    might: Sword,
    knowledge: Book,
    honor: Crown,
    castle: Shield,
    craft: Hammer,
    vitality: Heart,
    wellness: Zap,
    social: Users,
    creative: Star,
    mental: Book,
    physical: Sword
};




const CATEGORY_COLORS: Record<string, string> = {
    might: "text-red-500",
    knowledge: "text-blue-500",
    honor: "text-amber-500",
    castle: "text-zinc-500",
    craft: "text-orange-500",
    vitality: "text-green-500",
    wellness: "text-cyan-500",
    social: "text-pink-500",
    creative: "text-purple-500",
    mental: "text-indigo-500",
    physical: "text-rose-500"
};

export default function AlliesPage() {
    const { user, isLoaded } = useUser();

    const router = useRouter();
    const { toast } = useToast();
    const [activeTab, setActiveTab] = useState("house-cup");
    const [friends, setFriends] = useState<Friend[]>([]);
    const [requests, setRequests] = useState<Friend[]>([]);
    const [isLoading, setIsLoading] = useState(true);



    // Search state
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    // Quest Modal state
    const [questModalOpen, setQuestModalOpen] = useState(false);
    const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);
    const [questForm, setQuestForm] = useState({
        title: "",
        description: "",
        difficulty: "medium",
        category: "physical",
        xp: 50,
        gold: 10
    });

    // Challenge Modal state
    const [challengeModalOpen, setChallengeModalOpen] = useState(false);
    const [challengeForm, setChallengeForm] = useState({
        name: "",
        description: "",
        difficulty: "medium",
        category: "Push/Legs/Core",
        baseGoal: "",
        milestoneGoal: ""
    });

    // Comparison Modal state
    const [compareModalOpen, setCompareModalOpen] = useState(false);
    const [compareStats, setCompareStats] = useState<any>(null);
    const [myStats, setMyStats] = useState<any>({
        level: 1,
        gold: 0,
        xp: 0,
        quests: { total: 0, breakdown: {} },
        challenges: { total: 0, breakdown: {} },
        milestones: { total: 0, breakdown: {} }
    });
    const [coverImage, setCoverImage] = useState<string>('');
    const [giftModalOpen, setGiftModalOpen] = useState(false);
    const [titanModalOpen, setTitanModalOpen] = useState(false);

    // Import achievement catch-up hook
    const { triggerCatchUp } = useAchievementCatchUp();

    useEffect(() => {
        if (user?.id) {
            fetchFriends();
            fetchMyStats();
            // Trigger achievement catch-up when visiting social page
            triggerCatchUp(true);
        }

        // Load cover image from localStorage
        const savedImage = localStorage.getItem('allies-cover-image');
        if (savedImage) {
            setCoverImage(savedImage);
        } else {
            setCoverImage('/images/headers/allies-cover.webp');
        }
    }, [user?.id, triggerCatchUp]);

    if (!isLoaded || isLoading) return <SocialLoading />;


    async function fetchMyStats() {
        if (!user?.id) return;
        try {
            const res = await fetch(`/api/friends/stats?friendId=${user.id}`);
            const data = await res.json();
            if (res.ok) {
                setMyStats(data.stats);
            }
        } catch (error) {
            logger.error("Error fetching my stats:", error);
            // Fallback to local stats if API fails
            const stats = getCharacterStats();
            const level = calculateLevelFromExperience(stats.experience);
            setMyStats({
                level,
                gold: stats.gold,
                xp: stats.experience,
                quests: { total: 0, breakdown: {} },
                challenges: { total: 0, breakdown: {} },
                milestones: { total: 0, breakdown: {} }
            });
        }
    }

    const handleImageUpload = async (file: File) => {
        const reader = new FileReader();
        reader.onload = async (event: ProgressEvent<FileReader>) => {
            if (event.target?.result) {
                const imageData = event.target.result as string;
                setCoverImage(imageData);
                localStorage.setItem('allies-cover-image', imageData);
            }
        };
        reader.readAsDataURL(file);
    };

    async function fetchFriends() {
        try {
            const res = await fetch('/api/friends');
            const data = await res.json();
            if (res.ok) {
                setFriends(data.friends || []);
                setRequests(data.requests || []);
            }
        } catch (error) {
            logger.error("Error fetching friends:", error);
        } finally {
            setIsLoading(false);
        }
    }

    const handleSearch = async () => {
        if (searchQuery.length < 3) return;
        setIsSearching(true);
        try {
            const res = await fetch(`/api/users/search?query=${encodeURIComponent(searchQuery)}`);
            const data = await res.json();
            if (res.ok) {
                setSearchResults(data.users || []);
            }
        } catch (error) {
            logger.error("Error searching users:", error);
        } finally {
            setIsSearching(false);
        }
    };

    const sendFriendRequest = async (targetUserId: string) => {
        try {
            const res = await fetch('/api/friends', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ targetUserId })
            });

            if (res.ok) {
                toast({ title: TEXT_CONTENT.social.toasts.requestSent, description: TEXT_CONTENT.social.toasts.requestSentDesc });
                // Remove from search results to prevent duplicate sending
                setSearchResults(prev => prev.filter(u => u.id !== targetUserId));
            } else {
                const error = await res.json();
                if (res.status === 500) {
                    toast({
                        title: "System Update Required",
                        description: "The social features database tables are missing. Please run the migration script.",
                        variant: "destructive",
                        duration: 10000
                    });
                } else {
                    toast({ title: TEXT_CONTENT.social.toasts.error, description: error.error || "Failed to send request", variant: "destructive" });
                }
            }
        } catch (error) {
            toast({ title: TEXT_CONTENT.social.toasts.error, description: "Failed to send request. Check console for details.", variant: "destructive" });
        }
    };

    const respondToRequest = async (friendshipId: string, action: 'accept' | 'reject') => {
        try {
            const res = await fetch(`/api/friends/${friendshipId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action })
            });

            if (res.ok) {
                toast({
                    title: action === 'accept' ? TEXT_CONTENT.social.toasts.friendAdded : TEXT_CONTENT.social.toasts.requestDeclined,
                    description: action === 'accept' ? TEXT_CONTENT.social.toasts.friendAddedDesc : TEXT_CONTENT.social.toasts.requestDeclinedDesc
                });
                fetchFriends(); // Refresh lists
            }
        } catch (error) {
            toast({ title: "Error", description: "Failed to respond", variant: "destructive" });
        }
    };

    const removeFriend = async (friendshipId: string) => {
        if (!confirm(TEXT_CONTENT.social.friendCard.actions.remove.confirm)) return;
        try {
            const res = await fetch(`/api/friends/${friendshipId}`, {
                method: 'DELETE'
            });
            if (res.ok) {
                toast({ title: TEXT_CONTENT.social.friendCard.actions.remove.title, description: TEXT_CONTENT.social.friendCard.actions.remove.success });
                setFriends(prev => prev.filter(f => f.id !== friendshipId));
            }
        } catch (error) {
            toast({ title: "Error", description: "Failed to remove friend", variant: "destructive" });
        }
    };

    const openQuestModal = (friend: Friend) => {
        setSelectedFriend(friend);
        setQuestModalOpen(true);
    };

    const openChallengeModal = (friend: Friend) => {
        setSelectedFriend(friend);
        setChallengeModalOpen(true);
    };

    const sendChallenge = async () => {
        if (!selectedFriend) return;
        try {
            const res = await fetch('/api/challenges/friend', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    friendId: selectedFriend.friendId,
                    name: challengeForm.name,
                    description: challengeForm.description,
                    difficulty: challengeForm.difficulty,
                    category: challengeForm.category,
                    baseGoal: challengeForm.baseGoal,
                    milestoneGoal: challengeForm.milestoneGoal
                })
            });

            if (res.ok) {
                toast({ title: "Challenge Sent! ⚔️", description: `You have challenged ${selectedFriend.username} to a duel.` });
                setChallengeModalOpen(false);
                setChallengeForm({
                    name: "",
                    description: "",
                    difficulty: "medium",
                    category: "Push/Legs/Core",
                    baseGoal: "",
                    milestoneGoal: ""
                });
            } else {
                toast({ title: "Failed to send challenge", description: "Something went wrong.", variant: "destructive" });
            }
        } catch (error) {
            toast({ title: "Error", description: "Failed to send challenge.", variant: "destructive" });
        }
    };

    const sendQuest = async () => {
        if (!selectedFriend) return;
        try {
            const res = await fetch('/api/quests/friend', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    friendId: selectedFriend.friendId,
                    ...questForm,
                    rewards: { xp: questForm.xp, gold: questForm.gold }
                })
            });

            if (res.ok) {
                toast({ title: "Quest Sent", description: TEXT_CONTENT.social.modals.quest.toast.success.replace('{username}', selectedFriend.username) });
                setQuestModalOpen(false);
                setQuestForm({
                    title: "",
                    description: "",
                    difficulty: "medium",
                    category: "physical",
                    xp: 50,
                    gold: 10
                });
            } else {
                toast({ title: TEXT_CONTENT.social.toasts.error, description: TEXT_CONTENT.social.modals.quest.toast.error, variant: "destructive" });
            }
        } catch (error) {
            toast({ title: TEXT_CONTENT.social.toasts.error, description: TEXT_CONTENT.social.modals.quest.toast.error, variant: "destructive" });
        }
    };

    const handleHire = async (friend: Friend) => {
        try {
            const res = await fetch('/api/mercenaries/hire', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ friendId: friend.friendId })
            });

            const data = await res.json();
            if (res.ok) {
                toast({
                    title: "Mercenary Hired!",
                    description: `${friend.username} joined your party! +20% ${data.buff.stat} for 24h.`,
                    className: "bg-amber-900 border-amber-500 text-amber-100"
                });
            } else {
                toast({ title: "Hire Failed", description: data.error || "Could not hire friend", variant: "destructive" });
            }
        } catch (error) {
            toast({ title: "Error", description: "Failed to connect to the Tavern", variant: "destructive" });
        }
    };

    const openCompareModal = async (friend: Friend) => {
        setSelectedFriend(friend);
        setCompareModalOpen(true);
        setCompareStats(null);

        try {
            const res = await fetch(`/api/friends/stats?friendId=${friend.friendId}`);
            const data = await res.json();
            if (res.ok) {
                setCompareStats(data.stats);
            }
        } catch (error) {
            logger.error("Error fetching stats:", error);
        }
    };

    return (
        <div className="min-h-screen thrivehaven-page-bg text-zinc-100 pb-28 md:pb-12">
            <HeaderSection
                title={TEXT_CONTENT.social.header.title}
                subtitle={TEXT_CONTENT.social.header.subtitle}
                imageSrc={coverImage || "/images/headers/allies-header.webp"}
                canEdit={!!user?.id}
                onImageUpload={handleImageUpload}
                defaultBgColor="bg-amber-900"
                shouldRevealImage={true}
                guideComponent={
                    <PageGuide
                        title={TEXT_CONTENT.social.header.guide.title}
                        subtitle={TEXT_CONTENT.social.header.guide.subtitle}
                        sections={[
                            {
                                title: "Fellowships",
                                icon: Shield,
                                content: TEXT_CONTENT.social.header.guide.sections.alliances
                            },
                            {
                                title: "Sending Quests",
                                icon: Scroll,
                                content: TEXT_CONTENT.social.header.guide.sections.sendingQuests
                            },
                            {
                                title: "Leaderboards",
                                icon: Trophy,
                                content: TEXT_CONTENT.social.header.guide.sections.leaderboards
                            },
                            {
                                title: "Chronicles",
                                icon: Book,
                                content: TEXT_CONTENT.social.header.guide.sections.chronicles
                            }
                        ]}
                    />
                }
            />

            <div className="container mx-auto p-4 max-w-7xl space-y-6">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList 
                        className="flex h-14 bg-zinc-950 border border-amber-900/20 p-1.5 rounded-2xl mb-8 w-full md:w-auto overflow-x-auto overflow-y-hidden justify-start no-scrollbar gap-2 md:gap-0"
                        style={{ WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none', msOverflowStyle: 'none', touchAction: 'pan-x' }}
                    >
                        <TabsTrigger value="house-cup" className="flex items-center gap-2 py-3 h-full px-6 rounded-xl text-xs font-bold uppercase tracking-widest transition-all whitespace-nowrap min-h-[44px]">
                            <Trophy className="w-4 h-4 text-amber-400" />
                            House Cup
                        </TabsTrigger>
                        <TabsTrigger value="alliances" className="flex items-center gap-2 py-3 h-full px-6 rounded-xl text-xs font-bold uppercase tracking-widest transition-all whitespace-nowrap min-h-[44px]">
                            <Shield className="w-4 h-4 text-amber-500" />
                            Fellowships
                        </TabsTrigger>
                        <TabsTrigger value="allies" className="flex items-center gap-2 py-3 h-full px-6 rounded-xl text-xs font-bold uppercase tracking-widest transition-all whitespace-nowrap min-h-[44px]">
                            <Users className="w-4 h-4" />
                            {TEXT_CONTENT.social.tabs.allies}
                            {friends.length > 0 && <Badge variant="secondary" className="ml-1">{friends.length}</Badge>}
                        </TabsTrigger>
                        <TabsTrigger value="legends" className="flex items-center gap-2 py-3 h-full px-6 rounded-xl text-xs font-bold uppercase tracking-widest transition-all whitespace-nowrap min-h-[44px]">
                            <Crown className="w-4 h-4 text-amber-300" />
                            Legends
                        </TabsTrigger>
                        <TabsTrigger value="tavern-dice" className="flex items-center gap-2 py-3 h-full px-6 rounded-xl text-xs font-bold uppercase tracking-widest transition-all whitespace-nowrap min-h-[44px]">
                            <Dices className="w-4 h-4 text-amber-400" />
                            Dice
                        </TabsTrigger>
                    </TabsList>

                    {/* HOUSE CUP TAB */}
                    <TabsContent value="house-cup" className="space-y-6 max-w-6xl mx-auto">
                        {/* Live 1v1 Friend Habit Race Sprint Banner */}
                        <div className="p-5 rounded-2xl bg-gradient-to-r from-red-950/40 via-amber-950/30 to-zinc-950 border border-amber-500/40 text-amber-100 flex flex-col md:flex-row items-center justify-between gap-4 shadow-xl font-serif">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-full bg-amber-500/20 border border-amber-500/50 flex items-center justify-center text-2xl shrink-0 animate-bounce">
                                    ⚔️
                                </div>
                                <div>
                                    <h3 className="font-medieval text-lg font-bold text-amber-300">1v1 Virtue Duel Daily Habit Race</h3>
                                    <p className="text-xs text-zinc-300 mt-0.5">
                                        First friend to reach their 5/10 daily habit sweet spot wins <span className="font-bold text-amber-400">+10 House Cup Virtue Points</span> for both players!
                                    </p>
                                </div>
                            </div>
                            <Badge className="bg-amber-600/30 border border-amber-400/60 text-amber-300 font-bold px-4 py-1.5 text-xs uppercase tracking-widest shrink-0">
                                Race Active Today
                            </Badge>
                        </div>
                        <HouseCupPanel />
                    </TabsContent>

                    {/* FELLOWSHIPS TAB */}
                    <TabsContent value="alliances" className="space-y-6">
                        <AllianceComboBanner />
                        <AllianceDashboard />
                    </TabsContent>

                    {/* LEGENDS TAB */}
                    <TabsContent value="legends" className="space-y-6">
                        <Leaderboard />
                        <ActivityFeed />
                    </TabsContent>

                    {/* DICE TAB */}
                    <TabsContent value="tavern-dice" className="space-y-4 max-w-4xl mx-auto">
                        <TavernDiceGame />
                    </TabsContent>

                    {/* MY FRIENDS TAB */}
                    <TabsContent value="allies" className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                            {/* Left Column: Active Friends Carousel (Mobile & Desktop) */}
                            <div className="md:col-span-7 space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-bold text-amber-300 font-serif flex items-center gap-2">
                                        <Users className="w-5 h-5 text-amber-400" />
                                        Active friend circle
                                    </h3>
                                    <Badge variant="outline" className="border-amber-500/30 text-amber-400 font-mono text-xs">
                                        {friends.length} friends
                                    </Badge>
                                </div>

                                {friends.length === 0 ? (
                                    <Card className="border border-amber-900/30 bg-zinc-950/80 p-6 text-center space-y-3">
                                        <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400 font-bold text-xl">
                                            👥
                                        </div>
                                        <h4 className="text-base font-bold text-amber-300">No friends in circle yet</h4>
                                        <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                                            Search for friends using the invite section to build your habit circle and share House Cup virtue boosts!
                                        </p>
                                    </Card>
                                ) : (
                                    <div className="flex overflow-x-auto snap-x snap-mandatory gap-4 pb-3 custom-scrollbar mobile-scroll-hide">
                                        {friends.map(friend => {
                                            const level = friend.stats?.level || 0;
                                            const titleInfo = getCurrentTitle(level);

                                            return (
                                                <div key={friend.id} className="snap-start w-[85vw] max-w-[320px] shrink-0">
                                                    <Card className="overflow-hidden border border-amber-900/30 hover:border-amber-500/40 transition-all duration-300 flex flex-col group/card shadow-sm hover:shadow-md bg-zinc-950/90 h-full">
                                                        <CardContent className="p-0 flex-1 flex flex-col">
                                                            {/* Header */}
                                                            <div className="p-4 flex items-center gap-3 border-b border-zinc-800/60 bg-gradient-to-r from-amber-950/20 to-transparent">
                                                                <div className="relative">
                                                                    <Avatar className="h-10 w-10 border border-amber-500/30 shadow-sm">
                                                                        <AvatarImage src={friend.imageUrl} />
                                                                        <AvatarFallback className="bg-amber-500/10 text-amber-400 font-bold text-xs">{friend.username.substring(0, 2).toUpperCase()}</AvatarFallback>
                                                                    </Avatar>
                                                                    <div className={cn(
                                                                        "absolute bottom-0 right-0 w-3 h-3 rounded-full border border-zinc-950",
                                                                        !friend.lastSeen ? "bg-zinc-500" :
                                                                            (Date.now() - new Date(friend.lastSeen).getTime() < 5 * 60 * 1000) ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" :
                                                                                (Date.now() - new Date(friend.lastSeen).getTime() < 24 * 60 * 60 * 1000) ? "bg-amber-400" : "bg-zinc-500"
                                                                    )} />
                                                                </div>

                                                                <div className="flex-1 min-w-0">
                                                                    <h4 className="font-bold text-sm text-zinc-100 truncate leading-none mb-1">{friend.username}</h4>
                                                                    <p className="text-[10px] text-zinc-400 font-mono">
                                                                        Level {level} • {titleInfo.name}
                                                                    </p>
                                                                    <div className="mt-1 flex items-center gap-1">
                                                                        <Badge variant="outline" className="text-[8px] border-amber-500/40 text-amber-300 bg-amber-950/40 font-mono font-bold">
                                                                            ⚔️ Rivalry: 3W - 1L (+10 Virtue Pts)
                                                                        </Badge>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* Hero - Character Visual */}
                                                            <div className="py-4 flex flex-col items-center justify-center bg-gradient-to-b from-zinc-950 via-amber-950/10 to-zinc-950 flex-1 relative">
                                                                <div className="relative w-24 h-24 mb-2 drop-shadow-md hover:scale-105 transition-transform">
                                                                    <Image
                                                                        src={`/images/character/${titleInfo.id}.webp`}
                                                                        alt={titleInfo.name}
                                                                        fill
                                                                        className="object-contain"
                                                                    />
                                                                </div>
                                                            </div>

                                                            {/* Actions */}
                                                            <div className="p-3 grid grid-cols-2 gap-2 bg-zinc-900/60 border-t border-zinc-800/80">
                                                                <Button
                                                                    variant="default"
                                                                    size="sm"
                                                                    className="w-full text-xs font-bold bg-amber-500 hover:bg-amber-600 text-zinc-950"
                                                                    onClick={() => router.push(`/kingdom?visit=${friend.friendId}`)}
                                                                >
                                                                    <Crown className="w-3.5 h-3.5 mr-1" />
                                                                    Visit
                                                                </Button>
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    className="w-full text-xs font-bold border-amber-900/40 text-amber-400 hover:bg-amber-950/20"
                                                                    onClick={() => openQuestModal(friend)}
                                                                >
                                                                    <Scroll className="w-3.5 h-3.5 mr-1" />
                                                                    Quest
                                                                </Button>
                                                            </div>
                                                        </CardContent>
                                                    </Card>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            {/* Right Column: Invite Section & Requests Registry */}
                            <div className="md:col-span-5 space-y-6">
                                {/* Invite Section */}
                                <Card className="border border-amber-900/30 bg-zinc-950/80">
                                    <CardHeader className="pb-3">
                                        <CardTitle className="text-base font-bold text-amber-300 flex items-center gap-2">
                                            <UserPlus className="w-4 h-4 text-amber-400" />
                                            Invite an Ally
                                        </CardTitle>
                                        <CardDescription className="text-xs text-zinc-400">
                                            Search for players by username to send friend invites.
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="flex gap-2">
                                            <Input
                                                placeholder="Search username..."
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                                className="bg-zinc-900 border-zinc-800 text-xs"
                                            />
                                            <Button onClick={handleSearch} disabled={isSearching} size="sm" className="bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold shrink-0">
                                                {isSearching ? "Searching..." : "Search"}
                                            </Button>
                                        </div>

                                        {searchResults.length > 0 && (
                                            <div className="space-y-2">
                                                {searchResults.map(user => (
                                                    <div key={user.id} className="flex items-center justify-between p-2.5 rounded-xl border border-zinc-800 bg-zinc-900/60">
                                                        <div className="flex items-center gap-2.5 min-w-0">
                                                            <Avatar className="h-8 w-8">
                                                                <AvatarImage src={user.imageUrl} />
                                                                <AvatarFallback className="text-xs">{user.username.substring(0, 2).toUpperCase()}</AvatarFallback>
                                                            </Avatar>
                                                            <span className="font-medium text-xs text-zinc-200 truncate">{user.username}</span>
                                                        </div>
                                                        <Button size="sm" className="text-xs bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold h-8" onClick={() => sendFriendRequest(user.id)}>
                                                            <UserPlus className="w-3.5 h-3.5 mr-1" /> Add
                                                        </Button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>

                                {/* Requests Registry */}
                                <Card className="border border-amber-900/30 bg-zinc-950/80">
                                    <CardHeader className="pb-3">
                                        <CardTitle className="text-base font-bold text-amber-300 flex items-center gap-2">
                                            <Mail className="w-4 h-4 text-amber-400" />
                                            Requests Registry
                                            {requests.length > 0 && <Badge variant="destructive" className="ml-1 text-[10px]">{requests.length}</Badge>}
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        {requests.length === 0 ? (
                                            <div className="border border-amber-900/20 bg-gradient-to-b from-amber-950/10 via-zinc-950 to-zinc-900/50 rounded-2xl p-5 text-center space-y-2">
                                                <div className="w-10 h-10 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto text-xl">
                                                    📜
                                                </div>
                                                <h4 className="text-sm font-bold text-amber-300 font-serif">Registry Clear</h4>
                                                <p className="text-[11px] text-zinc-400 max-w-xs mx-auto leading-relaxed">
                                                    No pending ally invitations. Send requests using the invite form above!
                                                </p>
                                            </div>
                                        ) : (
                                            <div className="space-y-3">
                                                {requests.map(req => (
                                                    <div key={req.id} className="p-3 rounded-xl border border-zinc-800 bg-zinc-900/60 flex items-center justify-between">
                                                        <div className="flex items-center gap-2.5">
                                                            <Avatar className="h-8 w-8">
                                                                <AvatarImage src={req.imageUrl} />
                                                                <AvatarFallback className="text-xs">{req.username.substring(0, 2).toUpperCase()}</AvatarFallback>
                                                            </Avatar>
                                                            <div>
                                                                <h4 className="font-semibold text-xs text-zinc-200">{req.username}</h4>
                                                                <p className="text-[10px] text-zinc-400">
                                                                    {req.isSender ? "Outgoing invite" : "Incoming invite"}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <div className="flex gap-1.5">
                                                            {req.isSender ? (
                                                                <Button size="sm" variant="outline" className="text-xs h-7 px-2 border-zinc-700" onClick={() => removeFriend(req.id)}>
                                                                    Cancel
                                                                </Button>
                                                            ) : (
                                                                <>
                                                                    <Button size="sm" className="text-xs h-7 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold" onClick={() => respondToRequest(req.id, 'accept')}>
                                                                        Accept
                                                                    </Button>
                                                                    <Button size="sm" variant="ghost" className="text-xs h-7 px-2 text-zinc-400 hover:text-zinc-200" onClick={() => respondToRequest(req.id, 'reject')}>
                                                                        Decline
                                                                    </Button>
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>
            </div>

            {/* SEND QUEST MODAL */}
            <Dialog open={questModalOpen} onOpenChange={setQuestModalOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>{TEXT_CONTENT.social.modals.quest.title.replace('{username}', selectedFriend?.username || '')}</DialogTitle>
                        <DialogDescription>{TEXT_CONTENT.social.modals.quest.description}</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>{TEXT_CONTENT.social.modals.quest.form.title}</Label>
                            <Input
                                placeholder={TEXT_CONTENT.social.modals.quest.form.titlePlaceholder}
                                value={questForm.title}
                                onChange={(e) => setQuestForm({ ...questForm, title: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>{TEXT_CONTENT.social.modals.quest.form.description}</Label>
                            <Textarea
                                placeholder={TEXT_CONTENT.social.modals.quest.form.descriptionPlaceholder}
                                value={questForm.description}
                                onChange={(e) => setQuestForm({ ...questForm, description: e.target.value })}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>{TEXT_CONTENT.social.modals.quest.form.difficulty}</Label>
                                <Select
                                    value={questForm.difficulty}
                                    onValueChange={(val) => setQuestForm({ ...questForm, difficulty: val })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="easy">Easy</SelectItem>
                                        <SelectItem value="medium">Medium</SelectItem>
                                        <SelectItem value="hard">Hard</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>{TEXT_CONTENT.social.modals.quest.form.category}</Label>
                                <Select
                                    value={questForm.category}
                                    onValueChange={(val) => setQuestForm({ ...questForm, category: val })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="physical">Physical</SelectItem>
                                        <SelectItem value="mental">Mental</SelectItem>
                                        <SelectItem value="creative">Creative</SelectItem>
                                        <SelectItem value="social">Social</SelectItem>
                                        <SelectItem value="might">Might</SelectItem>
                                        <SelectItem value="knowledge">Knowledge</SelectItem>
                                        <SelectItem value="honor">Honor</SelectItem>
                                        <SelectItem value="castle">Castle</SelectItem>
                                        <SelectItem value="craft">Craft</SelectItem>
                                        <SelectItem value="vitality">Vitality</SelectItem>
                                        <SelectItem value="wellness">Wellness</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="flex items-center gap-2">
                                    <Star className="w-4 h-4 text-blue-500" /> {TEXT_CONTENT.social.modals.quest.form.xpReward}
                                </Label>
                                <Input
                                    type="number"
                                    min="0"
                                    value={questForm.xp}
                                    onChange={(e) => setQuestForm({ ...questForm, xp: parseInt(e.target.value) || 0 })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="flex items-center gap-2">
                                    <Coins className="w-4 h-4 text-yellow-500" /> {TEXT_CONTENT.social.modals.quest.form.goldReward}
                                </Label>
                                <Input
                                    type="number"
                                    min="0"
                                    value={questForm.gold}
                                    onChange={(e) => setQuestForm({ ...questForm, gold: parseInt(e.target.value) || 0 })}
                                />
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setQuestModalOpen(false)}>{TEXT_CONTENT.social.modals.quest.form.cancel}</Button>
                        <Button onClick={sendQuest}>{TEXT_CONTENT.social.modals.quest.form.submit}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* SEND CHALLENGE MODAL */}
            <Dialog open={challengeModalOpen} onOpenChange={setChallengeModalOpen}>
                <DialogContent className="max-w-md bg-zinc-950 border border-amber-950/20 text-white rounded-3xl p-6 shadow-2xl">
                    <DialogHeader>
                        <DialogTitle className="font-serif text-lg text-white">Challenge {selectedFriend?.username || ''}</DialogTitle>
                        <DialogDescription className="text-zinc-400 text-xs mt-1">Send a fitness or habit challenge with a stretch milestone goal!</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-1.5">
                            <Label className="text-zinc-300 text-xs">Challenge Name</Label>
                            <Input
                                placeholder="e.g. Wall Sit Challenge"
                                className="bg-zinc-900 border-white/5 text-white"
                                value={challengeForm.name}
                                onChange={(e) => setChallengeForm({ ...challengeForm, name: e.target.value })}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-zinc-300 text-xs">Description / Instructions</Label>
                            <Textarea
                                placeholder="e.g. Hold a wall sit daily."
                                className="bg-zinc-900 border-white/5 text-white min-h-[60px]"
                                value={challengeForm.description}
                                onChange={(e) => setChallengeForm({ ...challengeForm, description: e.target.value })}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label className="text-zinc-300 text-xs">Base Goal</Label>
                                <Input
                                    placeholder="e.g. do a 2 minute wallsit"
                                    className="bg-zinc-900 border-white/5 text-white"
                                    value={challengeForm.baseGoal}
                                    onChange={(e) => setChallengeForm({ ...challengeForm, baseGoal: e.target.value })}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-zinc-300 text-xs">Milestone Goal (Stretch)</Label>
                                <Input
                                    placeholder="e.g. do one for 5 minutes"
                                    className="bg-zinc-900 border-white/5 text-white"
                                    value={challengeForm.milestoneGoal}
                                    onChange={(e) => setChallengeForm({ ...challengeForm, milestoneGoal: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label className="text-zinc-300 text-xs">Difficulty</Label>
                                <Select
                                    value={challengeForm.difficulty}
                                    onValueChange={(val) => setChallengeForm({ ...challengeForm, difficulty: val })}
                                >
                                    <SelectTrigger className="bg-zinc-900 border-white/5 text-white">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-zinc-950 border-amber-900/30 text-white">
                                        <SelectItem value="easy">Easy</SelectItem>
                                        <SelectItem value="medium">Medium</SelectItem>
                                        <SelectItem value="hard">Hard</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-zinc-300 text-xs">Category</Label>
                                <Select
                                    value={challengeForm.category}
                                    onValueChange={(val) => setChallengeForm({ ...challengeForm, category: val })}
                                >
                                    <SelectTrigger className="bg-zinc-900 border-white/5 text-white">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-zinc-950 border-amber-900/30 text-white">
                                        <SelectItem value="Push/Legs/Core">Push/Legs/Core</SelectItem>
                                        <SelectItem value="Pull/Shoulder/Core">Pull/Shoulder/Core</SelectItem>
                                        <SelectItem value="Legs/Arms/Core">Legs/Arms/Core</SelectItem>
                                        <SelectItem value="Core & Flexibility">Core & Flexibility</SelectItem>
                                        <SelectItem value="HIIT & Full Body">HIIT & Full Body</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>
                    <DialogFooter className="gap-2">
                        <Button variant="outline" className="border-white/5 text-zinc-400 hover:text-white" onClick={() => setChallengeModalOpen(false)}>Cancel</Button>
                        <Button className="bg-amber-600 hover:bg-amber-700 text-black font-extrabold" onClick={sendChallenge}>Send Challenge</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* COMPARE MODAL */}
            <Dialog open={compareModalOpen} onOpenChange={setCompareModalOpen}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-medieval text-center text-amber-500">{TEXT_CONTENT.social.modals.compare.title}</DialogTitle>
                        <DialogDescription className="text-center">
                            {TEXT_CONTENT.social.modals.compare.description}<span className="font-bold text-primary">{selectedFriend?.username}</span>
                        </DialogDescription>
                    </DialogHeader>

                    {compareStats && myStats ? (
                        <div className="space-y-8 py-4">
                            {/* MAIN STATS HEADER */}
                            <div className="grid grid-cols-3 gap-4 items-center bg-accent/5 p-6 rounded-xl border border-border/50">
                                {/* YOU */}
                                <div className="text-center space-y-2">
                                    <Avatar className="w-20 h-20 mx-auto border-4 border-primary/20">
                                        <AvatarImage src={user?.imageUrl} />
                                        <AvatarFallback>ME</AvatarFallback>
                                    </Avatar>
                                    <h4 className="font-bold text-lg">{TEXT_CONTENT.social.modals.compare.you}</h4>
                                    <Badge variant="outline" className="text-xs">Level {myStats.level}</Badge>
                                </div>

                                {/* VS */}
                                <div className="text-center space-y-4">
                                    <div className="text-4xl font-medieval text-muted-foreground/50">VS</div>
                                </div>

                                {/* FRIEND */}
                                <div className="text-center space-y-2">
                                    <Avatar className="w-20 h-20 mx-auto border-4 border-primary/20">
                                        <AvatarImage src={selectedFriend?.imageUrl} />
                                        <AvatarFallback>{selectedFriend?.username.substring(0, 2).toUpperCase()}</AvatarFallback>
                                    </Avatar>
                                    <h4 className="font-bold text-lg">{selectedFriend?.username}</h4>
                                    <Badge variant="outline" className="text-xs">Level {compareStats.level}</Badge>
                                </div>
                            </div>

                            {/* DETAILED STATS TABS */}
                            <Tabs defaultValue="overview" className="w-full">
                                <TabsList className="grid w-full grid-cols-4 mb-8">
                                    <TabsTrigger value="overview">Overview</TabsTrigger>
                                    <TabsTrigger value="quests">Quests</TabsTrigger>
                                    <TabsTrigger value="challenges">Challenges</TabsTrigger>
                                    <TabsTrigger value="milestones">Milestones</TabsTrigger>
                                </TabsList>

                                {/* OVERVIEW TAB */}
                                <TabsContent value="overview" className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        {/* XP */}
                                        <Card>
                                            <CardContent className="pt-6 text-center space-y-3">
                                                <Star className="w-8 h-8 mx-auto text-blue-500" />
                                                <div className="text-sm text-muted-foreground">Total XP</div>
                                                <div className="space-y-1">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <span className="font-bold text-lg">{myStats.xp.toLocaleString()}</span>
                                                        <span className="text-xs text-muted-foreground">vs</span>
                                                        <span className="font-bold text-lg text-primary">{compareStats.xp.toLocaleString()}</span>
                                                    </div>
                                                    <div className="h-2 bg-secondary rounded-full overflow-hidden flex">
                                                        <div className="bg-blue-500 h-full" style={{ width: `${(myStats.xp / (myStats.xp + compareStats.xp)) * 100}%` }} />
                                                        <div className="bg-primary h-full" style={{ width: `${(compareStats.xp / (myStats.xp + compareStats.xp)) * 100}%` }} />
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>

                                        {/* GOLD */}
                                        <Card>
                                            <CardContent className="pt-6 text-center space-y-3">
                                                <Coins className="w-8 h-8 mx-auto text-yellow-500" />
                                                <div className="text-sm text-muted-foreground">Total Gold</div>
                                                <div className="space-y-1">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <span className="font-bold text-lg">{myStats.gold.toLocaleString()}</span>
                                                        <span className="text-xs text-muted-foreground">vs</span>
                                                        <span className="font-bold text-lg text-primary">{compareStats.gold.toLocaleString()}</span>
                                                    </div>
                                                    <div className="h-2 bg-secondary rounded-full overflow-hidden flex">
                                                        <div className="bg-yellow-500 h-full" style={{ width: `${(myStats.gold / (myStats.gold + compareStats.gold)) * 100}%` }} />
                                                        <div className="bg-primary h-full" style={{ width: `${(compareStats.gold / (myStats.gold + compareStats.gold)) * 100}%` }} />
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>

                                        {/* TOTAL COMPLETIONS */}
                                        <Card>
                                            <CardContent className="pt-6 text-center space-y-3">
                                                <Trophy className="w-8 h-8 mx-auto text-amber-500" />
                                                <div className="text-sm text-muted-foreground">Total Completions</div>
                                                <div className="flex items-center justify-center gap-2">
                                                    <span className="font-bold text-lg">
                                                        {(myStats.quests?.total || 0) + (myStats.challenges?.total || 0) + (myStats.milestones?.total || 0)}
                                                    </span>
                                                    <span className="text-xs text-muted-foreground">vs</span>
                                                    <span className="font-bold text-lg text-primary">
                                                        {(compareStats.quests?.total || 0) + (compareStats.challenges?.total || 0) + (compareStats.milestones?.total || 0)}
                                                    </span>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </div>
                                </TabsContent>

                                {/* QUESTS TAB */}
                                <TabsContent value="quests" className="space-y-6">
                                    <div className="text-center mb-6">
                                        <h3 className="text-xl font-bold flex items-center justify-center gap-2">
                                            <Scroll className="w-6 h-6 text-primary" />
                                            Quests Completed
                                        </h3>
                                        <div className="flex justify-center gap-8 mt-2 text-lg">
                                            <div>You: <span className="font-bold">{myStats.quests?.total || 0}</span></div>
                                            <div>{selectedFriend?.username}: <span className="font-bold text-primary">{compareStats.quests?.total || 0}</span></div>
                                        </div>
                                    </div>

                                    {(myStats.quests?.total || 0) === 0 && (compareStats.quests?.total || 0) === 0 ? (
                                        <div className="text-center py-12 space-y-4">
                                            <div className="relative w-32 h-32 mx-auto opacity-50">
                                                <Image
                                                    src="/images/empty-states/quests.webp"
                                                    alt="No quests completed"
                                                    fill
                                                    className="object-contain"
                                                />
                                            </div>
                                            <p className="text-muted-foreground">No quests completed yet. Start your journey!</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {Object.keys(CATEGORY_ICONS).map(category => {
                                                const myCount = myStats.quests?.breakdown?.[category] || 0;
                                                const friendCount = compareStats.quests?.breakdown?.[category] || 0;
                                                if (myCount === 0 && friendCount === 0) return null;

                                                const Icon = CATEGORY_ICONS[category] || Star;
                                                const colorClass = CATEGORY_COLORS[category] || "text-zinc-500";
                                                const total = myCount + friendCount;
                                                const myPercent = total > 0 ? (myCount / total) * 100 : 0;
                                                const friendPercent = total > 0 ? (friendCount / total) * 100 : 0;

                                                return (
                                                    <div key={category} className="bg-card p-4 rounded-lg border">
                                                        <div className="flex items-center gap-3 mb-3">
                                                            <div className={`p-2 rounded-full bg-accent/10 ${colorClass}`}>
                                                                <Icon className="w-5 h-5" />
                                                            </div>
                                                            <span className="capitalize font-medium flex-1">{category}</span>
                                                            <div className="flex items-center gap-4 text-sm">
                                                                <span className="font-bold">{myCount}</span>
                                                                <span className="text-muted-foreground">vs</span>
                                                                <span className={`font-bold ${colorClass}`}>{friendCount}</span>
                                                            </div>
                                                        </div>
                                                        <div className="h-3 bg-secondary rounded-full overflow-hidden flex">
                                                            <div
                                                                className="bg-blue-500 h-full transition-all"
                                                                style={{ width: `${myPercent}%` }}
                                                            />
                                                            <div
                                                                className={`h-full transition-all ${colorClass.replace('text-', 'bg-')}`}
                                                                style={{ width: `${friendPercent}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </TabsContent>

                                {/* CHALLENGES TAB */}
                                <TabsContent value="challenges" className="space-y-6">
                                    <div className="text-center mb-6">
                                        <h3 className="text-xl font-bold flex items-center justify-center gap-2">
                                            <Sword className="w-6 h-6 text-red-500" />
                                            Challenges Completed
                                        </h3>
                                        <div className="flex justify-center gap-8 mt-2 text-lg">
                                            <div>You: <span className="font-bold">{myStats.challenges?.total || 0}</span></div>
                                            <div>{selectedFriend?.username}: <span className="font-bold text-primary">{compareStats.challenges?.total || 0}</span></div>
                                        </div>
                                    </div>

                                    {(myStats.challenges?.total || 0) === 0 && (compareStats.challenges?.total || 0) === 0 ? (
                                        <div className="text-center py-12 space-y-4">
                                            <div className="relative w-32 h-32 mx-auto opacity-50">
                                                <Image
                                                    src="/images/empty-states/challenges.webp"
                                                    alt="No challenges completed"
                                                    fill
                                                    className="object-contain"
                                                />
                                            </div>
                                            <p className="text-muted-foreground">No challenges completed yet. Face the trials!</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {Object.keys(CATEGORY_ICONS).map(category => {
                                                const myCount = myStats.challenges?.breakdown?.[category] || 0;
                                                const friendCount = compareStats.challenges?.breakdown?.[category] || 0;
                                                if (myCount === 0 && friendCount === 0) return null;

                                                const Icon = CATEGORY_ICONS[category] || Star;
                                                const colorClass = CATEGORY_COLORS[category] || "text-zinc-500";
                                                const total = myCount + friendCount;
                                                const myPercent = total > 0 ? (myCount / total) * 100 : 0;
                                                const friendPercent = total > 0 ? (friendCount / total) * 100 : 0;

                                                return (
                                                    <div key={category} className="bg-card p-4 rounded-lg border">
                                                        <div className="flex items-center gap-3 mb-3">
                                                            <div className={`p-2 rounded-full bg-accent/10 ${colorClass}`}>
                                                                <Icon className="w-5 h-5" />
                                                            </div>
                                                            <span className="capitalize font-medium flex-1">{category}</span>
                                                            <div className="flex items-center gap-4 text-sm">
                                                                <span className="font-bold">{myCount}</span>
                                                                <span className="text-muted-foreground">vs</span>
                                                                <span className={`font-bold ${colorClass}`}>{friendCount}</span>
                                                            </div>
                                                        </div>
                                                        <div className="h-3 bg-secondary rounded-full overflow-hidden flex">
                                                            <div
                                                                className="bg-blue-500 h-full transition-all"
                                                                style={{ width: `${myPercent}%` }}
                                                            />
                                                            <div
                                                                className={`h-full transition-all ${colorClass.replace('text-', 'bg-')}`}
                                                                style={{ width: `${friendPercent}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </TabsContent>

                                {/* MILESTONES TAB */}
                                <TabsContent value="milestones" className="space-y-6">
                                    <div className="text-center mb-6">
                                        <h3 className="text-xl font-bold flex items-center justify-center gap-2">
                                            <Trophy className="w-6 h-6 text-amber-500" />
                                            Milestones Achieved
                                        </h3>
                                        <div className="flex justify-center gap-8 mt-2 text-lg">
                                            <div>You: <span className="font-bold">{myStats.milestones?.total || 0}</span></div>
                                            <div>{selectedFriend?.username}: <span className="font-bold text-primary">{compareStats.milestones?.total || 0}</span></div>
                                        </div>
                                    </div>

                                    {(myStats.milestones?.total || 0) === 0 && (compareStats.milestones?.total || 0) === 0 ? (
                                        <div className="text-center py-12 space-y-4">
                                            <div className="relative w-32 h-32 mx-auto opacity-50">
                                                <Image
                                                    src="/images/empty-states/milestones.webp"
                                                    alt="No milestones achieved"
                                                    fill
                                                    className="object-contain"
                                                />
                                            </div>
                                            <p className="text-muted-foreground">No milestones achieved yet. Reach for greatness!</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {Object.keys(CATEGORY_ICONS).map(category => {
                                                const myCount = myStats.milestones?.breakdown?.[category] || 0;
                                                const friendCount = compareStats.milestones?.breakdown?.[category] || 0;
                                                if (myCount === 0 && friendCount === 0) return null;

                                                const Icon = CATEGORY_ICONS[category] || Star;
                                                const colorClass = CATEGORY_COLORS[category] || "text-zinc-500";
                                                const total = myCount + friendCount;
                                                const myPercent = total > 0 ? (myCount / total) * 100 : 0;
                                                const friendPercent = total > 0 ? (friendCount / total) * 100 : 0;

                                                return (
                                                    <div key={category} className="bg-card p-4 rounded-lg border">
                                                        <div className="flex items-center gap-3 mb-3">
                                                            <div className={`p-2 rounded-full bg-accent/10 ${colorClass}`}>
                                                                <Icon className="w-5 h-5" />
                                                            </div>
                                                            <span className="capitalize font-medium flex-1">{category}</span>
                                                            <div className="flex items-center gap-4 text-sm">
                                                                <span className="font-bold">{myCount}</span>
                                                                <span className="text-muted-foreground">vs</span>
                                                                <span className={`font-bold ${colorClass}`}>{friendCount}</span>
                                                            </div>
                                                        </div>
                                                        <div className="h-3 bg-secondary rounded-full overflow-hidden flex">
                                                            <div
                                                                className="bg-blue-500 h-full transition-all"
                                                                style={{ width: `${myPercent}%` }}
                                                            />
                                                            <div
                                                                className={`h-full transition-all ${colorClass.replace('text-', 'bg-')}`}
                                                                style={{ width: `${friendPercent}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </TabsContent>
                            </Tabs>
                        </div>
                    ) : (
                            <p className="text-muted-foreground italic font-serif opacity-80 animate-pulse">Summoning stats from the archives...</p>

                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
