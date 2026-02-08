"use client"

import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export type QuestCategory = 'might' | 'knowledge' | 'honor' | 'castle' | 'craft' | 'vitality'

interface QuestFormDialogProps {
    category: QuestCategory
    isOpen: boolean
    onOpenChange: (open: boolean) => void
    questName: string
    onQuestNameChange: (name: string) => void
    questIcon: string
    onQuestIconChange: (icon: string) => void
    questFrequency: string
    onQuestFrequencyChange: (frequency: string) => void
    questExperience: number
    onQuestExperienceChange: (xp: number) => void
    questGold: number
    onQuestGoldChange: (gold: number) => void
    onSubmit: () => void
}

// Category-specific configuration
const categoryConfig: Record<QuestCategory, {
    color: string
    bgColor: string
    borderColor: string
    focusColor: string
    title: string
    subtitle: string
    scrollName: string
    placeholder: string
    iconPlaceholder: string
}> = {
    might: {
        color: 'text-red-500',
        bgColor: 'bg-red-500/10',
        borderColor: 'border-red-500/20',
        focusColor: 'focus:border-red-500/50',
        title: 'Draft Might Quest',
        subtitle: 'A challenge of strength and physical endurance.',
        scrollName: "Warrior's Scroll",
        placeholder: 'e.g., Slay the giant (300 pushups)...',
        iconPlaceholder: '🏋️'
    },
    knowledge: {
        color: 'text-blue-500',
        bgColor: 'bg-blue-500/10',
        borderColor: 'border-blue-500/20',
        focusColor: 'focus:border-blue-500/50',
        title: 'Draft Knowledge Quest',
        subtitle: 'Record a new pursuit of wisdom and intellect.',
        scrollName: "Scholar's Ledger",
        placeholder: 'e.g., Decipher the ancient scripts (30m reading)...',
        iconPlaceholder: '📚'
    },
    honor: {
        color: 'text-purple-500',
        bgColor: 'bg-purple-500/10',
        borderColor: 'border-purple-500/20',
        focusColor: 'focus:border-purple-500/50',
        title: 'Draft Honor Quest',
        subtitle: 'A new deed of discipline and integrity for your character.',
        scrollName: "Knight's Code",
        placeholder: 'e.g., Hold the line (Wake up before 7am)...',
        iconPlaceholder: '🛡️'
    },
    castle: {
        color: 'text-emerald-500',
        bgColor: 'bg-emerald-500/10',
        borderColor: 'border-emerald-500/20',
        focusColor: 'focus:border-emerald-500/50',
        title: 'Draft Castle Quest',
        subtitle: 'A task to maintain and improve your domain.',
        scrollName: "Steward's Decree",
        placeholder: 'e.g., Clean the great hall (vacuum living room)...',
        iconPlaceholder: '🏰'
    },
    craft: {
        color: 'text-orange-500',
        bgColor: 'bg-orange-500/10',
        borderColor: 'border-orange-500/20',
        focusColor: 'focus:border-orange-500/50',
        title: 'Draft Craft Quest',
        subtitle: 'A creative endeavor to hone your artistic skills.',
        scrollName: "Artisan's Parchment",
        placeholder: 'e.g., Forge a masterpiece (30m drawing)...',
        iconPlaceholder: '🎨'
    },
    vitality: {
        color: 'text-green-500',
        bgColor: 'bg-green-500/10',
        borderColor: 'border-green-500/20',
        focusColor: 'focus:border-green-500/50',
        title: 'Draft Vitality Quest',
        subtitle: 'A practice to nurture your health and wellbeing.',
        scrollName: "Healer's Journal",
        placeholder: 'e.g., Restore your spirit (meditation)...',
        iconPlaceholder: '💚'
    }
}

// Button color mapping for submit buttons
const buttonColors: Record<QuestCategory, string> = {
    might: 'bg-red-600 hover:bg-red-500',
    knowledge: 'bg-blue-600 hover:bg-blue-500',
    honor: 'bg-purple-600 hover:bg-purple-500',
    castle: 'bg-emerald-600 hover:bg-emerald-500',
    craft: 'bg-orange-600 hover:bg-orange-500',
    vitality: 'bg-green-600 hover:bg-green-500'
}

export function QuestFormDialog({
    category,
    isOpen,
    onOpenChange,
    questName,
    onQuestNameChange,
    questIcon,
    onQuestIconChange,
    questFrequency,
    onQuestFrequencyChange,
    questExperience,
    onQuestExperienceChange,
    questGold,
    onQuestGoldChange,
    onSubmit
}: QuestFormDialogProps) {
    const config = categoryConfig[category]
    const buttonColor = buttonColors[category]

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogTrigger asChild>
                <Button variant="outline" className="border-dashed border-gray-700 justify-start h-auto py-2 px-3">
                    <Plus className="h-4 w-4 mr-2" />
                    <span>Add {category.charAt(0).toUpperCase() + category.slice(1)} Quest</span>
                </Button>
            </DialogTrigger>
            <DialogContent
                className="sm:max-w-md max-h-[90vh] bg-zinc-950 border-zinc-800 text-zinc-100 p-0 overflow-hidden flex flex-col shadow-2xl"
                role="dialog"
                aria-label={`${category}-quest-form-dialog`}
            >
                {/* Background Effects */}
                <div className="absolute inset-0 pointer-events-none">
                    <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 ${config.bgColor} rounded-full blur-[100px] animate-pulse`} />
                </div>

                <div className="relative z-10 flex-1 overflow-y-auto p-6 scrollbar-hide">
                    <DialogHeader className="text-center items-center pb-6">
                        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${config.bgColor} ${config.borderColor} border text-[10px] font-bold uppercase tracking-widest mb-4 ${config.color} shadow-sm`}>
                            <Plus className="w-3 h-3" />
                            {config.scrollName}
                        </div>
                        <DialogTitle className="text-3xl font-serif text-white tracking-tight">
                            {config.title}
                        </DialogTitle>
                        <DialogDescription className="text-zinc-500 mt-2">
                            {config.subtitle}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-6 py-2">
                        <div className="space-y-2">
                            <Label htmlFor={`quest-name-${category}`} className="text-xs font-bold uppercase tracking-widest text-zinc-500 ml-1">
                                Quest Title
                            </Label>
                            <Input
                                id={`quest-name-${category}`}
                                value={questName}
                                onChange={(e) => onQuestNameChange(e.target.value)}
                                placeholder={config.placeholder}
                                className={`bg-zinc-900/60 border-white/5 ${config.focusColor} h-12 rounded-xl px-4 text-zinc-200 placeholder:text-zinc-600 transition-all`}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor={`quest-icon-${category}`} className="text-xs font-bold uppercase tracking-widest text-zinc-500 ml-1">
                                    Icon (Emoji)
                                </Label>
                                <Input
                                    id={`quest-icon-${category}`}
                                    value={questIcon}
                                    onChange={(e) => onQuestIconChange(e.target.value)}
                                    className={`bg-zinc-900/60 border-white/5 ${config.focusColor} h-12 rounded-xl px-4 text-zinc-200`}
                                    placeholder={config.iconPlaceholder}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor={`quest-frequency-${category}`} className="text-xs font-bold uppercase tracking-widest text-zinc-500 ml-1">
                                    Frequency
                                </Label>
                                <Input
                                    id={`quest-frequency-${category}`}
                                    value={questFrequency}
                                    onChange={(e) => onQuestFrequencyChange(e.target.value)}
                                    className={`bg-zinc-900/60 border-white/5 ${config.focusColor} h-12 rounded-xl px-4 text-zinc-200`}
                                    placeholder="Daily"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor={`quest-experience-${category}`} className="text-xs font-bold uppercase tracking-widest text-zinc-500 ml-1">
                                    XP Reward
                                </Label>
                                <Input
                                    id={`quest-experience-${category}`}
                                    type="number"
                                    value={questExperience}
                                    onChange={(e) => onQuestExperienceChange(Number(e.target.value))}
                                    className={`bg-zinc-900/60 border-white/5 ${config.focusColor} h-12 rounded-xl px-4 text-zinc-200`}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor={`quest-gold-${category}`} className="text-xs font-bold uppercase tracking-widest text-zinc-500 ml-1">
                                    Gold Reward
                                </Label>
                                <Input
                                    id={`quest-gold-${category}`}
                                    type="number"
                                    value={questGold}
                                    onChange={(e) => onQuestGoldChange(Number(e.target.value))}
                                    className={`bg-zinc-900/60 border-white/5 ${config.focusColor} h-12 rounded-xl px-4 text-zinc-200`}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-4 bg-zinc-950 border-t border-white/5 flex flex-row gap-3">
                    <Button
                        variant="ghost"
                        onClick={() => onOpenChange(false)}
                        className="flex-1 h-12 rounded-xl text-zinc-500 hover:text-zinc-200"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={onSubmit}
                        className={`flex-[2] h-12 ${buttonColor} text-white font-bold rounded-xl shadow-lg border-t border-white/10`}
                        aria-label="Add new quest"
                    >
                        Enshrine Quest
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
