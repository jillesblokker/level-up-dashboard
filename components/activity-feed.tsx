
"use client";

import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Scroll, Zap } from "lucide-react";

interface Activity {
    id: string;
    type: string;
    message: string;
    timestamp: string;
    user: string;
    details: string;
}

export function ActivityFeed() {
    const [activities, setActivities] = useState<Activity[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchActivity() {
            try {
                const res = await fetch('/api/activity');
                const data = await res.json();
                if (data.success) {
                    setActivities(data.data);
                }
            } catch (error) {
                console.error("Failed to load activity", error);
            } finally {
                setLoading(false);
            }
        }

        fetchActivity();

        // Optional: Poll every 30 seconds for live feeling
        const interval = setInterval(fetchActivity, 30000);
        return () => clearInterval(interval);
    }, []);

    if (loading && activities.length === 0) {
        return (
            <Card className="h-full border-[#d4af37]/30 bg-black/40 backdrop-blur-sm">
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
        <Card className="h-full border-[#d4af37]/30 bg-black/40 backdrop-blur-sm">
            <CardHeader className="pb-3 border-b border-[#d4af37]/10">
                <CardTitle className="text-[#d4af37] flex items-center gap-2 text-lg">
                    <Scroll className="w-5 h-5" />
                    Realm Chronicles
                </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4 max-h-[400px] overflow-y-auto custom-scrollbar">
                {activities.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8 italic">
                        The realm is quiet...
                    </div>
                ) : (
                    activities.map((activity) => (
                        <div key={activity.id} className="flex gap-3 items-start group">
                            <div className="mt-1 w-8 h-8 rounded-full bg-[#d4af37]/10 flex items-center justify-center shrink-0 group-hover:bg-[#d4af37]/20 transition-colors">
                                <Zap className="w-4 h-4 text-[#d4af37]" />
                            </div>
                            <div className="flex-1 space-y-1">
                                <p className="text-sm text-gray-200 leading-snug">
                                    <span className="font-bold text-[#f7e7ce]">{activity.user}</span> completed <span className="text-[#d4af37] font-medium">{activity.details}</span>
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    {new Date(activity.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                            </div>
                        </div>
                    ))
                )}
            </CardContent>
        </Card>
    );
}
