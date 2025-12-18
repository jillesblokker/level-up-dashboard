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

export interface GuideSection {
    title: string
    content: string | React.ReactNode
    icon: LucideIcon
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
                className="bg-black/50 hover:bg-black/70 text-amber-200 border border-amber-500/20 backdrop-blur-sm rounded-full w-10 h-10 transition-all hover:scale-110 shadow-lg"
                onClick={() => setIsOpen(true)}
            >
                <HelpCircle className="h-6 w-6" />
                <span className="sr-only">{title} Guide</span>
            </Button>

            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="sm:max-w-[500px] bg-black/95 border-amber-800/50 text-amber-50 backdrop-blur-xl">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold text-amber-500 font-serif">{title} Guide</DialogTitle>
                        <DialogDescription className="text-amber-200/80 italic">
                            {subtitle}
                        </DialogDescription>
                    </DialogHeader>

                    <ScrollArea className="h-[60vh] pr-4 mt-4">
                        <div className="space-y-8 text-sm">
                            {sections.map((section, idx) => (
                                <section key={idx} className="space-y-3 p-4 rounded-xl bg-amber-950/20 border border-amber-800/10 hover:border-amber-800/30 transition-all">
                                    <div className="flex items-center gap-3 text-amber-400 font-bold">
                                        <section.icon className="h-5 w-5" />
                                        <h3 className="text-base tracking-tight">{section.title}</h3>
                                    </div>
                                    <div className="text-gray-300 leading-relaxed pl-8">
                                        {section.content}
                                    </div>
                                </section>
                            ))}
                        </div>
                    </ScrollArea>
                </DialogContent>
            </Dialog>
        </>
    )
}
