"use client"

import { useState } from "react"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { Settings, User, Save } from "lucide-react"
import { updateCharacterStats, useCharacterStats } from "@/hooks/use-character-stats"

export function ProfileSettings() {
    const { stats } = useCharacterStats();
    const [name, setName] = useState(stats.display_name || "Adventurer");
    const [title, setTitle] = useState(stats.title || "Novice");
    const [isOpen, setIsOpen] = useState(false);
    const { toast } = useToast();

    // Sync local state when stats load
    // Note: This is simple; for production reacting to stats changes might be needed
    // useEffect(() => {
    //     if(stats.display_name) setName(stats.display_name);
    //     if(stats.title) setTitle(stats.title);
    // }, [stats]);

    const handleSave = () => {
        if (!name.trim()) {
            toast({ title: "Name required", description: "You cannot be nameless!", variant: "destructive" });
            return;
        }

        updateCharacterStats({
            display_name: name,
            title: title
        }, 'profile-settings');

        toast({
            title: "Profile Updated",
            description: `Hail, ${title} ${name}!`,
            className: "bg-green-900 border-green-700 text-white"
        });
        setIsOpen(false);
    };

    return (
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
                    <User className="h-5 w-5" />
                    <span className="sr-only">Profile Settings</span>
                </Button>
            </SheetTrigger>
            <SheetContent className="bg-black/95 border-l-amber-900/50 text-amber-100">
                <SheetHeader>
                    <SheetTitle className="text-amber-500 font-medieval text-2xl">Character Profile</SheetTitle>
                </SheetHeader>

                <div className="space-y-6 mt-8">
                    <div className="space-y-2">
                        <Label htmlFor="displayName">Name</Label>
                        <Input
                            id="displayName"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="bg-gray-900/50 border-amber-900/30 text-amber-100 placeholder:text-gray-600"
                            placeholder="Enter your name..."
                        />
                        <p className="text-xs text-gray-500">How you will be known in the leaderboards.</p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="title">Title</Label>
                        <Input
                            id="title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="bg-gray-900/50 border-amber-900/30 text-amber-100 placeholder:text-gray-600"
                            placeholder="e.g. The Bold"
                        />
                        <p className="text-xs text-gray-500">An earned or chosen title.</p>
                    </div>

                    {/* Future: Avatar Selection */}

                    <Button
                        onClick={handleSave}
                        className="w-full bg-amber-700 hover:bg-amber-600 text-black font-semibold mt-4"
                    >
                        <Save className="mr-2 h-4 w-4" />
                        Save Profile
                    </Button>
                </div>
            </SheetContent>
        </Sheet>
    )
}
