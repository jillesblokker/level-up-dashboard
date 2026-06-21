import React from 'react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { HelpCircle, Info, Sword, Shield, Crown, Scroll } from 'lucide-react';

// Medieval tooltip content component
interface MedievalTooltipProps {
  children: React.ReactNode;
  content: React.ReactNode;
  side?: 'top' | 'right' | 'bottom' | 'left';
  align?: 'start' | 'center' | 'end';
  medieval?: boolean;
  className?: string;
}

export function MedievalTooltip({
  children,
  content,
  side = 'top',
  align = 'center',
  medieval = true,
  className,
}: MedievalTooltipProps) {
  if (medieval) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={cn('cursor-help', className)}>
            {children}
          </div>
        </TooltipTrigger>
        <TooltipContent 
          side={side} 
          align={align}
          className="bg-gradient-to-r from-amber-900 to-amber-800 border border-amber-600/30 text-amber-100 shadow-xl backdrop-blur-sm max-w-xs"
        >
          <div className="flex items-start space-x-2">
            <Scroll className="h-4 w-4 text-amber-300 mt-0.5 flex-shrink-0" />
            <div className="text-sm font-medium">
              {content}
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className={className}>
          {children}
        </div>
      </TooltipTrigger>
      <TooltipContent side={side} align={align}>
        {content}
      </TooltipContent>
    </Tooltip>
  );
}

// Quest-specific tooltip
interface QuestTooltipProps {
  children: React.ReactNode;
  questName: string;
  questDescription?: string;
  xpReward?: number;
  goldReward?: number;
  category?: string;
  className?: string;
}

export function QuestTooltip({
  children,
  questName,
  questDescription,
  xpReward = 50,
  goldReward = 25,
  category = 'general',
  className,
}: QuestTooltipProps) {
  const getCategoryIcon = () => {
    switch (category.toLowerCase()) {
      case 'might':
        return <Sword className="h-3 w-3 text-red-400" />;
      case 'knowledge':
        return <Scroll className="h-3 w-3 text-blue-400" />;
      case 'condition':
        return <Shield className="h-3 w-3 text-green-400" />;
      case 'nutrition':
        return <Crown className="h-3 w-3 text-purple-400" />;
      default:
        return <Info className="h-3 w-3 text-gray-400" />;
    }
  };

  const getCategoryColor = () => {
    switch (category.toLowerCase()) {
      case 'might':
        return 'text-red-300';
      case 'knowledge':
        return 'text-blue-300';
      case 'condition':
        return 'text-green-300';
      case 'nutrition':
        return 'text-purple-300';
      default:
        return 'text-gray-300';
    }
  };

  return (
    <MedievalTooltip
      content={
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            {getCategoryIcon()}
            <span className={cn('font-semibold', getCategoryColor())}>
              {questName}
            </span>
          </div>
          {questDescription && (
            <p className="text-amber-200 text-xs">
              {questDescription}
            </p>
          )}
          <div className="flex space-x-4 text-xs">
            <div className="flex items-center space-x-1">
              <span className="text-yellow-400">🪙</span>
              <span className="text-amber-200">+{goldReward}</span>
            </div>
            <div className="flex items-center space-x-1">
              <span className="text-blue-400">✨</span>
              <span className="text-amber-200">+{xpReward}</span>
            </div>
          </div>
        </div>
      }
      {...(className && { className })}
    >
      {children}
    </MedievalTooltip>
  );
}

// Kingdom tile tooltip
interface KingdomTileTooltipProps {
  children: React.ReactNode;
  tileName: string;
  tileDescription?: string;
  timerMinutes?: number;
  goldRange?: [number, number];
  rarity?: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  className?: string;
}

export function KingdomTileTooltip({
  children,
  tileName,
  tileDescription,
  timerMinutes = 30,
  goldRange = [10, 25],
  rarity = 'common',
  className,
}: KingdomTileTooltipProps) {
  const getRarityColor = () => {
    switch (rarity) {
      case 'common':
        return 'text-gray-300';
      case 'uncommon':
        return 'text-green-300';
      case 'rare':
        return 'text-blue-300';
      case 'epic':
        return 'text-purple-300';
      case 'legendary':
        return 'text-yellow-300';
      default:
        return 'text-gray-300';
    }
  };

  const getRarityIcon = () => {
    switch (rarity) {
      case 'common':
        return '⚪';
      case 'uncommon':
        return '🟢';
      case 'rare':
        return '🔵';
      case 'epic':
        return '🟣';
      case 'legendary':
        return '🟡';
      default:
        return '⚪';
    }
  };

  return (
    <MedievalTooltip
      content={
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <span className="text-lg">{getRarityIcon()}</span>
            <span className={cn('font-semibold', getRarityColor())}>
              {tileName}
            </span>
          </div>
          {tileDescription && (
            <p className="text-amber-200 text-xs">
              {tileDescription}
            </p>
          )}
          <div className="space-y-1 text-xs">
            <div className="flex items-center space-x-1">
              <span className="text-amber-400">⏱️</span>
              <span className="text-amber-200">{timerMinutes} minutes</span>
            </div>
            <div className="flex items-center space-x-1">
              <span className="text-yellow-400">🪙</span>
              <span className="text-amber-200">
                {goldRange[0]}-{goldRange[1]} gold
              </span>
            </div>
          </div>
        </div>
      }
      {...(className && { className })}
    >
      {children}
    </MedievalTooltip>
  );
}

// Help button component
interface MedievalHelpButtonProps {
  content: React.ReactNode;
  side?: 'top' | 'right' | 'bottom' | 'left';
  className?: string;
}

export function MedievalHelpButton({
  content,
  side = 'top',
  className,
}: MedievalHelpButtonProps) {
  return (
    <MedievalTooltip
      content={content}
      side={side}
      {...(className && { className })}
    >
      <button 
        className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-amber-600/20 border border-amber-500/30 text-amber-300 hover:bg-amber-600/30 hover:text-amber-200 transition-all duration-200"
        aria-label="Help"
        title="Help"
      >
        <HelpCircle className="h-3 w-3" />
      </button>
    </MedievalTooltip>
  );
}

// Contextual help system
interface MedievalHelpSystemProps {
  children: React.ReactNode;
  helpContent: React.ReactNode;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  className?: string;
}

export function MedievalHelpSystem({
  children,
  helpContent,
  position = 'top-right',
  className,
}: MedievalHelpSystemProps) {
  const getPositionClasses = () => {
    switch (position) {
      case 'top-left':
        return 'top-4 left-4';
      case 'top-right':
        return 'top-4 right-4';
      case 'bottom-left':
        return 'bottom-4 left-4';
      case 'bottom-right':
        return 'bottom-4 right-4';
      default:
        return 'top-4 right-4';
    }
  };

  return (
    <div className={cn('relative', className)}>
      {children}
      <div className={cn('absolute z-10', getPositionClasses())}>
        <MedievalHelpButton content={helpContent} />
      </div>
    </div>
  );
}

// Tutorial step component
interface MedievalTutorialStepProps {
  children: React.ReactNode;
  step: number;
  totalSteps: number;
  title: string;
  description: string;
  onNext?: () => void;
  onPrevious?: () => void;
  onSkip?: () => void;
  className?: string;
}

export function MedievalTutorialStep({
  children,
  step,
  totalSteps,
  title,
  description,
  onNext,
  onPrevious,
  onSkip,
  className,
}: MedievalTutorialStepProps) {
  return (
    <div className={cn('relative', className)}>
      {children}
      
      {/* Tutorial overlay */}
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50">
        <div className="absolute inset-0 flex items-center justify-center p-4">
          <div className="bg-gradient-to-r from-amber-900 to-amber-800 border border-amber-600/30 rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center space-x-2">
                <Scroll className="h-6 w-6 text-amber-300" />
                <h3 className="text-xl font-bold text-amber-100 font-serif">
                  {title}
                </h3>
              </div>
              
              <p className="text-amber-200 text-sm">
                {description}
              </p>
              
              <div className="flex justify-between items-center">
                <div className="text-xs text-amber-300">
                  Step {step} of {totalSteps}
                </div>
                
                <div className="flex space-x-2">
                  {onPrevious && (
                    <button
                      onClick={onPrevious}
                      className="px-3 py-1 text-xs bg-amber-700 hover:bg-amber-600 text-amber-100 rounded transition-colors"
                    >
                      Previous
                    </button>
                  )}
                  {onNext && (
                    <button
                      onClick={onNext}
                      className="px-3 py-1 text-xs bg-amber-600 hover:bg-amber-500 text-amber-100 rounded transition-colors"
                    >
                      Next
                    </button>
                  )}
                  {onSkip && (
                    <button
                      onClick={onSkip}
                      className="px-3 py-1 text-xs text-amber-300 hover:text-amber-200 transition-colors"
                    >
                      Skip
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
