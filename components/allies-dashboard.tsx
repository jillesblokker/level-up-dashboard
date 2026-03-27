"use client"

import { logger } from "@/lib/logger";

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useUser } from "@clerk/nextjs"
import Image from "next/image"
import { Users, UserPlus, Mail, Shield, Sword, Scroll, Trophy, Star, Crown, Flame, UserCheck, MoreHorizontal, Gift, Target } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
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
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("allies");
  const [friends, setFriends] = useState<Friend[]>([]);
  const [requests, setRequests] = useState<Friend[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

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

  if (isLoading) return <div className="p-8 text-center text-amber-500/50">Summoning your allies...</div>;

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full grid grid-cols-3 bg-amber-950/20 border border-amber-900/40 mb-8">
          <TabsTrigger value="allies" className="data-[state=active]:bg-amber-900/40 text-amber-100">
            <Users className="w-4 h-4 mr-2" />
            My Allies
            {friends.length > 0 && <Badge variant="secondary" className="ml-2 bg-amber-500/20 text-amber-300 border-amber-500/30">{friends.length}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="add" className="data-[state=active]:bg-amber-900/40 text-amber-100">
            <UserPlus className="w-4 h-4 mr-2" />
            Recruit
          </TabsTrigger>
          <TabsTrigger value="requests" className="data-[state=active]:bg-amber-900/40 text-amber-100 relative">
            <Mail className="w-4 h-4 mr-2" />
            Registry
            {requests.length > 0 && <Badge variant="destructive" className="ml-2 animate-pulse">{requests.length}</Badge>}
          </TabsTrigger>
        </TabsList>

        {/* MY ALLIES TAB */}
        <TabsContent value="allies" className="space-y-4">
          {friends.length === 0 ? (
            <Card className="bg-black/40 border-amber-900/40 border-dashed p-12 text-center">
              <div className="flex flex-col items-center">
                <Users className="w-16 h-16 text-amber-900/40 mb-4" />
                <h3 className="text-xl font-medieval text-amber-500 mb-2">No Allies Found</h3>
                <p className="text-gray-500 mb-6">Your chronicle is yet to feature other heroes.</p>
                <Button onClick={() => setActiveTab("add")} variant="outline" className="border-amber-800 text-amber-500">
                  Find New Allies
                </Button>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {friends.map(friend => {
                const level = friend.stats?.level || 1;
                const titleInfo = getCurrentTitle(level);

                return (
                  <Card key={friend.id} className="bg-black/40 border-amber-900/40 overflow-hidden group hover:border-amber-500/40 transition-all">
                    <CardContent className="p-0">
                      <div className="p-4 flex items-center gap-4 bg-gradient-to-r from-amber-900/10 to-transparent border-b border-amber-900/20">
                        <Avatar className="h-12 w-12 border-2 border-amber-900/40">
                          <AvatarImage src={friend.imageUrl} />
                          <AvatarFallback className="bg-amber-950 text-amber-500 font-bold">{friend.username.substring(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medieval text-lg text-amber-100 truncate">{friend.username}</h4>
                          <div className="flex items-center gap-2 text-xs text-amber-600 font-semibold">
                            <Shield className="w-3 h-3" />
                            {friend.stats?.allianceName || "Lone Wanderer"}
                          </div>
                        </div>
                        {friend.stats?.streak && friend.stats.streak > 0 && (
                          <div className="flex items-center gap-1 bg-orange-950/30 text-orange-500 px-2 py-1 rounded border border-orange-900/20">
                            <Flame className="w-3 h-3" />
                            {friend.stats.streak}
                          </div>
                        )}
                      </div>

                      <div className="p-4 grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <div className="text-[10px] uppercase text-amber-900/60 font-bold">Rank</div>
                          <div className="text-sm font-medium text-amber-200">{titleInfo.name}</div>
                        </div>
                        <div className="space-y-1 text-right">
                          <div className="text-[10px] uppercase text-amber-900/60 font-bold">Level</div>
                          <div className="text-sm font-bold text-amber-500">{level}</div>
                        </div>
                      </div>

                      <div className="p-4 pt-0 flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="flex-1 h-8 text-xs text-amber-600 hover:bg-amber-900/20"
                          onClick={() => router.push(`/kingdom?visit=${friend.friendId}`)}
                        >
                          <Crown className="w-3 h-3 mr-2" /> Visit
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 text-amber-900 hover:text-amber-500">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-black border-amber-900/50 text-amber-100">
                            <DropdownMenuItem onClick={() => removeFriend(friend.id)} className="text-red-900 focus:text-red-500 focus:bg-red-950/10">
                              <UserCheck className="w-4 h-4 mr-2" /> Unfriend
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* RECRUIT TAB */}
        <TabsContent value="add" className="space-y-6">
          <Card className="bg-black/40 border-amber-900/40">
            <CardHeader>
              <CardTitle className="text-amber-500 font-medieval">Gather Your Cohort</CardTitle>
              <CardDescription className="text-amber-900/60 font-serif">Search the registry for notable heroes.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 mb-6">
                <Input
                  placeholder="Enter username..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="bg-black/50 border-amber-900/30 text-amber-100"
                />
                <Button onClick={handleSearch} disabled={isSearching} className="bg-amber-800 hover:bg-amber-700 text-amber-100 border border-amber-600">
                  {isSearching ? "Searching..." : "Search"}
                </Button>
              </div>

              <div className="grid gap-4">
                {searchResults.map(u => (
                  <div key={u.id} className="flex items-center justify-between p-3 border border-amber-900/20 rounded-lg bg-black/20 hover:bg-amber-950/10 transition-colors">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10 border border-amber-900/40">
                        <AvatarImage src={u.imageUrl} />
                        <AvatarFallback className="bg-amber-950 text-amber-500">{u.username.substring(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <span className="font-medium text-amber-100">{u.username}</span>
                    </div>
                    <Button size="sm" onClick={() => sendFriendRequest(u.id)} className="bg-amber-900/40 text-amber-400 hover:bg-amber-900/60 border border-amber-500/20">
                      <UserPlus className="w-4 h-4 mr-2" /> Invite
                    </Button>
                  </div>
                ))}
                {searchResults.length === 0 && searchQuery && !isSearching && (
                  <p className="text-center text-amber-900/40 font-serif py-4">No hero by that name was found in the scrolls.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* REGISTRY TAB */}
        <TabsContent value="requests" className="space-y-4">
          {requests.length === 0 ? (
            <div className="text-center py-12 text-amber-900/40 font-serif">
              <Mail className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p>Your mailbox is quiet tonight.</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {requests.map(req => (
                <Card key={req.id} className="bg-black/40 border-amber-900/40">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="border border-amber-900/40">
                        <AvatarImage src={req.imageUrl} />
                        <AvatarFallback className="bg-amber-950 text-amber-500">{req.username.substring(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div>
                        <h4 className="font-medieval text-amber-100">{req.username}</h4>
                        <p className="text-xs text-amber-900/60 font-serif">
                          {req.isSender ? "Summons sent out" : "Awaits your acceptance"}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {!req.isSender && (
                        <Button size="sm" onClick={() => respondToRequest(req.id, 'accept')} className="bg-amber-800 hover:bg-amber-700 text-amber-100">
                          Accept
                        </Button>
                      )}
                      <Button size="sm" variant="ghost" onClick={() => respondToRequest(req.id, 'reject')} className="text-amber-900 hover:text-amber-700">
                        {req.isSender ? "Cancel" : "Decline"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
