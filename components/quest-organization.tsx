"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Search, Filter, Star, Trophy, Target, TrendingUp, CheckCircle, Pencil, Trash2 } from 'lucide-react'
import { QuestToggleButton } from '@/components/quest-toggle-button'

interface Quest {
  id: string
  name: string
  title?: string
  description: string
  category: string
  difficulty: string
  xp?: number
  gold?: number
  completed: boolean
  favorited?: boolean
  date?: Date
  isNew: boolean
  completionId?: string
}

interface QuestOrganizationProps {
  quests: Quest[]
  onQuestToggle: (questId: string, completed: boolean) => void
  onQuestFavorite: (questId: string) => void
  onQuestEdit: (quest: Quest) => void
  onQuestDelete: (questId: string) => void
  onAddQuest: () => void
  showCategoryFilter?: boolean
  context?: 'quests' | 'challenges' | 'milestones'
}

const categoryConfig = {
  might: {
    name: 'Might',
    icon: '⚔️',
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-800/30',
    description: 'Physical strength and combat'
  },
  knowledge: {
    name: 'Knowledge',
    icon: '📚',
    color: 'text-gray-400',
    bgColor: 'bg-gray-500/10',
    borderColor: 'border-gray-800/30',
    description: 'Learning and wisdom'
  },
  honor: {
    name: 'Honor',
    icon: '👑',
    color: 'text-amber-500',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-800/30',
    description: 'Nobility and leadership'
  },
  castle: {
    name: 'Castle',
    icon: '🏰',
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-800/30',
    description: 'Kingdom management'
  },
  craft: {
    name: 'Craft',
    icon: '⚒️',
    color: 'text-gray-400',
    bgColor: 'bg-gray-500/10',
    borderColor: 'border-gray-800/30',
    description: 'Skill and craftsmanship'
  },
  vitality: {
    name: 'Vitality',
    icon: '❤️',
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-800/30',
    description: 'Health and wellness'
  },
  wellness: {
    name: 'Wellness',
    icon: '☀️',
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-800/30',
    description: 'Mental and spiritual health'
  },
  exploration: {
    name: 'Exploration',
    icon: '🗺️',
    color: 'text-gray-400',
    bgColor: 'bg-gray-500/10',
    borderColor: 'border-gray-800/30',
    description: 'Discovery and adventure'
  },
  // Workout categories for challenges
  'Push/Legs/Core': {
    name: 'Push/Legs/Core',
    icon: '💪',
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-800/30',
    description: 'Push exercises, legs, and core training'
  },
  'Pull/Shoulder/Core': {
    name: 'Pull/Shoulder/Core',
    icon: '🏋️',
    color: 'text-green-400',
    bgColor: 'bg-green-500/10',
    borderColor: 'border-green-800/30',
    description: 'Pull exercises, shoulders, and core training'
  },
  'Core & Flexibility': {
    name: 'Core & Flexibility',
    icon: '🧘',
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-800/30',
    description: 'Core strength and flexibility training'
  },
  'HIIT & Full Body': {
    name: 'HIIT & Full Body',
    icon: '⚡',
    color: 'text-red-400',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-800/30',
    description: 'High-intensity interval training and full body workouts'
  }
}

const difficultyConfig = {
  easy: { name: 'Easy', color: 'text-amber-400', bgColor: 'bg-amber-500/10' },
  medium: { name: 'Medium', color: 'text-gray-400', bgColor: 'bg-gray-500/10' },
  hard: { name: 'Hard', color: 'text-amber-500', bgColor: 'bg-amber-500/10' },
  epic: { name: 'Epic', color: 'text-amber-600', bgColor: 'bg-amber-500/10' }
}

export function QuestOrganization({ 
  quests, 
  onQuestToggle, 
  onQuestFavorite, 
  onQuestEdit, 
  onQuestDelete, 
  onAddQuest,
  showCategoryFilter = true,
  context = 'quests'
}: QuestOrganizationProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'name' | 'reward' | 'difficulty'>('name')

  // Context-based labels
  const labels = {
    quests: {
      title: 'Quest Overview',
      subtitle: 'Track your quest progress and rewards',
      categories: 'Quest Categories',
      categoriesSubtitle: 'Progress by quest type',
      filters: 'Quest Filters',
      searchPlaceholder: 'Search quests...',
      addButton: 'Add Quest',
      noItems: 'No quests found',
      noItemsSubtitle: 'Try adjusting your filters or add a new quest',
      showing: 'quests'
    },
    challenges: {
      title: 'Challenge Overview',
      subtitle: 'Track your challenge progress and rewards',
      categories: 'Challenge Categories',
      categoriesSubtitle: 'Progress by challenge type',
      filters: 'Challenge Filters',
      searchPlaceholder: 'Search challenges...',
      addButton: 'Add Challenge',
      noItems: 'No challenges found',
      noItemsSubtitle: 'Try adjusting your filters or add a new challenge',
      showing: 'challenges'
    },
    milestones: {
      title: 'Milestone Overview',
      subtitle: 'Track your milestone progress and rewards',
      categories: 'Milestone Categories',
      categoriesSubtitle: 'Progress by milestone type',
      filters: 'Milestone Filters',
      searchPlaceholder: 'Search milestones...',
      addButton: 'Add Milestone',
      noItems: 'No milestones found',
      noItemsSubtitle: 'Try adjusting your filters or add a new milestone',
      showing: 'milestones'
    }
  }

  const currentLabels = labels[context]

  // Get appropriate categories based on context
  const getAvailableCategories = () => {
    if (context === 'challenges') {
      return [
        'Push/Legs/Core',
        'Pull/Shoulder/Core', 
        'Core & Flexibility',
        'HIIT & Full Body'
      ];
    }
    if (context === 'quests') {
      return [
        'might',
        'knowledge',
        'honor',
        'castle',
        'craft',
        'vitality',
        'wellness',
        'exploration'
      ];
    }
    return Object.keys(categoryConfig);
  };

  // Set default selected category based on context
  useEffect(() => {
    if (context === 'challenges') {
      setSelectedCategory('Push/Legs/Core');
    } else if (context === 'quests') {
      setSelectedCategory('might');
    } else {
      setSelectedCategory('all');
    }
  }, [context]);

  // Filter and sort quests
  const filteredQuests = quests.filter(quest => {
    const matchesCategory = selectedCategory === 'all' || quest.category === selectedCategory
    const matchesDifficulty = selectedDifficulty === 'all' || quest.difficulty === selectedDifficulty
    const matchesStatus = selectedStatus === 'all' || 
      (selectedStatus === 'completed' && quest.completed) ||
      (selectedStatus === 'active' && !quest.completed)
    const matchesSearch = quest.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         quest.description.toLowerCase().includes(searchQuery.toLowerCase())
    
    return matchesCategory && matchesDifficulty && matchesStatus && matchesSearch
  })

  // Sort quests
  const sortedQuests = [...filteredQuests].sort((a, b) => {
    switch (sortBy) {
      case 'reward':
        return ((b.gold || 0) + (b.xp || 0)) - ((a.gold || 0) + (a.xp || 0))
      case 'difficulty':
        const difficultyOrder = { easy: 1, medium: 2, hard: 3, epic: 4 }
        return (difficultyOrder[a.difficulty as keyof typeof difficultyOrder] || 0) - 
               (difficultyOrder[b.difficulty as keyof typeof difficultyOrder] || 0)
      default:
        return a.name.localeCompare(b.name)
    }
  })

  // Calculate statistics
  const stats = {
    total: quests.length,
    completed: quests.filter(q => q.completed).length,
    active: quests.filter(q => !q.completed).length,
    favorited: quests.filter(q => q.favorited).length,
    totalReward: quests.reduce((sum, q) => sum + (q.gold || 0) + (q.xp || 0), 0)
  }

  const getCategoryStats = (category: string) => {
    const categoryQuests = quests.filter(q => q.category === category)
    return {
      total: categoryQuests.length,
      completed: categoryQuests.filter(q => q.completed).length,
      totalReward: categoryQuests.reduce((sum, q) => sum + (q.gold || 0) + (q.xp || 0), 0)
    }
  }

  return (
    <div className="space-y-6">
      {/* Quest Statistics */}
      <Card className="border-amber-800/20 bg-gradient-to-br from-gray-900 to-gray-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-amber-400">
            <TrendingUp className="h-5 w-5" />
            {currentLabels.title}
          </CardTitle>
          <CardDescription className="text-gray-300">
            {currentLabels.subtitle}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="text-center p-4 bg-gray-800/50 rounded-lg">
              <div className="text-2xl font-bold text-white">{stats.total}</div>
              <div className="text-sm text-gray-400">Total Quests</div>
            </div>
            <div className="text-center p-4 bg-green-800/50 rounded-lg">
              <div className="text-2xl font-bold text-green-400">{stats.completed}</div>
              <div className="text-sm text-gray-400">Completed</div>
            </div>
            <div className="text-center p-4 bg-amber-800/50 rounded-lg">
              <div className="text-2xl font-bold text-amber-400">{stats.active}</div>
              <div className="text-sm text-gray-400">Active</div>
            </div>
            <div className="text-center p-4 bg-purple-800/50 rounded-lg">
              <div className="text-2xl font-bold text-purple-400">{stats.totalReward}</div>
              <div className="text-sm text-gray-400">Total Reward</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Category Overview */}
      <Card className="border-amber-800/20 bg-gradient-to-br from-gray-900 to-gray-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-amber-400">
            <Target className="h-5 w-5" />
            {currentLabels.categories}
          </CardTitle>
          <CardDescription className="text-gray-300">
            {currentLabels.categoriesSubtitle}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {getAvailableCategories().map(key => {
              const config = categoryConfig[key as keyof typeof categoryConfig];
              const stats = getCategoryStats(key)
              const progress = stats.total > 0 ? (stats.completed / stats.total) * 100 : 0
              
              return (
                <Card key={key} className={`border ${config.borderColor} ${config.bgColor} hover:shadow-lg transition-all duration-300`}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-2xl">{config.icon}</span>
                      <div>
                        <h3 className={`font-semibold ${config.color}`}>{config.name}</h3>
                        <p className="text-xs text-gray-400">{config.description}</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-300">Progress</span>
                        <span className={`font-semibold ${config.color}`}>
                          {stats.completed}/{stats.total}
                        </span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${config.color.replace('text-', 'bg-')}`}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <div className="text-xs text-gray-400">
                        {stats.totalReward} total reward
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Filters and Search */}
      <Card className="border-amber-800/20 bg-gradient-to-br from-gray-900 to-gray-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-amber-400">
            <Filter className="h-5 w-5" />
            {currentLabels.filters}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder={currentLabels.searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-gray-800 border-gray-700 text-white"
            />
          </div>

          {/* Filters */}
          <div className={`grid gap-4 ${showCategoryFilter ? 'md:grid-cols-4' : 'md:grid-cols-3'}`}>
            {showCategoryFilter && (
              <div>
                <label className="text-sm text-gray-300 mb-2 block">Category</label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="bg-gray-800 border-gray-700">
                    <SelectValue placeholder="All categories" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-900 border-gray-700">
                    <SelectItem value="all">All Categories</SelectItem>
                    {getAvailableCategories().map(key => (
                      <SelectItem key={key} value={key}>
                        <div className="flex items-center gap-2">
                          <span>{categoryConfig[key as keyof typeof categoryConfig]?.icon || '📋'}</span>
                          <span>{categoryConfig[key as keyof typeof categoryConfig]?.name || key}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <label className="text-sm text-gray-300 mb-2 block">Difficulty</label>
              <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
                <SelectTrigger className="bg-gray-800 border-gray-700">
                  <SelectValue placeholder="All difficulties" />
                </SelectTrigger>
                <SelectContent className="bg-gray-900 border-gray-700">
                  <SelectItem value="all">All Difficulties</SelectItem>
                  {Object.entries(difficultyConfig).map(([key, config]) => (
                    <SelectItem key={key} value={key}>
                      {config.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm text-gray-300 mb-2 block">Status</label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="bg-gray-800 border-gray-700">
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent className="bg-gray-900 border-gray-700">
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm text-gray-300 mb-2 block">Sort By</label>
              <Select value={sortBy} onValueChange={(value) => setSortBy(value as 'name' | 'reward' | 'difficulty')}>
                <SelectTrigger className="bg-gray-800 border-gray-700">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent className="bg-gray-900 border-gray-700">
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="reward">Reward</SelectItem>
                  <SelectItem value="difficulty">Difficulty</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Results Summary */}
          <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
            <span className="text-sm text-gray-300">
              Showing {sortedQuests.length} of {quests.length} {currentLabels.showing}
            </span>
            <Button
              onClick={onAddQuest}
              className="bg-amber-500 hover:bg-amber-600 text-black"
              size="sm"
            >
              {currentLabels.addButton}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Quest List */}
      <div className="space-y-4">
        {sortedQuests.length === 0 ? (
          <Card className="border-amber-800/20 bg-gradient-to-br from-gray-900 to-gray-800">
            <CardContent className="p-8 text-center">
              <Trophy className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-300 mb-2">{currentLabels.noItems}</h3>
              <p className="text-gray-400">{currentLabels.noItemsSubtitle}</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-3">
            {sortedQuests.map((quest) => (
              <Card
                key={quest.id}
                className={`border transition-all duration-300 hover:shadow-lg ${
                  quest.completed 
                    ? 'border-green-800/30 bg-green-900/10' 
                    : 'border-amber-800/20 bg-gray-900 hover:border-amber-500/40'
                }`}
                aria-label={`Quest card: ${quest.name}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">
                        {categoryConfig[quest.category as keyof typeof categoryConfig]?.icon || '📋'}
                      </span>
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${
                          categoryConfig[quest.category as keyof typeof categoryConfig]?.color || 'text-gray-400'
                        }`}
                      >
                        {categoryConfig[quest.category as keyof typeof categoryConfig]?.name || quest.category}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1">
                      {quest.favorited && <Star className="h-4 w-4 text-amber-400 fill-current" />}
                      <QuestToggleButton
                        questId={quest.id}
                        questName={quest.name}
                        completed={quest.completed}
                        xp={quest.xp || 50}
                        gold={quest.gold || 25}
                        category={quest.category}
                        onToggle={onQuestToggle}
                        variant="checkbox"
                      />
                      {/* Edit and Delete buttons */}
                      <div className="flex items-center gap-1 ml-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 text-gray-400 hover:text-amber-400"
                          onClick={(e) => {
                            e.stopPropagation();
                            onQuestEdit(quest);
                          }}
                        >
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 text-gray-400 hover:text-red-400"
                          onClick={(e) => {
                            e.stopPropagation();
                            onQuestDelete(quest.id);
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  <h3 className="font-semibold text-white mb-2 line-clamp-2">
                    {quest.name}
                  </h3>
                  <p className="text-sm text-gray-400 mb-3 line-clamp-2">
                    {quest.description}
                  </p>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-300">Rewards</span>
                      <div className="flex items-center gap-2">
                        {quest.gold && quest.gold > 0 && (
                          <Badge variant="outline" className="text-amber-400 border-amber-400 text-xs">
                            {quest.gold} Gold
                          </Badge>
                        )}
                        {quest.xp && quest.xp > 0 && (
                          <Badge variant="outline" className="text-blue-400 border-blue-400 text-xs">
                            {quest.xp} XP
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${
                          difficultyConfig[quest.difficulty as keyof typeof difficultyConfig]?.color || 'text-gray-400'
                        }`}
                      >
                        {difficultyConfig[quest.difficulty as keyof typeof difficultyConfig]?.name || quest.difficulty}
                      </Badge>
                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onQuestFavorite(quest.id)}
                          className="h-6 w-6 p-0"
                        >
                          <Star className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onQuestEdit(quest)}
                          className="h-6 w-6 p-0"
                        >
                          <Target className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
} 