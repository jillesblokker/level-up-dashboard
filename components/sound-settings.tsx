import React from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { 
  Volume2, 
  VolumeX, 
  Music, 
  Zap, 
  Bell, 
  Shield,
  Settings,
  Play,
  Pause
} from 'lucide-react';
import { useSound, SOUNDS } from '@/lib/sound-manager';

// Sound settings component
interface SoundSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

export function SoundSettings({
  isOpen,
  onClose,
  className,
}: SoundSettingsProps) {
  const { isEnabled, volume, playSound, toggleSounds, updateVolume } = useSound();
  const [isPlaying, setIsPlaying] = React.useState(false);

  const handleVolumeChange = (value: number[]) => {
    updateVolume((value[0] || 0) / 100);
  };

  const playTestSound = async () => {
    setIsPlaying(true);
    await playSound(SOUNDS.SUCCESS);
    setTimeout(() => setIsPlaying(false), 1000);
  };

  if (!isOpen) return null;

  return (
    <div className={cn('fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4', className)}>
      <Card className="w-full max-w-md bg-gradient-to-br from-amber-900 to-amber-800 border border-amber-600/30 shadow-2xl">
        <CardHeader className="border-b border-amber-700/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Settings className="h-6 w-6 text-amber-300" />
              <CardTitle className="text-xl text-amber-100 font-serif">
                🔊 Sound Settings
              </CardTitle>
            </div>
            <Button
              onClick={onClose}
              variant="ghost"
              size="sm"
              className="text-amber-300 hover:text-amber-100 hover:bg-amber-800/30"
            >
              ✕
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          {/* Master toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {isEnabled ? (
                <Volume2 className="h-5 w-5 text-amber-300" />
              ) : (
                <VolumeX className="h-5 w-5 text-gray-400" />
              )}
              <div>
                <h3 className="text-lg font-semibold text-amber-100">
                  Master Sound
                </h3>
                <p className="text-sm text-amber-200">
                  Enable or disable all sound effects
                </p>
              </div>
            </div>
            <Switch
              checked={isEnabled}
              onCheckedChange={toggleSounds}
              className="data-[state=checked]:bg-amber-600"
            />
          </div>

          {/* Volume control */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Volume2 className="h-4 w-4 text-amber-300" />
              <span className="text-amber-100 font-medium">Volume</span>
            </div>
            <div className="space-y-2">
              <Slider
                value={[volume * 100]}
                onValueChange={handleVolumeChange}
                max={100}
                step={1}
                className="w-full"
                disabled={!isEnabled}
              />
              <div className="flex justify-between text-xs text-amber-300">
                <span>0%</span>
                <span>{Math.round(volume * 100)}%</span>
                <span>100%</span>
              </div>
            </div>
          </div>

          {/* Test sound */}
          <div className="space-y-3">
            <h4 className="text-amber-100 font-medium">Test Sound</h4>
            <Button
              onClick={playTestSound}
              disabled={!isEnabled || isPlaying}
              className="w-full bg-amber-600 hover:bg-amber-700 text-amber-50 border border-amber-500/30"
            >
              {isPlaying ? (
                <>
                  <Pause className="h-4 w-4 mr-2" />
                  Playing...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Play Test Sound
                </>
              )}
            </Button>
          </div>

          {/* Sound categories */}
          <div className="space-y-4">
            <h4 className="text-amber-100 font-medium">Sound Categories</h4>
            
            <div className="space-y-3">
              {/* Quest sounds */}
              <div className="flex items-center justify-between p-3 bg-amber-800/20 rounded-lg border border-amber-700/30">
                <div className="flex items-center space-x-3">
                  <Zap className="h-4 w-4 text-blue-400" />
                  <div>
                    <p className="text-amber-100 text-sm font-medium">Quest Sounds</p>
                    <p className="text-amber-200 text-xs">Completion, rewards, errors</p>
                  </div>
                </div>
                <div className="text-xs text-amber-300">
                  {isEnabled ? 'On' : 'Off'}
                </div>
              </div>

              {/* Achievement sounds */}
              <div className="flex items-center justify-between p-3 bg-amber-800/20 rounded-lg border border-amber-700/30">
                <div className="flex items-center space-x-3">
                  <Bell className="h-4 w-4 text-purple-400" />
                  <div>
                    <p className="text-amber-100 text-sm font-medium">Achievement Sounds</p>
                    <p className="text-amber-200 text-xs">Unlocks, level ups, streaks</p>
                  </div>
                </div>
                <div className="text-xs text-amber-300">
                  {isEnabled ? 'On' : 'Off'}
                </div>
              </div>

              {/* UI sounds */}
              <div className="flex items-center justify-between p-3 bg-amber-800/20 rounded-lg border border-amber-700/30">
                <div className="flex items-center space-x-3">
                  <Shield className="h-4 w-4 text-green-400" />
                  <div>
                    <p className="text-amber-100 text-sm font-medium">UI Sounds</p>
                    <p className="text-amber-200 text-xs">Button clicks, hovers, notifications</p>
                  </div>
                </div>
                <div className="text-xs text-amber-300">
                  {isEnabled ? 'On' : 'Off'}
                </div>
              </div>
            </div>
          </div>

          {/* Info */}
          <div className="bg-amber-800/10 border border-amber-700/30 rounded-lg p-3">
            <p className="text-xs text-amber-200">
              💡 All sounds are procedurally generated and don&apos;t require external files. 
              They&apos;re designed to enhance your medieval adventure experience!
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Sound settings button
interface SoundSettingsButtonProps {
  className?: string;
}

export function SoundSettingsButton({ className }: SoundSettingsButtonProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const { isEnabled } = useSound();

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        variant="ghost"
        size="sm"
        className={cn(
          'text-amber-300 hover:text-amber-100 hover:bg-amber-800/30 transition-all duration-200',
          className
        )}
        aria-label="Sound Settings"
      >
        {isEnabled ? (
          <Volume2 className="h-4 w-4" />
        ) : (
          <VolumeX className="h-4 w-4" />
        )}
      </Button>

      <SoundSettings
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      />
    </>
  );
}

// Quick sound toggle button
interface QuickSoundToggleProps {
  className?: string;
}

export function QuickSoundToggle({ className }: QuickSoundToggleProps) {
  const { isEnabled, toggleSounds } = useSound();

  return (
    <Button
      onClick={toggleSounds}
      variant="ghost"
      size="sm"
      className={cn(
        'transition-all duration-200',
        isEnabled 
          ? 'text-amber-300 hover:text-amber-100 hover:bg-amber-800/30' 
          : 'text-gray-400 hover:text-gray-300 hover:bg-gray-800/30',
        className
      )}
      aria-label={isEnabled ? 'Disable sounds' : 'Enable sounds'}
    >
      {isEnabled ? (
        <Volume2 className="h-4 w-4" />
      ) : (
        <VolumeX className="h-4 w-4" />
      )}
    </Button>
  );
}
