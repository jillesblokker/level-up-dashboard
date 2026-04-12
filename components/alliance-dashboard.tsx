"use client"

import { logger } from "@/lib/logger";

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Users, Shield, Flame, CheckCircle, Plus, UserPlus, PlusCircle, Star, Crown } from "lucide-react"
import { useUser } from "@clerk/nextjs"
import { getUserAlliances, checkInToAlliance, createAlliance, inviteToAlliance, Alliance } from "@/lib/alliance-manager"
import { useToast } from "@/components/ui/use-toast"
import { useSound, SOUNDS } from "@/lib/sound-manager"

interface Friend {
    id: string; // Friendship ID
    friendId: string; // User ID
    username: string;
}

export function AllianceDashboard() {
    const { user } = useUser();
    const { toast } = useToast();
    const { playSound } = useSound();

    const [alliances, setAlliances] = useState<Alliance[]>([]);
    const [loading, setLoading] = useState(true);

    // Create Modal logic
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [createForm, setCreateForm] = useState({ name: "", description: "" });
    const [isCreating, setIsCreating] = useState(false);

    // Invite Modal logic
    const [inviteModalOpen, setInviteModalOpen] = useState(false);
    const [selectedAllianceId, setSelectedAllianceId] = useState<string | null>(null);
    const [friends, setFriends] = useState<Friend[]>([]);
    const [selectedFriendId, setSelectedFriendId] = useState<string>("");
    const [loadingFriends, setLoadingFriends] = useState(false);

    useEffect(() => {
        if (user) {
            refreshAlliances();
        }
    }, [user]);

    const refreshAlliances = () => {
        setLoading(true);
        getUserAlliances(user?.id).then(data => {
            setAlliances(data);
            setLoading(false);
        });
    }

    const handleCheckIn = async (allianceId: string, allianceName: string) => {
        const result = await checkInToAlliance(allianceId);
        if (result.success) {
            playSound(SOUNDS.ALLIANCE_OATH);
            toast({
                title: "Alliance Oath Fulfilled!",
                description: `You have strengthened your bond with ${allianceName}. Streak: ${result.streak}`,
                className: "bg-amber-950 border-amber-500 text-amber-100"
            });
            // Optimistic update
            setAlliances(current => current.map(a => {
                if (a.id === allianceId) {
                    return {
                        ...a,
                        myStreak: {
                            current: result.streak || (a.myStreak?.current || 0) + 1,
                            checkedInToday: true,
                            lastCheckIn: new Date().toISOString()
                        }
                    };
                }
                return a;
            }));
            refreshAlliances(); // Background refresh just in case
        } else {
            playSound(SOUNDS.ERROR);
            toast({
                title: "Oath Already Sworn",
                description: result.message,
                variant: (result.message?.includes('already') ? "default" : "destructive")
            });
        }
    };

    const handleCreateAlliance = async () => {
        if (!createForm.name.trim()) return;
        setIsCreating(true);
        const result = await createAlliance(createForm.name, createForm.description);
        setIsCreating(false);

        if (result.success) {
            toast({ title: "Alliance Formed", description: `${createForm.name} has been established!` });
            setCreateModalOpen(false);
            setCreateForm({ name: "", description: "" });
            refreshAlliances();
        } else {
            toast({ title: "Creation Failed", description: result.error, variant: "destructive" });
        }
    };

    const openInviteModal = async (allianceId: string) => {
        setSelectedAllianceId(allianceId);
        setInviteModalOpen(true);
        setLoadingFriends(true);

        try {
            const res = await fetch('/api/friends');
            const data = await res.json();
            if (res.ok) {
                // Filter friends: only accepted ones
                const acceptedFriends = (data.friends || []).map((f: any) => ({
                    id: f.id,
                    friendId: f.friendId,
                    username: f.username
                }));
                setFriends(acceptedFriends);
            }
        } catch (e) {
            logger.error(e);
        } finally {
            setLoadingFriends(false);
        }
    };

    const handleInvite = async () => {
        if (!selectedAllianceId || !selectedFriendId) return;

        // Find friend object to get real user ID (friendId)
        // Ensure we send the USER ID, not the Friendship ID
        // The Select value below is set to friend.friendId

        const result = await inviteToAlliance(selectedAllianceId, selectedFriendId);
        if (result.success) {
            toast({ title: "Invitation Sent", description: "Your ally has been added to the alliance." });
            setInviteModalOpen(false);
            setSelectedFriendId("");
            refreshAlliances();
        } else {
            toast({ title: "Invite Failed", description: result.error, variant: "destructive" });
        }
    };

    if (loading) return <div className="text-center p-4 text-amber-500/50">Summoning alliance records...</div>;

    // --- Oath Benefits Banner shown inside each active alliance card ---
    const OathBenefitsBanner = ({ streak, checkedInToday }: { streak: number; checkedInToday: boolean }) => (
        <div className={`rounded-xl border p-4 mb-4 transition-colors ${checkedInToday
            ? "bg-green-950/30 border-green-800/40"
            : "bg-amber-950/30 border-amber-700/40"
        }`}>
            <p className="text-[11px] font-bold uppercase tracking-widest text-amber-500/70 mb-2 flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-orange-500" />
                The Oath of Brotherhood — Daily Reward
            </p>
            <p className="text-sm text-amber-100/60 leading-relaxed mb-3 font-serif italic">
                &ldquo;Each dawn, a true ally reaffirms their bond. Speak the oath daily and your treasury shall grow — miss a day and your fire dims.&rdquo;
            </p>
            <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-black/30 rounded-lg p-2.5 border border-amber-900/30">
                    <div className="text-lg font-bold text-amber-400">+50</div>
                    <div className="text-[10px] text-amber-500/60 uppercase tracking-wide font-semibold">XP</div>
                    <div className="text-[9px] text-gray-600 mt-0.5">per oath</div>
                </div>
                <div className="bg-black/30 rounded-lg p-2.5 border border-amber-900/30">
                    <div className="text-lg font-bold text-yellow-400">+10</div>
                    <div className="text-[10px] text-amber-500/60 uppercase tracking-wide font-semibold">Gold</div>
                    <div className="text-[9px] text-gray-600 mt-0.5">per oath</div>
                </div>
                <div className={`rounded-lg p-2.5 border ${streak >= 7 ? "bg-orange-950/40 border-orange-700/50" : "bg-black/30 border-amber-900/30"}`}>
                    <div className="text-lg font-bold text-orange-400 flex items-center justify-center gap-0.5">
                        {streak > 0 ? <><Flame className="w-4 h-4" />{streak}</> : <span className="text-gray-600">—</span>}
                    </div>
                    <div className="text-[10px] text-amber-500/60 uppercase tracking-wide font-semibold">Streak</div>
                    <div className="text-[9px] text-gray-600 mt-0.5">days kept</div>
                </div>
            </div>
            {streak >= 7 && (
                <div className="mt-3 text-center text-[11px] text-orange-400/90 font-semibold border-t border-amber-900/20 pt-2">
                    🔥 <span>{streak}-day streak!</span> Bonus gold multiplier is active.
                </div>
            )}
            {checkedInToday && (
                <div className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-green-400/80 font-medium border-t border-green-900/20 pt-2">
                    <CheckCircle className="w-3.5 h-3.5" />
                    Oath sworn for today. Return at dawn to renew your vow.
                </div>
            )}
        </div>
    );

    return (
        <div className="space-y-4 h-full flex flex-col">
            {alliances.length === 0 ? (
                <Card className="border-amber-900/40 bg-black/40 h-full flex flex-col justify-center min-h-[500px] relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-amber-900/5 to-black pointer-events-none" />
                    <CardHeader className="relative z-10 pb-2">
                        <CardTitle className="flex items-center justify-center gap-2 text-amber-500/80 font-medieval text-2xl">
                            <Users className="w-6 h-6" />
                            Alliances
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="relative z-10 flex flex-col items-center justify-center text-center space-y-6 px-6">
                        <div className="relative">
                            <div className="absolute inset-0 bg-amber-500/20 blur-xl rounded-full" style={{ animation: "pulse 8s ease-in-out infinite" }} />
                            <Shield className="w-20 h-20 text-amber-900/40 relative z-10" />
                            <PlusCircle className="w-7 h-7 text-amber-500 absolute bottom-0 right-0 z-20 bg-black rounded-full p-1 border border-amber-900" />
                        </div>

                        <div className="space-y-1 max-w-sm">
                            <p className="text-amber-100/80 font-medium text-lg">You walk alone... for now.</p>
                            <p className="text-amber-500/50 text-sm leading-relaxed">
                                No alliance yet binds you to others. Form or join one to begin swearing the daily oath and collecting rewards.
                            </p>
                        </div>

                        {/* Benefit preview cards */}
                        <div className="w-full max-w-sm rounded-xl border border-amber-900/30 bg-amber-950/20 p-4 text-left space-y-3">
                            <p className="text-[11px] font-bold uppercase tracking-widest text-amber-500/60 text-center">Why join an alliance?</p>
                            <div className="space-y-2.5 text-sm text-amber-100/60">
                                <div className="flex items-start gap-2.5">
                                    <div className="w-7 h-7 rounded-lg bg-orange-950/50 border border-orange-900/40 flex items-center justify-center shrink-0 mt-0.5">
                                        <Flame className="w-4 h-4 text-orange-500" />
                                    </div>
                                    <span><span className="text-amber-300 font-semibold">Daily Oath:</span> Check in each day to earn <strong className="text-amber-400">+50 XP</strong> and <strong className="text-yellow-400">+10 Gold</strong>. Keep your streak for a gold bonus.</span>
                                </div>
                                <div className="flex items-start gap-2.5">
                                    <div className="w-7 h-7 rounded-lg bg-amber-950/50 border border-amber-900/40 flex items-center justify-center shrink-0 mt-0.5">
                                        <Shield className="w-4 h-4 text-amber-500" />
                                    </div>
                                    <span><span className="text-amber-300 font-semibold">Alliance Might:</span> Your combined levels fill the <strong className="text-amber-400">Alliance Chest</strong>, unlocking bonus rewards for all members.</span>
                                </div>
                                <div className="flex items-start gap-2.5">
                                    <div className="w-7 h-7 rounded-lg bg-amber-950/50 border border-amber-900/40 flex items-center justify-center shrink-0 mt-0.5">
                                        <Crown className="w-4 h-4 text-yellow-500" />
                                    </div>
                                    <span><span className="text-amber-300 font-semibold">Leaderboards:</span> Compete monthly for the title of <strong className="text-amber-400">Dominant Alliance</strong> of the realm.</span>
                                </div>
                            </div>
                        </div>

                        <Button
                            onClick={() => setCreateModalOpen(true)}
                            size="lg"
                            className="bg-gradient-to-r from-amber-800 to-amber-900 hover:from-amber-700 hover:to-amber-800 text-amber-100 border border-amber-700/50 shadow-lg shadow-amber-900/20 transition-all transform hover:scale-105"
                        >
                            <Plus className="w-5 h-5 mr-2" />
                            Form New Alliance
                        </Button>

                        <p className="text-xs text-amber-900/60">
                            Or wait for an invite from a friend...
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <>
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="text-lg font-medieval text-amber-500">Your Allegiances</h3>
                        <Button size="sm" variant="outline" onClick={() => setCreateModalOpen(true)}>
                            <Plus className="w-4 h-4 mr-2" /> New Alliance
                        </Button>
                    </div>
                    {alliances.map(alliance => (
                        <Card key={alliance.id} className="border-amber-500/30 bg-black/60 shadow-lg shadow-amber-900/10 mb-4">
                            <CardHeader className="pb-2">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <CardTitle className="text-amber-400 flex items-center gap-2">
                                            <Shield className="w-4 h-4" />
                                            {alliance.name}
                                        </CardTitle>
                                        <CardDescription className="text-gray-500 text-xs mt-1">
                                            {alliance.description || "A band of noble adventurers."}
                                        </CardDescription>
                                    </div>
                                    <div className="text-xs bg-amber-950/50 px-2 py-1 rounded text-amber-300 border border-amber-900">
                                        {alliance.members.length} Members
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {/* Oath Benefits Banner */}
                                <OathBenefitsBanner
                                    streak={alliance.myStreak?.current || 0}
                                    checkedInToday={alliance.myStreak?.checkedInToday || false}
                                />

                                <div className="flex justify-between items-center">
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => openInviteModal(alliance.id)}
                                        className="text-amber-500 hover:bg-amber-900/20"
                                    >
                                        <UserPlus className="w-4 h-4 mr-1.5" />
                                        Invite Ally
                                    </Button>

                                    {alliance.myStreak?.checkedInToday ? (
                                        <Button
                                            size="sm"
                                            disabled
                                            className="bg-green-900/40 text-green-400 border border-green-900/50 cursor-not-allowed opacity-90"
                                        >
                                            <CheckCircle className="w-3 h-3 mr-2" />
                                            Oath Sworn ✓
                                        </Button>
                                    ) : (
                                        <Button
                                            size="sm"
                                            onClick={() => handleCheckIn(alliance.id, alliance.name)}
                                            className="bg-gradient-to-r from-amber-700 to-amber-800 hover:from-amber-600 hover:to-amber-700 text-amber-100 border border-amber-600 shadow-md shadow-amber-900/30 font-semibold px-4"
                                        >
                                            <Flame className="w-3.5 h-3.5 mr-2 text-orange-400" />
                                            Swear Today&apos;s Oath
                                        </Button>
                                    )}
                                </div>

                                {alliance.stats && (
                                    <div className="mt-4 pt-4 border-t border-amber-900/30">
                                        <div className="flex justify-between items-center text-xs text-amber-500 mb-1">
                                            <span className="flex items-center gap-1"><Shield className="w-3 h-3" /> Alliance Might (Total Levels)</span>
                                            <span>{alliance.stats.totalLevel} / {Math.max(50, alliance.stats.memberCount * 20)}</span>
                                        </div>
                                        <Progress value={Math.min(100, (alliance.stats.totalLevel / Math.max(50, alliance.stats.memberCount * 20)) * 100)} className="h-2 bg-amber-950/50" indicatorClassName="bg-amber-500" />
                                        <p className="text-[10px] text-gray-500 mt-1 text-center">
                                            Level up together to unlock the Alliance Chest!
                                        </p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </>
            )
            }

            {/* CREATE ALLIANCE MODAL */}
            <Sheet open={createModalOpen} onOpenChange={setCreateModalOpen}>
                <SheetContent className="bg-black/95 border-amber-900/50 text-amber-100">
                    <SheetHeader>
                        <SheetTitle>Form an Alliance</SheetTitle>
                        <SheetDescription>
                            Gather your allies under one banner.
                        </SheetDescription>
                    </SheetHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Alliance Name</Label>
                            <Input
                                value={createForm.name}
                                onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                                placeholder="e.g. The Iron Vanguard"
                                className="bg-black/50 border-amber-900/30"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Description</Label>
                            <Input
                                value={createForm.description}
                                onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                                placeholder="A brief motto..."
                                className="bg-black/50 border-amber-900/30"
                            />
                        </div>
                    </div>
                    <SheetFooter>
                        <Button variant="ghost" onClick={() => setCreateModalOpen(false)}>Cancel</Button>
                        <Button onClick={handleCreateAlliance} disabled={isCreating} className="bg-amber-700 hover:bg-amber-600 text-black">
                            {isCreating ? "Forging..." : "Create Alliance"}
                        </Button>
                    </SheetFooter>
                </SheetContent>
            </Sheet>

            {/* INVITE MODAL */}
            <Sheet open={inviteModalOpen} onOpenChange={setInviteModalOpen}>
                <SheetContent className="bg-black/95 border-amber-900/50 text-amber-100">
                    <SheetHeader>
                        <SheetTitle>Invite New Member</SheetTitle>
                        <SheetDescription>
                            Select an ally to join your ranks.
                        </SheetDescription>
                    </SheetHeader>
                    <div className="space-y-4 py-4">
                        {loadingFriends ? (
                            <div className="text-center text-sm text-gray-500">Loading allies...</div>
                        ) : friends.length === 0 ? (
                            <div className="text-center text-sm text-gray-500">No allies found to invite.</div>
                        ) : (
                            <div className="space-y-2">
                                <Label>Select Ally</Label>
                                <Select value={selectedFriendId} onValueChange={setSelectedFriendId}>
                                    <SelectTrigger className="bg-black/50 border-amber-900/30">
                                        <SelectValue placeholder="Choose a friend" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-gray-900 border-amber-900/30 text-amber-100">
                                        {friends.map(f => (
                                            <SelectItem key={f.friendId} value={f.friendId}>
                                                {f.username}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                    </div>
                    <SheetFooter>
                        <Button variant="ghost" onClick={() => setInviteModalOpen(false)}>Cancel</Button>
                        <Button onClick={handleInvite} disabled={!selectedFriendId} className="bg-amber-700 hover:bg-amber-600 text-black">
                            Invite
                        </Button>
                    </SheetFooter>
                </SheetContent>
            </Sheet>
        </div >
    )
}
