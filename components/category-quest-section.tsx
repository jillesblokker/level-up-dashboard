"use client"

import { type LucideIcon } from "lucide-react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"
import { QuestFormDialog, type QuestCategory } from "./quest-form-dialog"

// Quest item type
export interface QuestItem {
    id: string
    name: string
    icon: string
    category: QuestCategory
    completed: boolean
    rewards: {
        experience: number
        gold: number
    }
    frequency?: string
}

// Category styling configuration
const categoryStyles: Record<QuestCategory, string> = {
    might: 'border-red-800/20',
    knowledge: 'border-blue-800/20',
    honor: 'border-purple-800/20',
    castle: 'border-emerald-800/20',
    craft: 'border-orange-800/20',
    vitality: 'border-green-800/20'
}

const categoryIconColors: Record<QuestCategory, string> = {
    might: 'text-red-500',
    knowledge: 'text-blue-500',
    honor: 'text-purple-500',
    castle: 'text-emerald-500',
    craft: 'text-orange-500',
    vitality: 'text-green-500'
}

const categoryLabels: Record<QuestCategory, string> = {
    might: 'Might',
    knowledge: 'Knowledge',
    honor: 'Honor',
    castle: 'Castle',
    craft: 'Craft',
    vitality: 'Vitality'
}

interface CategoryQuestSectionProps {
    category: QuestCategory
    icon: LucideIcon
    quests: QuestItem[]
    onToggleQuest: (questId: string) => void
    // Form dialog props
    isDialogOpen: boolean
    currentDialogCategory: QuestCategory
    onDialogOpenChange: (open: boolean, category: QuestCategory) => void
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
    onAddQuest: () => void
}

export function CategoryQuestSection({
    category,
    icon: Icon,
    quests,
    onToggleQuest,
    isDialogOpen,
    currentDialogCategory,
    onDialogOpenChange,
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
    onAddQuest
}: CategoryQuestSectionProps) {
    const borderStyle = categoryStyles[category]
    const iconColor = categoryIconColors[category]
    const label = categoryLabels[category]

    return (
        <Card className={`border ${borderStyle} bg-black`}>
            <CardHeader className="pb-2">
                <div className="flex items-center space-x-2">
                    <Icon className={`h-5 w-5 ${iconColor}`} />
                    <h3 className="text-xl font-medievalsharp text-white">{label}</h3>
                </div>
            </CardHeader>
            <CardContent>
                {/* Mobile: horizontally scrollable row */}
                <div
                    className="flex gap-4 overflow-x-auto flex-nowrap md:hidden py-2 no-scrollbar"
                    style={{ WebkitOverflowScrolling: 'touch' }}
                >
                    {quests.map((quest) => (
                        <QuestCard
                            key={quest.id}
                            quest={quest}
                            onToggle={onToggleQuest}
                            isMobile
                        />
                    ))}
                </div>

                {/* Desktop/tablet: grid layout */}
                <div className="hidden md:grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                    {quests.map((quest) => (
                        <QuestCard
                            key={quest.id}
                            quest={quest}
                            onToggle={onToggleQuest}
                        />
                    ))}

                    <QuestFormDialog
                        category={category}
                        isOpen={isDialogOpen && currentDialogCategory === category}
                        onOpenChange={(open) => onDialogOpenChange(open, category)}
                        questName={questName}
                        onQuestNameChange={onQuestNameChange}
                        questIcon={questIcon}
                        onQuestIconChange={onQuestIconChange}
                        questFrequency={questFrequency}
                        onQuestFrequencyChange={onQuestFrequencyChange}
                        questExperience={questExperience}
                        onQuestExperienceChange={onQuestExperienceChange}
                        questGold={questGold}
                        onQuestGoldChange={onQuestGoldChange}
                        onSubmit={onAddQuest}
                    />
                </div>
            </CardContent>
        </Card>
    )
}

// Individual quest card component
interface QuestCardProps {
    quest: QuestItem
    onToggle: (questId: string) => void
    isMobile?: boolean
}

function QuestCard({ quest, onToggle, isMobile = false }: QuestCardProps) {
    const mobileClasses = isMobile
        ? "min-w-[180px] max-w-[220px] flex-shrink-0"
        : ""

    const checkboxClasses = isMobile
        ? "h-8 w-8 min-h-[44px] min-w-[44px]"
        : "h-5 w-5"

    return (
        <Card
            className={cn(
                "relative overflow-hidden border-amber-800/20 transition-all duration-200 flex items-center justify-between p-3 hover:bg-amber-950/20 cursor-pointer",
                quest.completed && "bg-amber-500/10",
                mobileClasses
            )}
            onClick={() => onToggle(quest.id)}
            onKeyDown={(e: React.KeyboardEvent) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    onToggle(quest.id)
                }
            }}
            tabIndex={0}
            role="button"
            aria-pressed={quest.completed}
            aria-label={`Toggle ${quest.name} quest completion`}
        >
            <div className="flex items-center space-x-3">
                <span className="text-xl" role="img" aria-label={quest.name}>
                    {quest.icon}
                </span>
                <span className="text-sm font-medium text-white">{quest.name}</span>
            </div>
            <Checkbox
                id={quest.id}
                checked={quest.completed}
                onCheckedChange={() => onToggle(quest.id)}
                onClick={(e) => e.stopPropagation()}
                className={cn(
                    "border-2 border-amber-500 data-[state=checked]:bg-amber-500 data-[state=checked]:text-white data-[state=checked]:border-amber-500",
                    checkboxClasses
                )}
                aria-label={`Mark ${quest.name} as ${quest.completed ? 'incomplete' : 'complete'}`}
            />
        </Card>
    )
}
