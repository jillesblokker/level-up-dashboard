"use client"

import { useState } from "react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { HelpCircle, LucideIcon } from "lucide-react"
import { renderSafeNode } from "@/lib/utils"

export interface GuideSection {
    title: string
    content: string | React.ReactNode
    icon: LucideIcon | React.ReactNode
}

interface PageGuideProps {
    title: string
    subtitle: string
    sections: GuideSection[]
}

export function PageGuide({ title, subtitle, sections }: PageGuideProps) {
    const [isOpen, setIsOpen] = useState(false)

    return (
        <>
            <Button
                variant="ghost"
                size="icon"
                className="bg-zinc-950 hover:bg-zinc-950 text-amber-200 border border-amber-500/20  rounded-full w-10 h-10 transition-all hover:scale-110 shadow-lg"
                onClick={() => setIsOpen(true)}
            >
                <HelpCircle className="h-6 w-6" />
                <span className="sr-only">{title} Guide</span>
            </Button>

            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="sm:max-w-[520px] bg-zinc-950 border-amber-800/60 text-amber-50 max-h-[85dvh] sm:max-h-[88dvh] flex flex-col overflow-hidden p-4 sm:p-6">
                    <DialogHeader className="shrink-0 pr-8">
                        <DialogTitle className="text-2xl font-bold text-amber-500 font-serif">{title} guide</DialogTitle>
                        <DialogDescription className="text-amber-200/80 italic text-xs sm:text-sm">
                            {subtitle}
                        </DialogDescription>
                    </DialogHeader>

                    <ScrollArea className="flex-1 min-h-0 overflow-y-auto pr-3 -mr-2 mt-2">
                        <div className="space-y-6 text-sm pb-6">
                            {sections.map((section, idx) => (
                                <section key={idx} className="space-y-3 p-4 rounded-xl bg-amber-950/20 border border-amber-800/20 hover:border-amber-800/40 transition-all">
                                    <div className="flex items-center gap-3 text-amber-400 font-bold">
                                        {renderSafeNode(section.icon, { className: "h-5 w-5" })}
                                        <h3 className="text-base tracking-tight">{section.title}</h3>
                                    </div>
                                    <div className="text-zinc-300 leading-relaxed pl-8">
                                        {section.content}
                                    </div>
                                </section>
                            ))}
                        </div>
                    </ScrollArea>

                    <div className="pt-3 border-t border-amber-900/40 shrink-0">
                        <Button
                            onClick={() => setIsOpen(false)}
                            className="w-full bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold h-10 rounded-xl shadow-md"
                        >
                            Got it
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    )
}
