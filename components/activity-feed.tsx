
"use client"

import { logger } from "@/lib/logger";
;

import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Scroll, Zap, PartyPopper } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

interface Activity {
    id: string;
    type: string;
    message: string;
    timestamp: string;
    user: string;
    details: string;
    userId?: string;
}

export function ActivityFeed() {
    const [activities, setActivities] = useState<Activity[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();
    const [cheeringIds, setCheeringIds] = useState<Set<string>>(new Set());

    const handleCheer = async (activity: Activity) => {
        if (!activity.userId || cheeringIds.has(activity.id)) return;
        
        setCheeringIds(prev => new Set(prev).add(activity.id));
        
        try {
            const res = await fetch('/api/social/cheer', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ targetUserId: activity.userId })
            });
            const data = await res.json();
            
            if (data.success) {
                toast({
                    title: "Cheer Sent! 🎉",
                    description: `You cheered ${activity.user}. They received ${data.rewards?.gold} Gold and ${data.rewards?.xp} XP!`,
                });
            } else {
                toast({
                    title: "Could not send cheer",
                    description: data.error || "Something went wrong.",
                    variant: "destructive"
                });
                setCheeringIds(prev => {
                    const next = new Set(prev);
                    next.delete(activity.id);
                    return next;
                });
            }
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to send cheer.",
                variant: "destructive"
            });
            setCheeringIds(prev => {
                const next = new Set(prev);
                next.delete(activity.id);
                return next;
            });
        }
    };

    useEffect(() => {
        async function fetchActivity() {
            try {
                const res = await fetch('/api/activity');
                const data = await res.json();
                if (data.success) {
                    setActivities(data.data);
                }
            } catch (error) {
                logger.error("Failed to load activity", error);
            } finally {
                setLoading(false);
            }
        }

        fetchActivity();

        let interval: NodeJS.Timeout | null = null;

        const start = () => {
            if (interval) clearInterval(interval);
            interval = setInterval(fetchActivity, 120000); // 2 minutes
        };
        const stop = () => {
            if (interval) clearInterval(interval);
            interval = null;
        };

        const onVisibility = () => document.hidden ? stop() : start();
        document.addEventListener('visibilitychange', onVisibility);
        start();

        return () => {
            stop();
            document.removeEventListener('visibilitychange', onVisibility);
        };
    }, []);

    if (loading && activities.length === 0) {
        return (
            <Card className="h-full border-[#d4af37]/30 bg-zinc-950 ">
                <CardHeader>
                    <CardTitle className="text-[#d4af37] flex items-center gap-2">
                        <Scroll className="w-5 h-5" />
                        Realm Activity
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="h-12 bg-[#d4af37]/10 rounded animate-pulse" />
                    ))}
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="h-full border-[#d4af37]/30 bg-zinc-950 ">
            <CardHeader className="pb-3 border-b border-[#d4af37]/10">
                <CardTitle className="text-[#d4af37] flex items-center gap-2 text-lg">
                    <Scroll className="w-5 h-5" />
                    Realm Chronicles
                </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4 max-h-[400px] overflow-y-auto custom-scrollbar">
                {activities.length === 0 ? (
                    <div className="text-center py-10 px-4 flex flex-col items-center select-none">
                        <div className="w-12 h-12 rounded-full bg-[#d4af37]/5 border border-[#d4af37]/15 flex items-center justify-center mb-4 text-[#d4af37]/45 text-xl">
                            📜
                        </div>
                        <h4 className="text-sm font-serif font-bold text-[#d4af37] mb-1.5">The Chronicle Scribes Slumber</h4>
                        <p className="text-[11px] text-zinc-400 max-w-[280px] leading-relaxed">
                            No heroic deeds or daily achievements have been recorded in the kingdom yet. Complete a quest, build a new tile, or rally your allies to see active milestones posted here!
                        </p>
                    </div>
                ) : (
                    activities.map((activity) => (
                        <div key={activity.id} className="flex gap-3 items-start group">
                            <div className="mt-1 w-8 h-8 rounded-full bg-[#d4af37]/10 flex items-center justify-center shrink-0 group-hover:bg-[#d4af37]/20 transition-colors">
                                <Zap className="w-4 h-4 text-[#d4af37]" />
                            </div>
                            <div className="flex-1 space-y-1">
                                <p className="text-sm text-zinc-200 leading-snug">
                                    <span className="font-bold text-[#f7e7ce]">{activity.user}</span> completed <span className="text-[#d4af37] font-medium">{activity.details}</span>
                                </p>
                                <div className="flex items-center justify-between">
                                    <p className="text-xs text-muted-foreground">
                                        {new Date(activity.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                    {activity.userId && (
                                        <Button 
                                            size="sm" 
                                            variant="ghost" 
                                            className={`h-6 text-xs px-2 rounded-full border border-amber-900/30 hover:bg-amber-900/20 hover:text-amber-400 transition-all ${cheeringIds.has(activity.id) ? 'bg-amber-900/20 text-amber-500 opacity-50 cursor-not-allowed' : 'text-zinc-400'}`}
                                            onClick={() => handleCheer(activity)}
                                            disabled={cheeringIds.has(activity.id)}
                                        >
                                            <PartyPopper className="w-3 h-3 mr-1" />
                                            {cheeringIds.has(activity.id) ? 'Cheered!' : 'Cheer'}
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </CardContent>
        </Card>
    );
}

export default ActivityFeed;
