"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useUser } from "@clerk/nextjs"
import { motion } from "framer-motion"
import Image from "next/image"
import { Users, UserPlus, Mail, Shield, Sword, Scroll, Trophy, Target, Star, Crown, Zap, Heart, Book, Hammer, Coins, Gift, HelpCircle, UserCheck } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import { HeaderSection } from "@/components/HeaderSection"
import { PageGuide } from "@/components/page-guide"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getCharacterStats } from "@/lib/character-stats-service"
import { calculateLevelFromExperience } from "@/types/character"
import { GiftModal } from "@/components/gift-modal"
import { AllianceDashboard } from "@/components/alliance-dashboard"

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
        gold: number;
        xp: number;
        quests: { total: number; breakdown: Record<string, number> };
        challenges: { total: number; breakdown: Record<string, number> };
        milestones: { total: number; breakdown: Record<string, number> };
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
    castle: "text-slate-500",
    craft: "text-orange-500",
    vitality: "text-green-500",
    wellness: "text-cyan-500",
    social: "text-pink-500",
    creative: "text-purple-500",
    mental: "text-indigo-500",
    physical: "text-rose-500"
};

export default function AlliesPage() {
    const { user } = useUser();
    const router = useRouter();
    const { toast } = useToast();
    const [activeTab, setActiveTab] = useState("allies");
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

    useEffect(() => {
        if (user?.id) {
            fetchFriends();
            fetchMyStats();
        }

        // Load cover image from localStorage
        const savedImage = localStorage.getItem('allies-cover-image');
        if (savedImage) {
            setCoverImage(savedImage);
        } else {
            setCoverImage('/images/allies-cover.jpg');
        }
    }, [user?.id]);

    const fetchMyStats = async () => {
        if (!user?.id) return;
        try {
            const res = await fetch(`/api/friends/stats?friendId=${user.id}`);
            const data = await res.json();
            if (res.ok) {
                setMyStats(data.stats);
            }
        } catch (error) {
            console.error("Error fetching my stats:", error);
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
    };

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

    const fetchFriends = async () => {
        try {
            const res = await fetch('/api/friends');
            const data = await res.json();
            if (res.ok) {
                setFriends(data.friends || []);
                setRequests(data.requests || []);
            }
        } catch (error) {
            console.error("Error fetching friends:", error);
        } finally {
            setIsLoading(false);
        }
    };

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
            console.error("Error searching users:", error);
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
                toast({ title: "Request Sent", description: "Friend request sent successfully!" });
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
                    toast({ title: "Error", description: error.error || "Failed to send request", variant: "destructive" });
                }
            }
        } catch (error) {
            toast({ title: "Error", description: "Failed to send request. Check console for details.", variant: "destructive" });
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
                    title: action === 'accept' ? "Friend Added" : "Request Declined",
                    description: action === 'accept' ? "You are now allies!" : "Friend request declined."
                });
                fetchFriends(); // Refresh lists
            }
        } catch (error) {
            toast({ title: "Error", description: "Failed to respond", variant: "destructive" });
        }
    };

    const removeFriend = async (friendshipId: string) => {
        if (!confirm("Are you sure you want to remove this ally?")) return;
        try {
            const res = await fetch(`/api/friends/${friendshipId}`, {
                method: 'DELETE'
            });
            if (res.ok) {
                toast({ title: "Friend Removed", description: "Ally removed from your list." });
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
                toast({ title: "Quest Sent", description: `Quest sent to ${selectedFriend.username}!` });
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
                toast({ title: "Error", description: "Failed to send quest", variant: "destructive" });
            }
        } catch (error) {
            toast({ title: "Error", description: "Failed to send quest", variant: "destructive" });
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
            console.error("Error fetching stats:", error);
        }
    };

    return (
        <div className="min-h-screen bg-background pb-20 md:pb-0">
            <HeaderSection
                title="ALLIES"
                subtitle="Forge alliances and conquer together"
                imageSrc={coverImage || "/images/allies-header.jpg"}
                canEdit={!!user?.id}
                onImageUpload={handleImageUpload}
                defaultBgColor="bg-blue-900"
                shouldRevealImage={true}
                guideComponent={
                    <PageGuide
                        title="Allies"
                        subtitle="Join forces with fellow pioneers"
                        sections={[
                            {
                                title: "Sending Quests",
                                icon: Scroll,
                                content: "Help your friends level up! Send them custom quests and challenges to earn rewards together."
                            },
                            {
                                title: "Gifting & Support",
                                icon: Gift,
                                content: "Feeling generous? Send gold or resources as gifts to help your allies prosper in their journey."
                            },
                            {
                                title: "Visitation Mode",
                                icon: UserCheck,
                                content: "Visit your allies' kingdoms and realms to see their progress and get inspiration for your own domain!"
                            }
                        ]}
                    />
                }
            />

            <div className="container mx-auto p-4 max-w-5xl space-y-8">
                {/* Alliance Dashboard */}
                <AllianceDashboard />

                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-3 mb-8">
                        <TabsTrigger value="allies" className="flex items-center gap-2">
                            <Users className="w-4 h-4" />
                            My Allies
                            {friends.length > 0 && <Badge variant="secondary" className="ml-1">{friends.length}</Badge>}
                        </TabsTrigger>
                        <TabsTrigger value="add" className="flex items-center gap-2">
                            <UserPlus className="w-4 h-4" />
                            Add Friend
                        </TabsTrigger>
                        <TabsTrigger value="requests" className="flex items-center gap-2">
                            <Mail className="w-4 h-4" />
                            Requests
                            {requests.length > 0 && <Badge variant="destructive" className="ml-1">{requests.length}</Badge>}
                        </TabsTrigger>
                    </TabsList>

                    {/* MY ALLIES TAB */}
                    <TabsContent value="allies" className="space-y-4">
                        {friends.length === 0 ? (
                            <Card className="text-center p-8">
                                <CardContent className="pt-6 flex flex-col items-center">
                                    <div className="relative w-48 h-48 mb-6">
                                        <Image
                                            src="/images/empty-states/allies.png"
                                            alt="No allies yet"
                                            fill
                                            className="object-contain"
                                        />
                                    </div>
                                    <h3 className="text-lg font-semibold mb-2">No Allies Yet</h3>
                                    <p className="text-muted-foreground mb-4">Add friends to compare stats and send quests!</p>
                                    <Button onClick={() => setActiveTab("add")}>Find Friends</Button>
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="grid grid-cols-1 gap-4">
                                {friends.map(friend => (
                                    <Card key={friend.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                                        <CardContent className="p-0">
                                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4">
                                                {/* Avatar and Info */}
                                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                                    <div className="relative">
                                                        <Avatar className="h-14 w-14 border-2 border-primary/20 flex-shrink-0">
                                                            <AvatarImage src={friend.imageUrl} />
                                                            <AvatarFallback>{friend.username.substring(0, 2).toUpperCase()}</AvatarFallback>
                                                        </Avatar>
                                                        {/* Status Indicator */}
                                                        <div className={cn(
                                                            "absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-background",
                                                            !friend.lastSeen ? "bg-gray-400" :
                                                                (Date.now() - new Date(friend.lastSeen).getTime() < 5 * 60 * 1000) ? "bg-green-500 animate-pulse" :
                                                                    (Date.now() - new Date(friend.lastSeen).getTime() < 24 * 60 * 60 * 1000) ? "bg-yellow-500" : "bg-gray-400"
                                                        )} title={friend.lastSeen ? `Last seen: ${new Date(friend.lastSeen).toLocaleString()}` : "Offline"} />
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <h4 className="font-semibold text-lg truncate">{friend.username}</h4>
                                                            {friend.stats?.level && (
                                                                <Badge variant="outline" className="text-xs bg-blue-500/10 text-blue-500 border-blue-500/30">
                                                                    Lvl {friend.stats.level}
                                                                </Badge>
                                                            )}
                                                            {friend.title && (
                                                                <span className="text-xs font-bold text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-200">
                                                                    {friend.title}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                                                            <Users className="w-3 h-3" />
                                                            Ally since {new Date(friend.createdAt || Date.now()).toLocaleDateString()}
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Action Buttons */}
                                                <div className="flex gap-2 w-full sm:w-auto flex-wrap">
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => openCompareModal(friend)}
                                                        className="flex-1 sm:flex-none"
                                                    >
                                                        <Target className="w-4 h-4 mr-2" />
                                                        Compare
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => router.push(`/kingdom?visit=${friend.friendId}`)}
                                                        className="flex-1 sm:flex-none border-blue-500/50 text-blue-400 hover:bg-blue-500/10"
                                                    >
                                                        <Crown className="w-4 h-4 mr-2" />
                                                        Visit Kingdom
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => router.push(`/realm?visit=${friend.friendId}`)}
                                                        className="flex-1 sm:flex-none border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/10"
                                                    >
                                                        <Shield className="w-4 h-4 mr-2" />
                                                        Visit Realm
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        onClick={() => openQuestModal(friend)}
                                                        className="flex-1 sm:flex-none"
                                                    >
                                                        <Scroll className="w-4 h-4 mr-2" />
                                                        Quest
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="secondary"
                                                        onClick={() => {
                                                            setSelectedFriend(friend);
                                                            setGiftModalOpen(true);
                                                        }}
                                                        className="flex-1 sm:flex-none"
                                                    >
                                                        <Gift className="w-4 h-4 mr-2" />
                                                        Gift
                                                    </Button>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </TabsContent>

                    {/* ADD FRIEND TAB */}
                    <TabsContent value="add" className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Find New Allies</CardTitle>
                                <CardDescription>Search for users by their username or email.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex gap-2 mb-6">
                                    <Input
                                        placeholder="Search username..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                    />
                                    <Button onClick={handleSearch} disabled={isSearching}>
                                        {isSearching ? "Searching..." : "Search"}
                                    </Button>
                                </div>

                                <div className="space-y-4">
                                    {searchResults.map(user => (
                                        <div key={user.id} className="flex items-center justify-between p-3 border rounded-lg bg-card hover:bg-accent/5 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <Avatar>
                                                    <AvatarImage src={user.imageUrl} />
                                                    <AvatarFallback>{user.username.substring(0, 2).toUpperCase()}</AvatarFallback>
                                                </Avatar>
                                                <span className="font-medium">{user.username}</span>
                                            </div>
                                            <Button size="sm" onClick={() => sendFriendRequest(user.id)}>
                                                <UserPlus className="w-4 h-4 mr-2" /> Add Friend
                                            </Button>
                                        </div>
                                    ))}
                                    {searchResults.length === 0 && !searchQuery && !isSearching && (
                                        <div className="text-center py-8 flex flex-col items-center">
                                            <div className="relative w-40 h-40 mb-4 opacity-80">
                                                <Image
                                                    src="/images/empty-states/search.png"
                                                    alt="Search for friends"
                                                    fill
                                                    className="object-contain"
                                                />
                                            </div>
                                            <p className="text-muted-foreground">Search for your friends by username to add them to your allies.</p>
                                        </div>
                                    )}
                                    {searchResults.length === 0 && searchQuery && !isSearching && (
                                        <p className="text-center text-muted-foreground py-4">No users found matching &quot;{searchQuery}&quot;</p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* REQUESTS TAB */}
                    <TabsContent value="requests" className="space-y-4">
                        {requests.length === 0 ? (
                            <div className="text-center py-12 text-muted-foreground flex flex-col items-center">
                                <div className="relative w-40 h-40 mb-4 opacity-80">
                                    <Image
                                        src="/images/empty-states/requests.png"
                                        alt="No requests"
                                        fill
                                        className="object-contain"
                                    />
                                </div>
                                <p>No pending friend requests.</p>
                            </div>
                        ) : (
                            <div className="grid gap-4">
                                {requests.map(req => (
                                    <Card key={req.id}>
                                        <CardContent className="p-4 flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <Avatar>
                                                    <AvatarImage src={req.imageUrl} />
                                                    <AvatarFallback>{req.username.substring(0, 2).toUpperCase()}</AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <h4 className="font-semibold">{req.username}</h4>
                                                    <p className="text-sm text-muted-foreground">
                                                        {req.isSender ? "Outgoing Request" : "Incoming Request"}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                {req.isSender ? (
                                                    <Button size="sm" variant="outline" onClick={() => removeFriend(req.id)}>
                                                        Cancel
                                                    </Button>
                                                ) : (
                                                    <>
                                                        <Button size="sm" variant="default" onClick={() => respondToRequest(req.id, 'accept')}>
                                                            Accept
                                                        </Button>
                                                        <Button size="sm" variant="ghost" onClick={() => respondToRequest(req.id, 'reject')}>
                                                            Decline
                                                        </Button>
                                                    </>
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </TabsContent>
                </Tabs>
            </div>

            {/* SEND QUEST MODAL */}
            <Dialog open={questModalOpen} onOpenChange={setQuestModalOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Send Quest to {selectedFriend?.username}</DialogTitle>
                        <DialogDescription>Create a custom quest for your ally. They will receive a notification.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Quest Title</Label>
                            <Input
                                placeholder="e.g., Run 5km this week"
                                value={questForm.title}
                                onChange={(e) => setQuestForm({ ...questForm, title: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Description</Label>
                            <Textarea
                                placeholder="Describe what they need to do..."
                                value={questForm.description}
                                onChange={(e) => setQuestForm({ ...questForm, description: e.target.value })}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Difficulty</Label>
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
                                <Label>Category</Label>
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
                                    <Star className="w-4 h-4 text-blue-500" /> XP Reward
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
                                    <Coins className="w-4 h-4 text-yellow-500" /> Gold Reward
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
                        <Button variant="outline" onClick={() => setQuestModalOpen(false)}>Cancel</Button>
                        <Button onClick={sendQuest}>Send Quest</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* COMPARE MODAL */}
            <Dialog open={compareModalOpen} onOpenChange={setCompareModalOpen}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-medieval text-center text-amber-500">Ally Comparison</DialogTitle>
                        <DialogDescription className="text-center">
                            Comparing your stats with <span className="font-bold text-primary">{selectedFriend?.username}</span>
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
                                    <h4 className="font-bold text-lg">You</h4>
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
                                                    src="/images/empty-states/quests.png"
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
                                                const colorClass = CATEGORY_COLORS[category] || "text-gray-500";
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
                                                    src="/images/empty-states/challenges.png"
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
                                                const colorClass = CATEGORY_COLORS[category] || "text-gray-500";
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
                                                    src="/images/empty-states/milestones.png"
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
                                                const colorClass = CATEGORY_COLORS[category] || "text-gray-500";
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
                        <div className="py-12 text-center flex flex-col items-center justify-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
                            <p className="text-muted-foreground">Summoning stats from the archives...</p>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

        </div >
    )
}
