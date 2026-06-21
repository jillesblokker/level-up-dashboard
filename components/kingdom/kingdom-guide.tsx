"use client"

import { useState, useEffect } from "react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { HelpCircle, Construction, Coins, Map, User } from "lucide-react"

interface KingdomGuideProps {
    open?: boolean
    onOpenChange?: (open: boolean) => void
}

export function KingdomGuide({ open: controlledOpen, onOpenChange }: KingdomGuideProps) {
    const [isOpen, setIsOpen] = useState(false)

    useEffect(() => {
        if (controlledOpen !== undefined) {
            setIsOpen(controlledOpen)
        }
    }, [controlledOpen])

    const handleOpenChange = (open: boolean) => {
        setIsOpen(open)
        onOpenChange?.(open)
    }

    return (
        <>
            <Button
                variant="ghost"
                size="icon"
                className="bg-black/50 hover:bg-black/70 text-amber-200 border border-amber-500/20 backdrop-blur-sm rounded-full w-10 h-10 transition-all hover:scale-110"
                onClick={() => handleOpenChange(true)}
            >
                <HelpCircle className="h-6 w-6" />
                <span className="sr-only">Kingdom Guide</span>
            </Button>

            <Dialog open={isOpen} onOpenChange={handleOpenChange}>
                <DialogContent className="sm:max-w-[500px] bg-black border-amber-800 text-amber-50">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold text-amber-500 font-serif">Kingdom Guide</DialogTitle>
                        <DialogDescription className="text-amber-200/80">
                            Master the art of kingdom management
                        </DialogDescription>
                    </DialogHeader>

                    <ScrollArea className="h-[60vh] pr-4">
                        <div className="space-y-6 text-sm">
                            <section className="space-y-2">
                                <div className="flex items-center gap-2 text-amber-400 font-bold">
                                    <Map className="h-5 w-5" />
                                    <h3>Thrivehaven (Your Kingdom)</h3>
                                </div>
                                <p className="text-gray-300">
                                    This is your domain. Click on &quot;Vacant&quot; tiles to build new structures. Each building provides unique benefits and generates resources over time.
                                </p>
                            </section>

                            <section className="space-y-2">
                                <div className="flex items-center gap-2 text-amber-400 font-bold">
                                    <Construction className="h-5 w-5" />
                                    <h3>Building & Expansion</h3>
                                </div>
                                <p className="text-gray-300">
                                    To build, you need <strong>Build Tokens</strong> and sometimes Gold.
                                    Tokens are earned by completing real-life Quests and Challenges.
                                    Click on an existing building to view its details or collect rewards when ready.
                                </p>
                            </section>

                            <section className="space-y-2">
                                <div className="flex items-center gap-2 text-amber-400 font-bold">
                                    <Coins className="h-5 w-5" />
                                    <h3>Economy & Rewards</h3>
                                </div>
                                <p className="text-gray-300">
                                    Buildings generate Gold and XP (Experience) automatically.
                                    Visit regularly! When a building&apos;s timer completes, a reward icon will appear.
                                    Click the tile to collect your earnings.
                                </p>
                            </section>

                            <section className="space-y-2">
                                <div className="flex items-center gap-2 text-amber-400 font-bold">
                                    <User className="h-5 w-5" />
                                    <h3>Character & Inventory</h3>
                                </div>
                                <p className="text-gray-300">
                                    Your &quot;Journey&quot; tab shows your character&apos;s stats.
                                    The &quot;Bag&quot; holds your items. Equip weapons and armor to boost your stats (Movement, Attack, Defense), which will be important for future battles!
                                </p>
                            </section>
                        </div>
                    </ScrollArea>
                </DialogContent>
            </Dialog>
        </>
    )
}
