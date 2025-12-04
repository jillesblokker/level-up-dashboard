"use client"

import { useState, useEffect } from "react"
import { useUser } from "@clerk/nextjs"
import { motion } from "framer-motion"
import Image from "next/image"
import { Users, UserPlus, Mail, Shield, Sword, Scroll, Trophy, Target } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import { HeaderSection } from "@/components/HeaderSection"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getCharacterStats } from "@/lib/character-stats-manager"
import { calculateLevelFromExperience } from "@/types/character"

interface Friend {
    id: string; // Friendship ID
    friendId: string; // User ID
    username: string;
    imageUrl: string;
    status: 'accepted' | 'pending';
    isSender: boolean;
    createdAt?: string; // Added optional createdAt
    stats?: {
        level: number;
        gold: number;
        xp: number;
        questsCompleted: number;
        challengesCompleted: number;
        milestonesCompleted: number;
    };
}

export default function AlliesPage() {
    const { user } = useUser();
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
        category: "physical"
    });

    // Comparison Modal state
    const [compareModalOpen, setCompareModalOpen] = useState(false);
    const [compareStats, setCompareStats] = useState<any>(null);
    const [myStats, setMyStats] = useState<any>(null);
    const [coverImage, setCoverImage] = useState<string>('');

    useEffect(() => {
        fetchFriends();
        // Load my stats
        const stats = getCharacterStats();
        const level = calculateLevelFromExperience(stats.experience);
        // We also need quest completion counts, which might need an API call or we can just show basic stats for now
        setMyStats({
            level,
            gold: stats.gold,
            xp: stats.experience,
            // For quests/challenges, we'd ideally fetch from API or store locally. 
            // For now, let's use placeholders or fetch if possible.
            questsCompleted: '?'
        });

        // Load cover image from localStorage
        const savedImage = localStorage.getItem('allies-cover-image');
        if (savedImage) {
            setCoverImage(savedImage);
        } else {
            // Use default allies cover image
            setCoverImage('/images/allies-cover.jpg');
        }
    }, []);

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
                    rewards: { xp: 50, gold: 10 } // Default rewards for now
                })
            });

            if (res.ok) {
                toast({ title: "Quest Sent", description: `Quest sent to ${selectedFriend.username}!` });
                setQuestModalOpen(false);
                setQuestForm({ title: "", description: "", difficulty: "medium", category: "physical" });
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
                subtitle="Manage your friends, compare stats, and send quests."
                imageSrc={coverImage || ""}
                canEdit={!!user?.id}
                onImageUpload={handleImageUpload}
                shouldRevealImage={true}
            />

            <div className="container mx-auto p-4 max-w-5xl space-y-8">
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
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {friends.map(friend => (
                                    <Card key={friend.id} className="overflow-hidden">
                                        <CardContent className="p-4 flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-12 w-12 border-2 border-primary/20">
                                                    <AvatarImage src={friend.imageUrl} />
                                                    <AvatarFallback>{friend.username.substring(0, 2).toUpperCase()}</AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <h4 className="font-semibold">{friend.username}</h4>
                                                    <p className="text-xs text-muted-foreground">Ally since {new Date(friend.createdAt || Date.now()).toLocaleDateString()}</p>
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <Button size="sm" variant="outline" onClick={() => openCompareModal(friend)}>
                                                    <Target className="w-4 h-4 mr-1" /> Compare
                                                </Button>
                                                <Button size="sm" onClick={() => openQuestModal(friend)}>
                                                    <Scroll className="w-4 h-4 mr-1" /> Send Quest
                                                </Button>
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
                <DialogContent>
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
                                    </SelectContent>
                                </Select>
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
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Ally Comparison</DialogTitle>
                        <DialogDescription>Comparing your stats with {selectedFriend?.username}</DialogDescription>
                    </DialogHeader>

                    {compareStats ? (
                        <div className="grid grid-cols-3 gap-4 py-6">
                            {/* YOU */}
                            <div className="text-center space-y-2">
                                <h4 className="font-bold text-primary">You</h4>
                                <div className="p-4 bg-accent/10 rounded-lg h-16 flex flex-col justify-center">
                                    <div className="text-2xl font-bold">{myStats?.level || '?'}</div>
                                </div>
                                <div className="p-4 bg-accent/10 rounded-lg h-16 flex flex-col justify-center">
                                    <div className="text-2xl font-bold text-yellow-500">{myStats?.gold || '?'}</div>
                                </div>
                                <div className="p-4 bg-accent/10 rounded-lg h-16 flex flex-col justify-center">
                                    <div className="text-2xl font-bold text-blue-500">{myStats?.questsCompleted || '?'}</div>
                                </div>
                            </div>

                            {/* METRIC LABELS */}
                            <div className="space-y-4 flex flex-col justify-center text-center text-sm font-medium text-muted-foreground">
                                <div className="h-16 flex items-center justify-center">Level</div>
                                <div className="h-16 flex items-center justify-center">Gold Earned</div>
                                <div className="h-16 flex items-center justify-center">Quests Completed</div>
                            </div>

                            {/* FRIEND */}
                            <div className="text-center space-y-2">
                                <h4 className="font-bold text-primary">{selectedFriend?.username}</h4>
                                <div className="p-4 bg-accent/10 rounded-lg h-16 flex flex-col justify-center">
                                    <div className="text-2xl font-bold">{compareStats.level}</div>
                                </div>
                                <div className="p-4 bg-accent/10 rounded-lg h-16 flex flex-col justify-center">
                                    <div className="text-2xl font-bold text-yellow-500">{compareStats.gold}</div>
                                </div>
                                <div className="p-4 bg-accent/10 rounded-lg h-16 flex flex-col justify-center">
                                    <div className="text-2xl font-bold text-blue-500">{compareStats.questsCompleted}</div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="py-12 text-center">Loading stats...</div>
                    )}
                </DialogContent>
            </Dialog>

        </div>
    )
}
