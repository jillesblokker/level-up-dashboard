"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Volume2, 
  VolumeX, 
  Music, 
  Volume1, 
  Play, 
  Pause, 
  SkipForward,
  Settings
} from 'lucide-react'
import { useAudio } from '@/hooks/useAudio'
import { cn } from '@/lib/utils'

interface AudioControlsProps {
  className?: string
  compact?: boolean
}

export function AudioControls({ className, compact = false }: AudioControlsProps) {
  const {
    settings,
    currentMusic,
    isPlaying,
    audioTracks,
    playMusic,
    stopMusic,
    toggleMusic,
    updateSettings
  } = useAudio()

  const [isExpanded, setIsExpanded] = useState(false)

  const handleMasterVolumeChange = (value: number[]) => {
    updateSettings({ masterVolume: (value[0] || 0) / 100 })
  }

  const handleMusicVolumeChange = (value: number[]) => {
    updateSettings({ musicVolume: (value[0] || 0) / 100 })
  }

  const handleSFXVolumeChange = (value: number[]) => {
    updateSettings({ sfxVolume: (value[0] || 0) / 100 })
  }

  const toggleMusicEnabled = () => {
    updateSettings({ musicEnabled: !settings.musicEnabled })
    if (settings.musicEnabled) {
      stopMusic()
    }
  }

  const toggleSFXEnabled = () => {
    updateSettings({ sfxEnabled: !settings.sfxEnabled })
  }

  if (compact) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleMusicEnabled}
          className={cn(
            "w-8 h-8 p-0",
            settings.musicEnabled ? "text-amber-400" : "text-gray-500"
          )}
          aria-label={settings.musicEnabled ? "Disable music" : "Enable music"}
        >
          {settings.musicEnabled ? <Music className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleSFXEnabled}
          className={cn(
            "w-8 h-8 p-0",
            settings.sfxEnabled ? "text-amber-400" : "text-gray-500"
          )}
          aria-label={settings.sfxEnabled ? "Disable sound effects" : "Enable sound effects"}
        >
          {settings.sfxEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
        </Button>

        {currentMusic && (
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleMusic}
            className="w-8 h-8 p-0 text-amber-400"
            aria-label={isPlaying ? "Pause music" : "Play music"}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </Button>
        )}
      </div>
    )
  }

  return (
    <Card className={cn("bg-gray-900 border-amber-800/20", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-amber-400">
          <Music className="w-5 h-5" />
          Audio Settings
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="ml-auto w-8 h-8 p-0"
            aria-label={isExpanded ? "Collapse settings" : "Expand settings"}
          >
            <Settings className="w-4 h-4" />
          </Button>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Master Volume */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-300">Master Volume</label>
            <span className="text-xs text-gray-400">{Math.round(settings.masterVolume * 100)}%</span>
          </div>
          <Slider
            value={[settings.masterVolume * 100]}
            onValueChange={handleMasterVolumeChange}
            max={100}
            step={1}
            className="w-full"
          />
        </div>

        {/* Music Controls */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-300">Music</label>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleMusicEnabled}
                className={cn(
                  "w-8 h-8 p-0",
                  settings.musicEnabled ? "text-amber-400" : "text-gray-500"
                )}
                aria-label={settings.musicEnabled ? "Disable music" : "Enable music"}
              >
                {settings.musicEnabled ? <Music className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </Button>
              {currentMusic && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleMusic}
                  className="w-8 h-8 p-0 text-amber-400"
                  aria-label={isPlaying ? "Pause music" : "Play music"}
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </Button>
              )}
            </div>
          </div>

          {settings.musicEnabled && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">Volume</span>
                <span className="text-xs text-gray-400">{Math.round(settings.musicVolume * 100)}%</span>
              </div>
              <Slider
                value={[settings.musicVolume * 100]}
                onValueChange={handleMusicVolumeChange}
                max={100}
                step={1}
                className="w-full"
              />
            </div>
          )}

          {/* Music Track Selection */}
          {isExpanded && settings.musicEnabled && (
            <div className="space-y-2">
              <label className="text-xs text-gray-400">Background Music</label>
              <div className="grid grid-cols-1 gap-1">
                {audioTracks.map((track) => (
                  <Button
                    key={track.id}
                    variant={currentMusic === track.id ? "default" : "ghost"}
                    size="sm"
                    onClick={() => playMusic(track.id)}
                    className={cn(
                      "justify-start text-xs h-8",
                      currentMusic === track.id 
                        ? "bg-amber-600 text-white" 
                        : "text-gray-300 hover:text-white hover:bg-gray-800"
                    )}
                  >
                    {track.name}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sound Effects */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-300">Sound Effects</label>
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleSFXEnabled}
              className={cn(
                "w-8 h-8 p-0",
                settings.sfxEnabled ? "text-amber-400" : "text-gray-500"
              )}
              aria-label={settings.sfxEnabled ? "Disable sound effects" : "Enable sound effects"}
            >
              {settings.sfxEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </Button>
          </div>

          {settings.sfxEnabled && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">Volume</span>
                <span className="text-xs text-gray-400">{Math.round(settings.sfxVolume * 100)}%</span>
              </div>
              <Slider
                value={[settings.sfxVolume * 100]}
                onValueChange={handleSFXVolumeChange}
                max={100}
                step={1}
                className="w-full"
              />
            </div>
          )}
        </div>

        {/* Current Track Info */}
        {currentMusic && (
          <div className="pt-2 border-t border-gray-700">
            <div className="text-xs text-gray-400">
              Now Playing: <span className="text-amber-400">{audioTracks.find(t => t.id === currentMusic)?.name}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
