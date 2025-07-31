"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { CheckCircle, Clock, Star, Target, Trophy, Zap, Heart, Shield, BookOpen, Sword, Play, Pencil, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { useState } from "react"

interface QuestCardProps {
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
  showEditDelete?: boolean
}

const difficultyConfig = {
  easy: { color: 'bg-green-500', icon: Target, label: 'Easy' },
  medium: { color: 'bg-yellow-500', icon: Shield, label: 'Medium' },
  hard: { color: 'bg-orange-500', icon: Sword, label: 'Hard' },
  epic: { color: 'bg-purple-500', icon: Trophy, label: 'Epic' }
}

const categoryConfig = {
  'physical': { icon: Heart, color: 'text-red-400' },
  'mental': { icon: BookOpen, color: 'text-blue-400' },
  'social': { icon: Star, color: 'text-yellow-400' },
  'creative': { icon: Zap, color: 'text-purple-400' },
  'productivity': { icon: Target, color: 'text-green-400' }
}

export default function QuestCard({
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
  showEditDelete = false
}: QuestCardProps) {
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
        "bg-gradient-to-br from-gray-900/90 to-gray-800/90 border border-amber-800/20",
        "hover:border-amber-500/40 hover:shadow-lg hover:shadow-amber-500/20",
        "transform hover:-translate-y-1",
        isFeatured && "ring-2 ring-amber-500/50",
        isNew && "ring-2 ring-green-500/50",
        status === 'completed' && "opacity-75"
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
      
      {/* Interactive Checkbox */}
      <div 
        className="absolute top-3 right-3 z-10 cursor-pointer"
        onClick={(e) => {
          e.stopPropagation();
          onComplete?.();
        }}
        aria-label={`Toggle quest completion: ${title}`}
      >
        <div className={cn(
          "w-6 h-6 rounded border-2 flex items-center justify-center transition-all duration-200",
          "hover:scale-110 hover:shadow-lg",
          status === 'completed' 
            ? "bg-green-500 border-green-500 text-white" 
            : "bg-transparent border-gray-400 text-transparent hover:border-amber-400"
        )}>
          {status === 'completed' ? (
            <CheckCircle className="h-4 w-4" />
          ) : (
            <div className="w-3 h-3 rounded border border-gray-400" />
          )}
        </div>
      </div>

      {/* Edit and Delete Buttons */}
      {showEditDelete && (
        <div className="absolute top-3 right-12 z-10 flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-gray-500 hover:text-amber-500 bg-black/50 hover:bg-black/70 rounded-full"
            aria-label={`Edit quest: ${title}`}
            onClick={(e) => {
              e.stopPropagation();
              onEdit?.();
            }}
            tabIndex={-1}
          >
            <Pencil className="w-3 h-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-red-500 hover:text-red-400 bg-black/50 hover:bg-black/70 rounded-full"
            aria-label={`Delete quest: ${title}`}
            onClick={(e) => {
              e.stopPropagation();
              onDelete?.();
            }}
            tabIndex={-1}
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      )}

      {/* Featured/New Badge */}
      {(isFeatured || isNew) && (
        <div className="absolute top-3 left-3 z-10">
          <Badge 
            className={cn(
              "text-xs font-bold px-2 py-1",
              isFeatured ? "bg-amber-500 text-black" : "bg-amber-500 text-black"
            )}
          >
            {isFeatured ? "Featured" : "New"}
          </Badge>
        </div>
      )}

      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-xl font-semibold text-white line-clamp-2 group-hover:text-amber-400 transition-colors duration-300">
              {title}
            </CardTitle>
            <CardDescription className="text-sm text-gray-400 line-clamp-2 mt-1">
              {description}
            </CardDescription>
          </div>
        </div>

        {/* Tags */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {tags.slice(0, 3).map((tag, index) => (
              <Badge 
                key={index}
                variant="secondary" 
                className="text-xs px-2 py-0.5 bg-gray-800/50 text-gray-300 border border-gray-700/50"
              >
                {tag}
              </Badge>
            ))}
            {tags.length > 3 && (
              <Badge variant="secondary" className="text-xs px-2 py-0.5 bg-gray-800/50 text-gray-400">
                +{tags.length - 3}
              </Badge>
            )}
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Progress Section */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-400">Progress</span>
            <span className="text-amber-400 font-semibold">
              {progress} / {maxProgress}
            </span>
          </div>
          <Progress 
            value={progressPercentage} 
            className="h-2 bg-gray-700"
          />
        </div>

        {/* Difficulty and Time */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={cn(
              "flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium",
              "bg-gray-800/50 border border-gray-700/50"
            )}>
              <DifficultyIcon className="h-3 w-3" />
              <span className={cn(
                difficulty === 'easy' && 'text-green-400',
                difficulty === 'medium' && 'text-yellow-400',
                difficulty === 'hard' && 'text-orange-400',
                difficulty === 'epic' && 'text-purple-400'
              )}>
                {difficultyInfo.label}
              </span>
            </div>
          </div>
          
          {timeRemaining && (
            <div className="flex items-center gap-1 text-xs text-gray-400">
              <Clock className="h-3 w-3" />
              <span>{timeRemaining}</span>
            </div>
          )}
        </div>

        {/* Rewards */}
        <div className="space-y-2">
          <div className="text-sm text-gray-400">Rewards</div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 text-amber-400">
              <Star className="h-4 w-4" />
              <span className="text-sm font-semibold">{reward.experience} XP</span>
            </div>
            <div className="flex items-center gap-1 text-yellow-400">
              <Trophy className="h-4 w-4" />
              <span className="text-sm font-semibold">{reward.gold} Gold</span>
            </div>
            {reward.items && reward.items.length > 0 && (
              <div className="flex items-center gap-1 text-purple-400">
                <Zap className="h-4 w-4" />
                <span className="text-sm font-semibold">{reward.items.length} Items</span>
              </div>
            )}
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-2">
          <Button
            className={cn(
              "w-full transition-all duration-300",
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
            disabled={status === 'completed'}
            aria-label={status === 'completed' ? 'Quest completed' : status === 'in-progress' ? 'Continue quest' : 'Start quest'}
          >
            {status === 'completed' && <CheckCircle className="h-4 w-4 mr-2" />}
            {status === 'in-progress' && <Target className="h-4 w-4 mr-2" />}
            {status === 'not-started' && <Play className="h-4 w-4 mr-2" />}
            {status === 'completed' ? 'Completed' : status === 'in-progress' ? 'Continue' : 'Start Quest'}
          </Button>
        </div>
      </CardContent>

      {/* Hover Effects */}
      {isHovered && (
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-transparent pointer-events-none" />
      )}
    </Card>
  )
}