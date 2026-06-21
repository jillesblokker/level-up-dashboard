"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CheckCircle, Clock, Star, Target, Trophy, Zap, Heart, Shield, BookOpen, Sword, Play, Pencil, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { useState } from "react"
import { MarkdownRenderer } from "@/components/ui/markdown-renderer"

interface MobileQuestCardProps {
  title: string
  description: string
  category: string
  difficulty: 'easy' | 'medium' | 'hard' | 'epic'
  progress: number
  maxProgress: number
  reward: {
    experience: number
    gold: number
    items?: string[]
  }
  status: 'not-started' | 'in-progress' | 'completed'
  timeRemaining?: string
  isNew?: boolean
  isFeatured?: boolean
  tags?: string[]
  onClick?: () => void
  onComplete?: () => void
  onEdit?: () => void
  onDelete?: () => void
  onFavorite?: () => void
  showEditDelete?: boolean
  isFavorited?: boolean
}

const difficultyConfig = {
  easy: { color: 'bg-amber-500', icon: Target, label: 'Easy' },
  medium: { color: 'bg-gray-500', icon: Shield, label: 'Medium' },
  hard: { color: 'bg-amber-600', icon: Sword, label: 'Hard' },
  epic: { color: 'bg-amber-700', icon: Trophy, label: 'Epic' }
}

const categoryConfig = {
  'physical': { icon: Heart, color: 'text-amber-400' },
  'mental': { icon: BookOpen, color: 'text-gray-400' },
  'social': { icon: Star, color: 'text-amber-500' },
  'creative': { icon: Zap, color: 'text-amber-400' },
  'productivity': { icon: Target, color: 'text-amber-400' },
  'might': { icon: Sword, color: 'text-red-400' },
  'honor': { icon: Shield, color: 'text-blue-400' },
  'knowledge': { icon: BookOpen, color: 'text-purple-400' },
  'craft': { icon: Pencil, color: 'text-green-400' },
  'exploration': { icon: Play, color: 'text-yellow-400' }
}

export default function MobileQuestCard({
  title,
  description,
  category,
  difficulty,
  progress,
  maxProgress,
  reward,
  status,
  timeRemaining,
  isNew = false,
  isFeatured = false,
  tags = [],
  onClick,
  onComplete,
  onEdit,
  onDelete,
  onFavorite,
  showEditDelete = false,
  isFavorited = false
}: MobileQuestCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [isPressed, setIsPressed] = useState(false)

  const difficultyInfo = difficultyConfig[difficulty]
  const categoryInfo = categoryConfig[category as keyof typeof categoryConfig] || { icon: Target, color: 'text-gray-400' }
  const CategoryIcon = categoryInfo.icon
  const DifficultyIcon = difficultyInfo.icon

  const progressPercentage = (progress / maxProgress) * 100

  return (
    <Card
      className={cn(
        "relative overflow-hidden transition-all duration-300 cursor-pointer group",
        "bg-black border border-amber-800/20",
        "hover:border-amber-500/40 hover:shadow-lg hover:shadow-amber-500/20",
        "transform hover:-translate-y-1 hover:scale-[1.02]",
        isFeatured && "ring-2 ring-amber-500/50",
        isNew && "ring-2 ring-green-500/50",
        status === 'completed' && "opacity-75",
        // Enhanced mobile touch handling
        "touch-manipulation",
        "min-h-[120px]", // Minimum height for mobile
        "active:scale-95" // Touch feedback
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onClick={onClick}
      aria-label={`Quest card: ${title}`}
    >
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      {/* Interactive Checkbox - Mobile Optimized */}
      <div className="absolute top-3 right-3 z-10">
        <button
          className={cn(
            "w-8 h-8 rounded-full border-2 transition-all duration-200",
            "flex items-center justify-center",
            "hover:scale-110 hover:shadow-lg",
            status === 'completed'
              ? "bg-green-500 border-green-500 text-white"
              : "bg-transparent border-gray-400 text-transparent hover:border-amber-400",
            // Enhanced mobile touch target
            "min-w-[44px] min-h-[44px]",
            "touch-manipulation"
          )}
          onClick={(e) => {
            e.stopPropagation()
            onComplete?.()
          }}
          aria-label={status === 'completed' ? 'Mark as incomplete' : 'Mark as complete'}
        >
          {status === 'completed' && <CheckCircle className="w-5 h-5" />}
        </button>
      </div>

      {/* Favorite Button - Mobile Optimized */}
      {onFavorite && (
        <div className="absolute top-3 left-3 z-10">
          <button
            className={cn(
              "w-8 h-8 rounded-full transition-all duration-200",
              "flex items-center justify-center",
              "hover:scale-110 hover:shadow-lg",
              isFavorited
                ? "bg-amber-500 text-white"
                : "bg-gray-800/50 text-gray-400 hover:bg-amber-500/20",
              // Enhanced mobile touch target
              "min-w-[44px] min-h-[44px]",
              "touch-manipulation"
            )}
            onClick={(e) => {
              e.stopPropagation()
              onFavorite()
            }}
            aria-label={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
          >
            <Star className={cn("w-4 h-4", isFavorited && "fill-current")} />
          </button>
        </div>
      )}

      {/* Featured/New Badge */}
      {(isFeatured || isNew) && (
        <div className="absolute top-3 left-3 z-10">
          <Badge
            className={cn(
              "text-xs font-bold px-2 py-1",
              isFeatured ? "bg-amber-500 text-white" : "bg-amber-500 text-white"
            )}
          >
            {isFeatured ? "Featured" : "New"}
          </Badge>
        </div>
      )}

      <CardContent className="p-4 pt-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-white text-lg leading-tight mb-1 truncate">
              {title}
            </h3>
            <div className="text-gray-300 text-sm leading-relaxed h-[2.5em] overflow-hidden relative">
              <MarkdownRenderer content={description} />
              <div className="absolute bottom-0 left-0 right-0 h-3 bg-gradient-to-t from-black to-transparent" />
            </div>
          </div>
        </div>

        {/* Category and Difficulty */}
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <div className="flex items-center gap-1">
            <CategoryIcon className={cn("w-4 h-4", categoryInfo.color)} />
            <span className="text-xs text-gray-400 capitalize">{category}</span>
          </div>
          <div className="flex items-center gap-1">
            <DifficultyIcon className="w-4 h-4 text-gray-400" />
            <span className="text-xs text-gray-400">{difficultyInfo.label}</span>
          </div>
        </div>

        {/* Progress Bar - Mobile Optimized */}
        <div className="mb-3">
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs text-gray-400">Progress</span>
            <span className="text-xs text-gray-400">{progress}/{maxProgress}</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div
              className={cn(
                "h-2 rounded-full transition-all duration-500",
                status === 'completed'
                  ? "bg-green-500"
                  : status === 'in-progress'
                    ? "bg-amber-500"
                    : "bg-gray-600"
              )}
              style={{ width: `${Math.min(progressPercentage, 100)}%` }}
            />
          </div>
        </div>

        {/* Rewards - Mobile Optimized */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 bg-yellow-500 rounded-full flex items-center justify-center">
                <span className="text-xs font-bold text-black">G</span>
              </div>
              <span className="text-sm text-white font-medium">{reward.gold}</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-xs font-bold text-white">XP</span>
              </div>
              <span className="text-sm text-white font-medium">{reward.experience}</span>
            </div>
          </div>

          {/* Status Badge */}
          <Badge
            className={cn(
              "text-xs font-semibold",
              status === 'completed' && "bg-green-600 text-white",
              status === 'in-progress' && "bg-amber-600 text-white"
            )}
          >
            {status === 'completed' ? 'Completed' : status === 'in-progress' ? 'In Progress' : 'Not Started'}
          </Badge>
        </div>

        {/* Time Remaining */}
        {timeRemaining && (
          <div className="flex items-center gap-1 mb-3">
            <Clock className="w-4 h-4 text-gray-400" />
            <span className="text-xs text-gray-400">{timeRemaining}</span>
          </div>
        )}

        {/* Action Buttons - Mobile Optimized */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "flex-1 transition-all duration-300",
              status === 'completed'
                ? "bg-green-600 hover:bg-green-700 text-white"
                : status === 'in-progress'
                  ? "bg-amber-600 hover:bg-amber-700 text-white"
                  : "bg-gray-700 hover:bg-gray-600 text-white"
            )}
            onClick={(e) => {
              e.stopPropagation()
              onComplete?.()
            }}
          >
            {status === 'completed' ? 'Undo' : 'Complete'}
          </Button>

          {showEditDelete && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  onEdit?.()
                }}
                className="min-w-[44px] min-h-[44px] touch-manipulation"
                aria-label="Edit quest"
              >
                <Pencil className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete?.()
                }}
                className="min-w-[44px] min-h-[44px] touch-manipulation text-red-400 hover:text-red-300"
                aria-label="Delete quest"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
