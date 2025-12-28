"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Users, Shield, Flame, CheckCircle } from "lucide-react"
import { useUser } from "@clerk/nextjs"
import { getUserAlliances, checkInToAlliance, Alliance } from "@/lib/alliance-manager"
import { useToast } from "@/components/ui/use-toast"
import { useSound, SOUNDS } from "@/lib/sound-manager"

export function AllianceDashboard() {
    const { user } = useUser();
    const { toast } = useToast();
    const [alliances, setAlliances] = useState<Alliance[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) {
            getUserAlliances(user.id).then(data => {
                setAlliances(data);
                setLoading(false);
            });
        }
    }, [user]);

    const { playSound } = useSound();

    const handleCheckIn = async (allianceId: string, allianceName: string) => {
        const result = await checkInToAlliance(allianceId);
        if (result.success) {
            playSound(SOUNDS.ALLIANCE_OATH);
            toast({
                title: "Alliance Oath Fulfilled!", // Medieval flavor
                description: `You have strengthened your bond with ${allianceName}. Streak: ${result.streak}`,
                className: "bg-amber-950 border-amber-500 text-amber-100"
            });
            // Ideally trigger refresh of alliance data here
        } else {
            playSound(SOUNDS.ERROR);
            toast({
                title: "Oath Already Sworn",
                description: result.message,
                variant: (result.message?.includes('already') ? "default" : "destructive")
            });
        }
    };

    if (loading) return <div className="text-center p-4 text-amber-500/50">Summoning alliance records...</div>;

    if (alliances.length === 0) {
        return (
            <Card className="border-amber-900/40 bg-black/40">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-amber-500">
                        <Users className="w-5 h-5" />
                        Alliances
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-gray-400 text-sm">You have not sworn an oath to any alliance yet.</p>
                    <Button variant="outline" className="mt-4 border-amber-700 text-amber-500 hover:bg-amber-950/50" disabled>
                        Join Alliance (Coming Soon)
                    </Button>
                </CardContent>
            </Card>
        )
    }

    return (
        <div className="space-y-4">
            {alliances.map(alliance => (
                <Card key={alliance.id} className="border-amber-500/30 bg-black/60 shadow-lg shadow-amber-900/10">
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
                        <div className="flex justify-between items-center mt-2">
                            <div className="flex items-center gap-2 text-sm text-gray-400">
                                <Flame className="w-4 h-4 text-orange-500" />
                                <span>Daily Oath</span>
                            </div>
                            <Button
                                size="sm"
                                onClick={() => handleCheckIn(alliance.id, alliance.name)}
                                className="bg-amber-800 hover:bg-amber-700 text-amber-100 border border-amber-600"
                            >
                                <CheckCircle className="w-3 h-3 mr-2" />
                                Check In
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
