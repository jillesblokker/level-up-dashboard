import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Star, Lock, Unlock, TrendingUp, Trophy, MapIcon } from 'lucide-react'

interface ProgressionStepProps {
  onNext: () => void
  onPrevious: () => void
  isFirstStep: boolean
  isLastStep: boolean
  stepData: any
}

export function ProgressionStep({ onNext }: ProgressionStepProps) {
  const [currentLevel, setCurrentLevel] = useState(1)
  const [currentXP, setCurrentXP] = useState(0)
  const [maxXP, setMaxXP] = useState(100)
  const [showLevelUp, setShowLevelUp] = useState(false)
  const [unlockedContent, setUnlockedContent] = useState<string[]>([])

  useEffect(() => {
    // Simulate XP gain and level up
    const timer = setTimeout(() => {
      setCurrentXP(75)
    }, 1000)

    const levelUpTimer = setTimeout(() => {
      setCurrentXP(100)
      setShowLevelUp(true)
      setCurrentLevel(2)
      setMaxXP(150)
      setUnlockedContent(['New Quests', 'Advanced Tiles', 'Kingdom Events'])
    }, 3000)

    return () => {
      clearTimeout(timer)
      clearTimeout(levelUpTimer)
    }
  }, [])

  const progress = (currentXP / maxXP) * 100

  const lockedFeatures = [
    { name: 'Advanced Quests', level: 3, icon: Star },
    { name: 'Rare Tiles', level: 5, icon: Trophy },
    { name: 'Kingdom Events', level: 2, icon: TrendingUp },
    { name: 'Special Rewards', level: 4, icon: Trophy }
  ]

  return (
    <div className="w-full max-w-2xl space-y-6">
      {/* Level Display */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center space-x-2 mb-4">
          <Star className="h-8 w-8 text-amber-400" />
          <span className="text-3xl font-bold text-amber-400">Level {currentLevel}</span>
        </div>
        <p className="text-gray-300">
          Gain experience by completing quests and unlock new content as you level up.
        </p>
      </div>

      {/* Experience Progress */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white">Experience Progress</h3>
        <Card className="bg-gray-800/50 border border-amber-800/20">
          <CardContent className="p-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-300">Experience</span>
                <span className="text-amber-400">{currentXP} / {maxXP} XP</span>
              </div>
              <Progress 
                value={progress} 
                className="h-3 bg-gray-700"
                style={{
                  '--progress-background': 'rgb(245 158 11)',
                  '--progress-foreground': 'rgb(245 158 11)'
                } as React.CSSProperties}
              />
              <div className="text-center text-sm text-gray-400">
                {showLevelUp ? 'Level Up!' : `${maxXP - currentXP} XP to next level`}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Level Up Animation */}
      {showLevelUp && (
        <Card className="bg-green-500/20 border border-green-500/40">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <Star className="h-6 w-6 text-green-400" />
              <span className="text-xl font-bold text-green-400">Level Up!</span>
            </div>
            <p className="text-green-300">
              You&apos;ve reached Level 2! New content has been unlocked.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Unlocked Content */}
      {unlockedContent.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-md font-semibold text-white">Newly Unlocked</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {unlockedContent.map((content, index) => (
              <Card key={index} className="bg-green-500/10 border border-green-500/20">
                <CardContent className="p-3 text-center">
                  <Unlock className="h-5 w-5 text-green-400 mx-auto mb-2" />
                  <p className="text-sm font-medium text-white">{content}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Available Features */}
      <div className="space-y-3">
        <h4 className="text-md font-semibold text-white">Available Features</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {lockedFeatures.map((feature, index) => {
            const Icon = feature.icon
            const isUnlocked = currentLevel >= feature.level
            
            return (
              <Card 
                key={index} 
                className={`border transition-all duration-300 ${
                  isUnlocked 
                    ? 'bg-green-500/10 border-green-500/20' 
                    : 'bg-gray-800/50 border-gray-700/50'
                }`}
              >
                <CardContent className="p-3">
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      isUnlocked ? 'bg-green-500/20' : 'bg-gray-700/50'
                    }`}>
                      <Icon className={`h-4 w-4 ${isUnlocked ? 'text-green-400' : 'text-gray-500'}`} />
                    </div>
                    <div className="flex-1">
                      <h5 className={`font-medium ${isUnlocked ? 'text-white' : 'text-gray-400'}`}>
                        {feature.name}
                      </h5>
                      <div className="flex items-center space-x-2 mt-1">
                        {isUnlocked ? (
                          <Badge variant="secondary" className="text-xs bg-green-500/20 text-green-400">
                            Unlocked
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs">
                            Level {feature.level}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Tile Examples */}
      <div className="space-y-3">
        <h4 className="text-md font-semibold text-white">Tile Examples</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="bg-gray-800/50 border border-amber-800/20 rounded-lg p-3">
            <div className="flex flex-col items-center space-y-2">
              <div className="w-12 h-12 bg-gradient-to-br from-gray-700 to-gray-800 rounded-lg flex items-center justify-center overflow-hidden">
                <img 
                  src="/images/tiles/grass-tile.png" 
                  alt="Grass Tile"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const fallback = target.parentElement?.querySelector('.fallback-icon') as HTMLElement;
                    if (fallback) fallback.style.display = 'flex';
                  }}
                />
                <MapIcon className="h-6 w-6 text-amber-400 fallback-icon" style={{ display: 'none' }} />
              </div>
              <div className="text-center">
                <h5 className="font-medium text-white text-sm">Grass Tiles</h5>
                <p className="text-xs text-gray-400">Foundation tiles</p>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-800/50 border border-amber-800/20 rounded-lg p-3">
            <div className="flex flex-col items-center space-y-2">
              <div className="w-12 h-12 bg-gradient-to-br from-gray-700 to-gray-800 rounded-lg flex items-center justify-center overflow-hidden">
                <img 
                  src="/images/tiles/water-tile.png" 
                  alt="Water Tile"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const fallback = target.parentElement?.querySelector('.fallback-icon') as HTMLElement;
                    if (fallback) fallback.style.display = 'flex';
                  }}
                />
                <MapIcon className="h-6 w-6 text-amber-400 fallback-icon" style={{ display: 'none' }} />
              </div>
              <div className="text-center">
                <h5 className="font-medium text-white text-sm">Water Tiles</h5>
                <p className="text-xs text-gray-400">Resource tiles</p>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-800/50 border border-amber-800/20 rounded-lg p-3">
            <div className="flex flex-col items-center space-y-2">
              <div className="w-12 h-12 bg-gradient-to-br from-gray-700 to-gray-800 rounded-lg flex items-center justify-center overflow-hidden">
                <img 
                  src="/images/tiles/forest-tile.png" 
                  alt="Forest Tile"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const fallback = target.parentElement?.querySelector('.fallback-icon') as HTMLElement;
                    if (fallback) fallback.style.display = 'flex';
                  }}
                />
                <MapIcon className="h-6 w-6 text-amber-400 fallback-icon" style={{ display: 'none' }} />
              </div>
              <div className="text-center">
                <h5 className="font-medium text-white text-sm">Forest Tiles</h5>
                <p className="text-xs text-gray-400">Production tiles</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Progression Benefits */}
      <div className="space-y-3">
        <h4 className="text-md font-semibold text-white">Progression Benefits</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
            <h5 className="font-medium text-amber-400 mb-1">Level Up Rewards</h5>
            <p className="text-sm text-gray-300">
              Each level unlocks new quests, tiles, and special features for your kingdom.
            </p>
          </div>
          <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
            <h5 className="font-medium text-green-400 mb-1">Experience Gain</h5>
            <p className="text-sm text-gray-300">
              Complete quests to earn experience points and advance your character.
            </p>
          </div>
        </div>
      </div>

      {/* Progress Status */}
      {!showLevelUp && (
        <div className="text-center">
          <p className="text-sm text-gray-400">Watch your experience grow as you complete quests...</p>
        </div>
      )}
    </div>
  )
} 