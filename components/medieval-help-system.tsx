import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  HelpCircle, 
  X, 
  ChevronLeft, 
  ChevronRight, 
  BookOpen, 
  Sword, 
  Shield, 
  Crown, 
  Scroll,
  Home,
  Settings,
  Trophy,
  Star
} from 'lucide-react';

// Help content interface
interface HelpContent {
  id: string;
  title: string;
  description: string;
  category: 'quests' | 'kingdom' | 'character' | 'general';
  icon: React.ReactNode;
  tips?: string[];
}

// Help content data
const helpContent: HelpContent[] = [
  {
    id: 'quest-basics',
    title: 'Quest Basics',
    description: 'Complete daily quests to earn XP, gold, and progress your character.',
    category: 'quests',
    icon: <Scroll className="h-5 w-5" />,
    tips: [
      'Complete quests daily to maintain your streak',
      'Different quest categories give different rewards',
      'Higher difficulty quests give better rewards'
    ]
  },
  {
    id: 'quest-categories',
    title: 'Quest Categories',
    description: 'Quests are organized into four main categories based on medieval virtues.',
    category: 'quests',
    icon: <Sword className="h-5 w-5" />,
    tips: [
      'Might: Physical strength and fitness quests',
      'Knowledge: Learning and mental development',
      'Condition: Health and wellness activities',
      'Nutrition: Healthy eating and diet habits'
    ]
  },
  {
    id: 'kingdom-building',
    title: 'Kingdom Building',
    description: 'Build and expand your medieval kingdom by completing quests and managing resources.',
    category: 'kingdom',
    icon: <Home className="h-5 w-5" />,
    tips: [
      'Each quest completion contributes to kingdom growth',
      'Manage your kingdom tiles and their timers',
      'Collect resources from completed buildings'
    ]
  },
  {
    id: 'character-progression',
    title: 'Character Progression',
    description: 'Level up your character by earning XP from quest completions.',
    category: 'character',
    icon: <Trophy className="h-5 w-5" />,
    tips: [
      'Earn XP by completing quests',
      'Level up to unlock new features',
      'Track your progress across all categories'
    ]
  },
  {
    id: 'streaks',
    title: 'Streaks',
    description: 'Maintain daily completion streaks for bonus rewards and achievements.',
    category: 'general',
    icon: <Star className="h-5 w-5" />,
    tips: [
      'Complete at least one quest per day to maintain your streak',
      'Longer streaks give better rewards',
      'Streaks reset if you miss a day'
    ]
  },
  {
    id: 'achievements',
    title: 'Achievements',
    description: 'Unlock achievements by reaching milestones and completing special challenges.',
    category: 'general',
    icon: <Crown className="h-5 w-5" />,
    tips: [
      'Achievements provide permanent rewards',
      'Some achievements unlock new features',
      'Check your progress in the achievements section'
    ]
  }
];

// Help modal component
interface MedievalHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialCategory?: string;
}

export function MedievalHelpModal({
  isOpen,
  onClose,
  initialCategory = 'quests',
}: MedievalHelpModalProps) {
  const [currentCategory, setCurrentCategory] = useState(initialCategory);
  const [currentIndex, setCurrentIndex] = useState(0);

  const filteredContent = helpContent.filter(item => item.category === currentCategory);
  const currentItem = filteredContent[currentIndex];

  useEffect(() => {
    if (isOpen) {
      setCurrentCategory(initialCategory);
      setCurrentIndex(0);
    }
  }, [isOpen, initialCategory]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl bg-gradient-to-br from-amber-900 to-amber-800 border border-amber-600/30 shadow-2xl">
        <CardHeader className="border-b border-amber-700/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <BookOpen className="h-6 w-6 text-amber-300" />
              <CardTitle className="text-2xl text-amber-100 font-serif">
                📚 Medieval Guide
              </CardTitle>
            </div>
            <Button
              onClick={onClose}
              variant="ghost"
              size="sm"
              className="text-amber-300 hover:text-amber-100 hover:bg-amber-800/30"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          {/* Category tabs */}
          <div className="flex space-x-2 mb-6">
            {['quests', 'kingdom', 'character', 'general'].map((category) => (
              <Button
                key={category}
                onClick={() => {
                  setCurrentCategory(category);
                  setCurrentIndex(0);
                }}
                variant={currentCategory === category ? 'default' : 'outline'}
                size="sm"
                className={cn(
                  'capitalize',
                  currentCategory === category
                    ? 'bg-amber-600 hover:bg-amber-700 text-amber-50'
                    : 'border-amber-600/30 text-amber-300 hover:bg-amber-800/30'
                )}
              >
                {category}
              </Button>
            ))}
          </div>

          {/* Content */}
          {currentItem && (
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="text-amber-300">
                  {currentItem.icon}
                </div>
                <h3 className="text-xl font-bold text-amber-100 font-serif">
                  {currentItem.title}
                </h3>
              </div>

              <p className="text-amber-200 leading-relaxed">
                {currentItem.description}
              </p>

              {currentItem.tips && (
                <div className="space-y-2">
                  <h4 className="text-lg font-semibold text-amber-100">
                    💡 Pro Tips:
                  </h4>
                  <ul className="space-y-1">
                    {currentItem.tips.map((tip, index) => (
                      <li key={index} className="flex items-start space-x-2 text-amber-200">
                        <span className="text-amber-400 mt-1">•</span>
                        <span className="text-sm">{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-amber-700/30">
            <Button
              onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
              disabled={currentIndex === 0}
              variant="outline"
              size="sm"
              className="border-amber-600/30 text-amber-300 hover:bg-amber-800/30"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>

            <div className="flex space-x-1">
              {filteredContent.map((_, index) => (
                <div
                  key={index}
                  className={cn(
                    'w-2 h-2 rounded-full transition-colors',
                    index === currentIndex ? 'bg-amber-400' : 'bg-amber-600/30'
                  )}
                />
              ))}
            </div>

            <Button
              onClick={() => setCurrentIndex(Math.min(filteredContent.length - 1, currentIndex + 1))}
              disabled={currentIndex === filteredContent.length - 1}
              variant="outline"
              size="sm"
              className="border-amber-600/30 text-amber-300 hover:bg-amber-800/30"
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Contextual help button
interface ContextualHelpProps {
  content: HelpContent;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  className?: string;
}

export function ContextualHelp({
  content,
  position = 'top-right',
  className,
}: ContextualHelpProps) {
  const [isOpen, setIsOpen] = useState(false);

  const getPositionClasses = () => {
    switch (position) {
      case 'top-left':
        return 'top-2 left-2';
      case 'top-right':
        return 'top-2 right-2';
      case 'bottom-left':
        return 'bottom-2 left-2';
      case 'bottom-right':
        return 'bottom-2 right-2';
      default:
        return 'top-2 right-2';
    }
  };

  return (
    <>
      <div className={cn('absolute z-10', getPositionClasses(), className)}>
        <Button
          onClick={() => setIsOpen(true)}
          size="sm"
          className="bg-amber-600/20 border border-amber-500/30 text-amber-300 hover:bg-amber-600/30 hover:text-amber-100 transition-all duration-200"
          aria-label="Help"
        >
          <HelpCircle className="h-4 w-4" />
        </Button>
      </div>

      <MedievalHelpModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        initialCategory={content.category}
      />
    </>
  );
}

// Quick help tooltip
interface QuickHelpTooltipProps {
  children: React.ReactNode;
  title: string;
  description: string;
  className?: string;
}

export function QuickHelpTooltip({
  children,
  title,
  description,
  className,
}: QuickHelpTooltipProps) {
  return (
    <div className={cn('group relative', className)}>
      {children}
      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-20">
        <div className="bg-gradient-to-r from-amber-900 to-amber-800 border border-amber-600/30 rounded-lg shadow-xl p-3 max-w-xs">
          <h4 className="text-sm font-bold text-amber-100 mb-1">
            {title}
          </h4>
          <p className="text-xs text-amber-200">
            {description}
          </p>
        </div>
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-amber-600/30" />
      </div>
    </div>
  );
}

// Help system provider
interface HelpSystemProviderProps {
  children: React.ReactNode;
}

export function HelpSystemProvider({ children }: HelpSystemProviderProps) {
  const [helpModalOpen, setHelpModalOpen] = useState(false);

  useEffect(() => {
    // Check if user is new and show help
    const isNewUser = localStorage.getItem('medieval-help-shown') !== 'true';
    if (isNewUser) {
      setHelpModalOpen(true);
      localStorage.setItem('medieval-help-shown', 'true');
    }
  }, []);

  return (
    <>
      {children}
      
      {/* Help button */}
      <div className="fixed bottom-4 right-4 z-40">
        <Button
          onClick={() => setHelpModalOpen(true)}
          className="bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-amber-50 border border-amber-500/30 shadow-lg hover:shadow-xl transition-all duration-200"
          size="lg"
        >
          <HelpCircle className="h-5 w-5 mr-2" />
          Help
        </Button>
      </div>

      <MedievalHelpModal
        isOpen={helpModalOpen}
        onClose={() => setHelpModalOpen(false)}
      />
    </>
  );
}
