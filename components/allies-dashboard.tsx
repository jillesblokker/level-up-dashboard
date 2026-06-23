"use client"

import { logger } from "@/lib/logger";

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useUser } from "@clerk/nextjs"
import Image from "next/image"
import { Users, UserPlus, Mail, Shield, Sword, Scroll, Trophy, Star, Crown, Flame, UserCheck, MoreHorizontal, Gift, Target, X, Zap, Heart, Book, Hammer, MessageSquare } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useToast } from "@/components/ui/use-toast"
import { TEXT_CONTENT } from '@/lib/text-content'
import { cn } from "@/lib/utils"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { getCurrentTitle } from "@/lib/title-manager"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { GiftModal } from "@/components/gift-modal"
import { getCharacterStats } from "@/lib/character-stats-service"

interface Friend {
  id: string; // Friendship ID
  friendId: string; // User ID
  username: string;
  imageUrl: string;
  status: 'accepted' | 'pending';
  isSender: boolean;
  createdAt?: string;
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

export function AlliesDashboard() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  
  // Tab state (handling initial tab from query param)
  const initialTab = searchParams?.get('tab') === 'add' ? 'add' : 
                   searchParams?.get('tab') === 'requests' ? 'requests' : 'allies';
  const [activeTab, setActiveTab] = useState(initialTab);
  
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
  
  // Gift Modal state
  const [giftModalOpen, setGiftModalOpen] = useState(false);

  useEffect(() => {
    if (user?.id) {
      fetchFriends();
    }
  }, [user?.id]);

  const fetchFriends = async () => {
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
        toast({ title: "Request Sent", description: "Your invitation has been delivered." });
        setSearchResults(prev => prev.filter(u => u.id !== targetUserId));
      } else {
        const error = await res.json();
        toast({ title: "Error", description: error.error || "Failed to send request", variant: "destructive" });
      }
    } catch (error) {
        logger.error(error);
      toast({ title: "Error", description: "Failed to send request", variant: "destructive" });
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
          title: action === 'accept' ? "Ally Added" : "Request Declined",
          description: action === 'accept' ? "A new hero joins your cause." : "The request has been dismissed."
        });
        fetchFriends(); 
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to respond", variant: "destructive" });
    }
  };

  const removeFriend = async (friendshipId: string) => {
    if (!confirm("Are you sure you want to remove this ally?")) return;
    try {
      const res = await fetch(`/api/friends/${friendshipId}`, { method: 'DELETE' });
      if (res.ok) {
        toast({ title: "Ally Removed", description: "The bond has been broken." });
        setFriends(prev => prev.filter(f => f.id !== friendshipId));
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to remove ally", variant: "destructive" });
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
            toast({ title: "Quest Sent", description: `Enlistment scroll sent to ${selectedFriend.username}.` });
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
            toast({ title: "Error", description: "Failed to deliver quest scroll.", variant: "destructive" });
        }
    } catch (error) {
        toast({ title: "Error", description: "Carrier pigeon failed.", variant: "destructive" });
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

  if (isLoading) return (
    <div className="flex flex-col items-center justify-center p-12 space-y-4">
      <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
      <span className="text-amber-500/50 font-medieval tracking-widest uppercase text-xs">Summoning your allies...</span>
    </div>
  );

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-amber-950/20 border border-amber-900/40 p-1 rounded-2xl mb-8">
          <TabsTrigger value="allies" className="py-3 font-semibold transition-all">
            <Users className="w-4 h-4" />
            My Allies
            {friends.length > 0 && (
              <span className="ml-2 px-2 py-0.5 bg-amber-900/40 text-amber-500 text-[10px] rounded-full border border-amber-900/30 font-bold">
                {friends.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="add" className="py-3 font-semibold transition-all">
            <UserPlus className="w-4 h-4" />
            Recruit
          </TabsTrigger>
          <TabsTrigger value="requests" className="py-3 font-semibold transition-all relative">
            <Mail className="w-4 h-4" />
            Registry
            {requests.length > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-4 w-4 bg-amber-500 text-[10px] text-black items-center justify-center font-bold">
                  {requests.length}
                </span>
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        {/* MY ALLIES TAB */}
        <TabsContent value="allies" className="space-y-4 mt-0">
          {friends.length === 0 ? (
            <Card className="medieval-card p-12 text-center border-dashed">
              <div className="flex flex-col items-center">
                <Users className="w-16 h-16 text-amber-900/40 mb-4" />
                <h3 className="text-xl font-medieval text-amber-500 mb-2">No Allies Found</h3>
                <p className="text-amber-900/60 font-serif mb-6 italic">Your chronicle is yet to feature other heroes.</p>
                <Button onClick={() => setActiveTab("add")} variant="outline" className="border-amber-800 text-amber-500 hover:bg-amber-950/40">
                  Search the Realms
                </Button>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {friends.map(friend => {
                const level = friend.stats?.level || 1;
                const titleInfo = getCurrentTitle(level);

                return (
                  <Card key={friend.id} className="medieval-card medieval-card-amber overflow-hidden group/card shadow-lg transition-all hover:scale-[1.02] duration-300">
                    <CardContent className="p-0 flex flex-col h-full">
                      {/* Card Header Section */}
                      <div className="p-4 flex items-center gap-4 bg-gradient-to-r from-amber-900/20 to-transparent border-b border-amber-900/30 relative">
                        <div className="relative">
                          <Avatar className="h-14 w-14 border-2 border-amber-500 shadow-lg transition-transform duration-500 group-hover/card:scale-105">
                            <AvatarImage src={friend.imageUrl} />
                            <AvatarFallback className="bg-amber-950 text-amber-500 font-bold border-none">{friend.username.substring(0, 2).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div className={cn(
                            "absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-[#1a1a1a] z-10",
                            !friend.lastSeen ? "bg-zinc-600" :
                                (Date.now() - new Date(friend.lastSeen).getTime() < 5 * 60 * 1000) ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" :
                                    (Date.now() - new Date(friend.lastSeen).getTime() < 24 * 60 * 60 * 1000) ? "bg-amber-400" : "bg-zinc-600"
                          )} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medieval text-xl text-white truncate drop-shadow-md mb-0.5">{friend.username}</h4>
                          <div className="flex items-center gap-2 text-xs font-bold text-amber-500/80 tracking-wide uppercase">
                            <Shield className="w-3 h-3 fill-amber-500/20" />
                            {friend.stats?.allianceName || "Lone Wanderer"}
                          </div>
                        </div>
                        {friend.stats?.streak && friend.stats.streak > 0 && (
                          <div className="flex items-center gap-1.5 bg-orange-950/40 text-orange-400 px-3 py-1 rounded-full border border-orange-900/40 font-bold shadow-sm">
                            <Flame className="w-3.5 h-3.5 fill-orange-500/20" />
                            {friend.stats.streak}
                          </div>
                        )}
                      </div>

                      {/* Rank Portrait Section */}
                      <div className="py-8 flex flex-col items-center justify-center bg-gradient-to-b from-black/0 via-amber-950/5 to-black/0 flex-1 relative overflow-hidden">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-amber-500/5 via-transparent to-transparent opacity-30" />
                        <div className="relative w-36 h-36 mb-4 drop-shadow-2xl transition-transform duration-700 group-hover/card:scale-110 filter sepia-[0.2]">
                          <Image
                            src={`/images/character/${titleInfo.id}.webp`}
                            alt={titleInfo.name}
                            fill
                            className="object-contain"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = '/images/character/squire.webp';
                            }}
                          />
                        </div>
                        <Badge className="px-5 py-1.5 bg-amber-900/40 border-amber-500/30 text-amber-200 uppercase tracking-[0.25em] font-medieval text-[10px] shadow-inner ">
                          {titleInfo.name}
                        </Badge>
                      </div>

                      {/* Stats Grid */}
                      <div className="grid grid-cols-4 divide-x divide-amber-900/20 border-y border-amber-900/30 bg-zinc-950">
                        <div className="p-3 text-center group-hover/card:bg-amber-950/10 transition-colors">
                          <div className="text-[9px] uppercase tracking-widest text-amber-500/50 font-black mb-1">Level</div>
                          <div className="font-medieval text-lg text-white flex items-center justify-center gap-1">
                            <Crown className="w-3 h-3 text-amber-500" />
                            {level}
                          </div>
                        </div>
                        <div className="p-3 text-center group-hover/card:bg-amber-950/10 transition-colors">
                          <div className="text-[9px] uppercase tracking-widest text-amber-500/50 font-black mb-1">Quests</div>
                          <div className="font-medieval text-lg text-white flex items-center justify-center gap-1">
                            <Scroll className="w-3 h-3 text-blue-500" />
                            {friend.stats?.questsFinished || 0}
                          </div>
                        </div>
                        <div className="p-3 text-center group-hover/card:bg-amber-950/10 transition-colors">
                          <div className="text-[9px] uppercase tracking-widest text-amber-500/50 font-black mb-1">Might</div>
                          <div className="font-medieval text-lg text-white flex items-center justify-center gap-1">
                            <Sword className="w-3 h-3 text-red-500" />
                            {friend.stats?.challengesFinished || 0}
                          </div>
                        </div>
                        <div className="p-3 text-center group-hover/card:bg-amber-950/10 transition-colors">
                          <div className="text-[9px] uppercase tracking-widest text-amber-500/50 font-black mb-1">Shared</div>
                          <div className="font-medieval text-lg text-white flex items-center justify-center gap-1">
                            <Gift className="w-3 h-3 text-pink-400" />
                            {friend.stats?.giftsShared || 0}
                          </div>
                        </div>
                      </div>

                      {/* Action Row */}
                      <div className="p-4 grid grid-cols-2 gap-3 bg-zinc-950">
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full bg-amber-950/10 border-amber-900/40 text-amber-500 hover:bg-amber-900/30 hover:text-amber-400 font-medieval font-bold"
                          onClick={() => router.push(`/kingdom?visit=${friend.friendId}`)}
                        >
                          <Crown className="w-3.5 h-3.5" /> Visit Realm
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full bg-amber-950/10 border-amber-900/40 text-amber-500 hover:bg-amber-900/30 hover:text-amber-400 font-medieval font-bold"
                          onClick={() => openQuestModal(friend)}
                        >
                          <Scroll className="w-3.5 h-3.5" /> Issue Quest
                        </Button>

                        {/* Secondary Row */}
                        <div className="col-span-2 flex gap-1 items-center pt-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="flex-1 text-[10px] h-7 text-amber-950 hover:text-amber-500 hover:bg-transparent tracking-widest uppercase font-black"
                            onClick={() => openCompareModal(friend)}
                          >
                            <Target className="w-3 h-3 rotate-45" /> Compare
                          </Button>
                          <div className="w-px h-3 bg-amber-900/20" />
                          <Button
                            variant="ghost"
                            size="sm"
                            className="flex-1 text-[10px] h-7 text-amber-950 hover:text-amber-500 hover:bg-transparent tracking-widest uppercase font-black"
                            onClick={() => {
                                setSelectedFriend(friend);
                                setGiftModalOpen(true);
                            }}
                          >
                            <Gift className="w-3 h-3" /> Gift
                          </Button>
                          <div className="w-px h-3 bg-amber-900/20" />
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-amber-950 hover:text-red-500 hover:bg-transparent">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-[#0a0a0a] border-amber-900/50 shadow-2xl">
                              <DropdownMenuItem onClick={() => router.push(`/realm?visit=${friend.friendId}`)} className="text-amber-200 focus:bg-amber-900/20 focus:text-amber-100 font-serif">
                                <Shield className="w-4 h-4" /> Explore Realm Map
                              </DropdownMenuItem>
                              <div className="h-px bg-amber-900/20 my-1" />
                              <DropdownMenuItem className="text-red-900 focus:text-red-500 focus:bg-red-950/10 font-serif" onClick={() => removeFriend(friend.id)}>
                                <UserCheck className="w-4 h-4" /> Break Alliance
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* RECRUIT TAB */}
        <TabsContent value="add" className="space-y-6 mt-0">
          <Card className="medieval-card border-amber-500/20">
            <CardHeader className="border-b border-amber-900/30 bg-amber-950/5">
              <CardTitle className="text-amber-500 font-medieval text-2xl tracking-tight">Gather Your Cohort</CardTitle>
              <CardDescription className="text-amber-900/60 font-serif italic text-sm">Search the kingdom&apos;s registry for notable champions to join your cause.</CardDescription>
            </CardHeader>
            <CardContent className="pt-8">
              <div className="flex gap-3 mb-8">
                <div className="relative flex-1">
                  <Input
                    placeholder="Search by username..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    className="bg-zinc-950 border-amber-900/30 text-amber-100 pl-10 h-12 rounded-xl focus:border-amber-500 focus:ring-0"
                  />
                  <Users className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-900/40" />
                </div>
                <Button 
                  onClick={handleSearch} 
                  disabled={isSearching} 
                  className="bg-amber-800 hover:bg-amber-700 text-amber-100 border border-amber-600 px-8 rounded-xl font-medieval text-lg"
                >
                  {isSearching ? "Searching..." : "Summon"}
                </Button>
              </div>

              <div className="grid gap-4 max-h-[400px] overflow-y-auto pr-2 no-scrollbar">
                {searchResults.map(u => (
                  <div key={u.id} className="flex items-center justify-between p-4 border border-amber-900/20 rounded-2xl bg-zinc-950 hover:bg-amber-950/20 transition-all group/result">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-12 w-12 border-2 border-amber-900/30 group-hover/result:border-amber-500/40 transition-colors">
                        <AvatarImage src={u.imageUrl} />
                        <AvatarFallback className="bg-amber-950 text-amber-500 font-bold">{u.username.substring(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div>
                        <span className="font-medieval text-lg text-amber-100 block mb-0.5">{u.username}</span>
                        <div className="flex items-center gap-2">
                           <Badge variant="outline" className="text-[9px] py-0 border-amber-900/20 text-amber-900/60">Novice</Badge>
                        </div>
                      </div>
                    </div>
                    <Button 
                      size="sm" 
                      onClick={() => sendFriendRequest(u.id)} 
                      className="bg-amber-900/30 text-amber-500 hover:bg-amber-900/60 border border-amber-500/20 rounded-lg px-4"
                    >
                      <UserPlus className="w-4 h-4" /> Invite
                    </Button>
                  </div>
                ))}
                
                {searchResults.length === 0 && searchQuery && !isSearching && (
                   <div className="text-center py-8 space-y-4">
                      <div className="w-16 h-16 bg-amber-950/10 rounded-full flex items-center justify-center mx-auto border border-amber-900/20">
                         <X className="w-6 h-6 text-amber-900/40" />
                      </div>
                      <p className="text-amber-950/40 font-serif italic">No hero by that name was found in the scrolls.</p>
                   </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* REGISTRY TAB */}
        <TabsContent value="requests" className="space-y-4 mt-0">
          {requests.length === 0 ? (
            <div className="text-center py-24 bg-zinc-950 border border-dashed border-amber-950/40 rounded-3xl space-y-4">
              <Mail className="w-12 h-12 mx-auto mb-4 text-amber-950/20" />
              <p className="text-amber-950/40 font-serif italic text-lg tracking-wide">Your mailbox is quiet tonight.</p>
               <Button onClick={() => setActiveTab("add")} variant="ghost" className="text-amber-500/30 hover:text-amber-500 hover:bg-transparent font-medieval tracking-widest text-xs uppercase">Seek New Bonds</Button>
            </div>
          ) : (
            <div className="grid gap-6">
              {requests.map(req => (
                <Card key={req.id} className="medieval-card group/req overflow-hidden">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-14 w-14 border border-amber-500/30 group-hover/req:border-amber-500/60 transition-colors">
                        <AvatarImage src={req.imageUrl} />
                        <AvatarFallback className="bg-amber-950 text-amber-500 font-bold">{req.username.substring(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div>
                        <h4 className="font-medieval text-xl text-amber-100 mb-1">{req.username}</h4>
                        <div className="flex items-center gap-2">
                           <Badge className={req.isSender ? "bg-amber-900/40 text-amber-600 border-amber-900/30" : "bg-emerald-950/40 text-emerald-500 border-emerald-900/30"}>
                              {req.isSender ? <MessageSquare className="w-3 h-3 mr-1" /> : <Shield className="w-3 h-3 mr-1" />}
                              {req.isSender ? "Summons Sent" : "Recruitment Request"}
                           </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      {!req.isSender && (
                        <Button 
                          size="sm" 
                          onClick={() => respondToRequest(req.id, 'accept')} 
                          className="bg-amber-800 hover:bg-amber-700 text-amber-100 border border-amber-600 px-6 font-medieval"
                        >
                          Enlist Ally
                        </Button>
                      )}
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={() => respondToRequest(req.id, 'reject')} 
                        className="text-amber-900 hover:text-red-500 font-medieval tracking-widest uppercase text-[10px]"
                      >
                        {req.isSender ? "Withdraw Summons" : "Decline Join"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* QUEST MODAL */}
      <Dialog open={questModalOpen} onOpenChange={setQuestModalOpen}>
          <DialogContent className="medieval-card border-amber-500/30 text-white max-w-lg">
              <DialogHeader>
                  <DialogTitle className="text-2xl font-medieval text-amber-500 flex items-center gap-2">
                      <Scroll className="w-6 h-6" />
                      Draft Enlistment Scroll
                  </DialogTitle>
                  <DialogDescription className="font-serif italic text-amber-900/60">
                      Design a task for {selectedFriend?.username} to undertake in your name.
                  </DialogDescription>
              </DialogHeader>

              <div className="space-y-5 pt-4">
                  <div className="space-y-2">
                      <Label className="text-amber-500/70 font-medieval uppercase text-[10px] tracking-widest">Scroll Heading</Label>
                      <Input
                          value={questForm.title}
                          onChange={e => setQuestForm({ ...questForm, title: e.target.value })}
                          placeholder="e.g. Cleansing the Mist..."
                          className="bg-zinc-950 border-amber-900/30 focus:border-amber-500 text-amber-100"
                      />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-amber-500/70 font-medieval uppercase text-[10px] tracking-widest">Decree Details</Label>
                    <Textarea 
                      value={questForm.description}
                      onChange={e => setQuestForm({...questForm, description: e.target.value})}
                      placeholder="Specify the terms of this challenge..."
                      className="bg-zinc-950 border-amber-900/30 focus:border-amber-500 text-amber-100 min-h-[100px]"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-amber-500/70 font-medieval uppercase text-[10px] tracking-widest">Path Category</Label>
                      <Select value={questForm.category} onValueChange={v => setQuestForm({...questForm, category: v})}>
                        <SelectTrigger className="bg-zinc-950 border-amber-900/30 text-amber-100">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-900 border-amber-900/40 text-amber-100">
                           <SelectItem value="might">Physical / Might</SelectItem>
                           <SelectItem value="knowledge">Mental / Knowledge</SelectItem>
                           <SelectItem value="vitality">Energy / Vitality</SelectItem>
                           <SelectItem value="craft">Discipline / Craft</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-amber-500/70 font-medieval uppercase text-[10px] tracking-widest">Difficulty</Label>
                      <Select value={questForm.difficulty} onValueChange={v => setQuestForm({...questForm, difficulty: v})}>
                        <SelectTrigger className="bg-zinc-950 border-amber-900/30 text-amber-100">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-900 border-amber-900/40 text-amber-100">
                           <SelectItem value="easy">Common (Easy)</SelectItem>
                           <SelectItem value="medium">Notable (Medium)</SelectItem>
                           <SelectItem value="hard">Legendary (Hard)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
              </div>

              <DialogFooter className="pt-6">
                  <Button variant="ghost" onClick={() => setQuestModalOpen(false)} className="text-amber-900 hover:text-amber-700">Burn Scroll</Button>
                  <Button 
                    onClick={sendQuest}
                    disabled={!questForm.title || !questForm.description}
                    className="bg-amber-800 hover:bg-amber-700 text-amber-100 border border-amber-600 font-medieval px-8"
                  >
                    Seal & Deliver
                  </Button>
              </DialogFooter>
          </DialogContent>
      </Dialog>

      {/* COMPARISON MODAL */}
      <Dialog open={compareModalOpen} onOpenChange={setCompareModalOpen}>
          <DialogContent className="medieval-card border-amber-500/30 text-white max-w-2xl">
              <DialogHeader>
                  <DialogTitle className="text-2xl font-medieval text-amber-500 text-center tracking-widest uppercase">Chronicle Comparison</DialogTitle>
                  <DialogDescription className="text-center font-serif italic text-amber-900/40">Sizing up the legends of {selectedFriend?.username}.</DialogDescription>
              </DialogHeader>

              {compareStats ? (
                <div className="space-y-8 py-6">
                   {/* Combined Card Overview Effect */}
                   <div className="grid grid-cols-2 gap-8 relative">
                      <div className="absolute left-1/2 top-4 bottom-4 w-px bg-amber-900/20 -translate-x-1/2" />
                      
                      {/* My Side (Minimal mock as we'd need actual myStats) */}
                      <div className="text-center space-y-4">
                         <Badge variant="outline" className="text-amber-600 border-amber-900/30 bg-amber-950/10">Your Legacy</Badge>
                         <div className="flex justify-center">
                            <div className="w-16 h-16 rounded-full border-2 border-amber-500/40 bg-zinc-900 p-1">
                               <Image src={user?.imageUrl || ""} alt="Me" width={64} height={64} className="rounded-full" />
                            </div>
                         </div>
                         <div className="font-medieval text-2xl">Hero</div>
                      </div>

                      {/* Ally Side */}
                      <div className="text-center space-y-4">
                         <Badge variant="outline" className="text-amber-500 border-amber-500/30 bg-amber-500/5">Ally Legacy</Badge>
                         <div className="flex justify-center">
                            <div className="w-16 h-16 rounded-full border-2 border-amber-500 bg-zinc-900 p-1">
                               <Image src={selectedFriend?.imageUrl || ""} alt="Ally" width={64} height={64} className="rounded-full" />
                            </div>
                         </div>
                         <div className="font-medieval text-2xl text-amber-500">{selectedFriend?.username}</div>
                      </div>
                   </div>

                   <div className="space-y-4 bg-zinc-950 p-6 rounded-2xl border border-amber-900/20 shadow-inner">
                      <div className="flex justify-between items-center text-xs uppercase tracking-[0.2em] text-amber-500/50 font-black mb-4">
                        <span>The Archive</span>
                        <div className="flex gap-2">
                           <div className="w-2 h-2 rounded-full bg-zinc-800" />
                           <div className="w-2 h-2 rounded-full bg-amber-500" />
                        </div>
                      </div>

                      {/* Stat Rows */}
                      {[
                        { label: 'Renown (Level)', val: compareStats?.level || 0, icon: Crown, color: 'text-amber-500' },
                        { label: 'Heroic Quests', val: compareStats?.questsFinished || 0, icon: Scroll, color: 'text-blue-400' },
                        { label: 'Feats of Might', val: compareStats?.challengesFinished || 0, icon: Sword, color: 'text-red-400' },
                        { label: 'Bonds Shared', val: compareStats?.giftsShared || 0, icon: Gift, color: 'text-pink-400' },
                      ].map(stat => (
                        <div key={stat.label} className="group/stat">
                          <div className="flex justify-between items-center mb-1.5 px-1">
                            <div className="flex items-center gap-2">
                               <stat.icon className={cn("w-3.5 h-3.5", stat.color)} />
                               <span className="text-xs font-medieval text-amber-100/80">{stat.label}</span>
                            </div>
                            <span className="font-medieval text-amber-500">{stat.val}</span>
                          </div>
                          <div className="h-1 bg-zinc-900 rounded-full overflow-hidden">
                             <div className={cn("h-full opacity-60 transition-all duration-1000", stat.color.replace('text-', 'bg-'))} style={{ width: `${Math.min((stat.val / 100) * 100, 100)}%` }} />
                          </div>
                        </div>
                      ))}
                   </div>
                </div>
              ) : (
                <div className="py-20 text-center animate-pulse">
                   <div className="w-12 h-12 bg-amber-950/20 rounded-full mx-auto mb-4 border border-amber-900/20" />
                   <p className="font-serif italic text-amber-900/40">Unrolling the chronicles...</p>
                </div>
              )}

              <DialogFooter className="mt-4">
                  <Button onClick={() => setCompareModalOpen(false)} className="w-full bg-amber-900/20 border-amber-900/40 text-amber-500 hover:bg-amber-900/40 font-medieval font-bold">
                    Close the Vault
                  </Button>
              </DialogFooter>
          </DialogContent>
      </Dialog>

      {/* GIFT MODAL wrapper */}
      {selectedFriend && (
         <GiftModal 
           open={giftModalOpen}
           onOpenChange={setGiftModalOpen}
           recipientId={selectedFriend.friendId}
           recipientName={selectedFriend.username}
           userGold={getCharacterStats().gold}
         />
      )}
    </div>
  )
}

export default AlliesDashboard;
