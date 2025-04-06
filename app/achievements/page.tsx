'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useCreatureStore } from '@/stores/creatureStore';
import { useAchievementStore } from '@/stores/achievementStore';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ImageUpload } from '@/components/image-upload';
import { Pencil, ChevronDown } from 'lucide-react';
import { compressImage } from '@/lib/image-utils';
import { useToast } from '@/components/ui/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { GreenParticles } from '@/components/green-particles';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const categories = [
  { id: 'collection', name: 'Collection', icon: '🏆' },
  { id: 'might', name: 'Might', icon: '⚔️' },
  { id: 'knowledge', name: 'Knowledge', icon: '📚' },
  { id: 'exploration', name: 'Exploration', icon: '🗺️' },
  { id: 'social', name: 'Social', icon: '👥' },
  { id: 'crafting', name: 'Crafting', icon: '⚒️' },
] as const;

export default function AchievementsPage() {
  const { toast } = useToast();
  const { creatures, isCreatureDiscovered } = useCreatureStore();
  const { achievements, getAchievementsByCategory } = useAchievementStore();
  const [activeCategory, setActiveCategory] = useState<typeof categories[number]['id']>('collection');
  const [coverImage, setCoverImage] = useState<string>('/images/achievements-header.jpg');
  const [isHovered, setIsHovered] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [previewMode, setPreviewMode] = useState(false);

  useEffect(() => {
    const initializeData = async () => {
      try {
        setIsLoading(true);
        // Check window.headerImages if it exists
        if (typeof window !== 'undefined') {
          if (!window.headerImages) {
            window.headerImages = {};
          }
          if (window.headerImages?.achievements) {
            setCoverImage(window.headerImages.achievements);
          }
        }
      } catch (error) {
        console.error('Error initializing data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeData();
  }, []);

  const handleImageUpload = async (imageUrl: string) => {
    if (!imageUrl) return;
    
    try {
      setIsCompressing(true);

      // Convert data URL to File object
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const file = new File([blob], 'achievements-header.jpg', { type: 'image/jpeg' });

      // Compress the image
      const compressedImage = await compressImage(file);
      
      // Update state and storage
      if (typeof window !== 'undefined') {
        if (!window.headerImages) {
          window.headerImages = {};
        }
        window.headerImages.achievements = compressedImage;
        localStorage.setItem('achievements-header-image', compressedImage);
        setCoverImage(compressedImage);
      }
    } catch (error) {
      console.error('Error compressing image:', error);
      toast({
        title: 'Error',
        description: 'Failed to process image. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsCompressing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-amber-400 font-cardo">Loading achievements...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div 
        className="relative h-[300px] sm:h-[400px] md:h-[500px] w-full overflow-hidden"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <Image
          src={coverImage}
          alt="Achievements"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black opacity-60" />
        
        {/* Edit Icon */}
        <div className={`absolute top-6 right-6 transition-opacity duration-200 ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
          <div className="bg-black/50 p-2 rounded-full hover:bg-black/70 transition-colors">
            <Pencil className="h-6 w-6 text-white" />
          </div>
        </div>

        {/* Centered Title */}
        <div className="absolute inset-0 flex items-center justify-center">
          <h1 className="text-5xl md:text-6xl font-bold font-cardo text-amber-400 drop-shadow-lg">
            Achievements
          </h1>
        </div>

        {/* Hidden Image Upload */}
        <div className="absolute inset-0">
          <ImageUpload
            onImageUploaded={handleImageUpload}
            imageId="achievements-header"
            initialImage={coverImage}
            className="w-full h-full opacity-0"
          />
        </div>

        {/* Loading Overlay */}
        {isCompressing && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <p className="text-white font-cardo text-xl">Compressing image...</p>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="collection" className="w-full">
          <div className="relative">
            {/* Mobile Dropdown */}
            <div className="md:hidden w-full mb-4">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-full justify-between">
                    {categories.find(cat => cat.id === activeCategory)?.icon}{' '}
                    {categories.find(cat => cat.id === activeCategory)?.name}
                    <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-[calc(100vw-2rem)] mx-4">
                  {categories.map((category) => (
                    <DropdownMenuItem
                      key={category.id}
                      onClick={() => {
                        setActiveCategory(category.id);
                        const trigger = document.querySelector(`[data-value="${category.id}"]`) as HTMLElement;
                        if (trigger) trigger.click();
                      }}
                    >
                      <span className="mr-2">{category.icon}</span>
                      {category.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Desktop Tabs */}
            <div className="hidden md:block">
              <ScrollArea className="w-full">
                <TabsList className="inline-flex h-10 items-center justify-start rounded-md bg-gray-900/50 p-1 text-gray-400 min-w-max">
                  {categories.map((category) => (
                    <TabsTrigger
                      key={category.id}
                      value={category.id}
                      data-value={category.id}
                      className="inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-amber-500 data-[state=active]:text-black data-[state=active]:shadow-sm font-cardo"
                      onClick={() => setActiveCategory(category.id)}
                    >
                      <span className="mr-2">{category.icon}</span>
                      {category.name}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </ScrollArea>
            </div>
          </div>

          {categories.map((category) => (
            <TabsContent
              key={category.id}
              value={category.id}
              className="mt-8 focus-visible:outline-none focus-visible:ring-0"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {category.id === 'collection' ? (
                  <>
                    {/* Row 1: Genesis card (000) */}
                    <div className="col-span-full md:col-start-2 md:col-span-1 mb-8">
                      {creatures
                        .filter(creature => creature.id === '000')
                        .map((creature) => {
                          const discovered = isCreatureDiscovered(creature.id);
                          const showCard = discovered || previewMode;
                          return (
                            <div
                              key={creature.id}
                              className={cn(
                                `achievement-card ${discovered ? 'discovered' : ''}`,
                                (discovered || previewMode) && creature.id === '000' && 'animate-float-up animate-glow-green'
                              )}
                            >
                              <div className="achievement-card-content">
                                <div className="achievement-card-front">
                                  <div className="relative w-full h-full">
                                    <Image
                                      src={showCard ? `/images/creatures/${creature.id}.png` : '/images/undiscovered.png'}
                                      alt={showCard ? creature.name : `Undiscovered Creature #${creature.id}`}
                                      fill
                                      className="object-contain rounded-lg"
                                      priority
                                    />
                                    {/* Animated overlays for discovered or preview cards */}
                                    {(discovered || previewMode) &&
                                      <>
                                        {/* Genesis creature (000) */}
                                        {creature.id === '000' && (
                                          <>
                                            <div className="absolute inset-0 pointer-events-none">
                                              <GreenParticles />
                                            </div>
                                          </>
                                        )}
                                      </>
                                    }
                                    <div className="absolute top-4 left-0 right-0 flex justify-center">
                                      <div className="px-4 py-1 bg-black/20 backdrop-blur-sm border border-amber-400 rounded-lg">
                                        <p className="text-xl font-cardo text-amber-400">#{creature.id}</p>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                {(discovered || previewMode) && (
                                  <div className="achievement-card-back">
                                    <div className="relative w-full h-full">
                                      <Image
                                        src="/images/Back_card_stats.png"
                                        alt={`${creature.name} Stats`}
                                        fill
                                        className="object-contain rounded-lg"
                                        priority
                                      />
                                      <div className="absolute inset-0">
                                        <div 
                                          className="absolute text-white font-cardo text-lg text-center w-[100px]" 
                                          style={{ 
                                            top: '21%',
                                            left: '52%',
                                            transform: 'translateX(-50%) scale(var(--stat-scale, 1))',
                                            '--stat-scale': 'clamp(0.85, 0.85 + 0.15 * (100vw - 320px) / 680, 1)'
                                          } as any}
                                          data-testid={`hp-${creature.id}`}
                                        >{creature?.stats?.hp ?? 0}</div>
                                        <div 
                                          className="absolute text-white font-cardo text-lg text-center w-[100px]" 
                                          style={{ 
                                            top: '33.5%',
                                            left: '52%',
                                            transform: 'translateX(-50%) scale(var(--stat-scale, 1))',
                                            '--stat-scale': 'clamp(0.85, 0.85 + 0.15 * (100vw - 320px) / 680, 1)'
                                          } as any}
                                          data-testid={`attack-${creature.id}`}
                                        >{creature?.stats?.attack ?? 0}</div>
                                        <div 
                                          className="absolute text-white font-cardo text-lg text-center w-[100px]" 
                                          style={{ 
                                            top: '46%',
                                            left: '52%',
                                            transform: 'translateX(-50%) scale(var(--stat-scale, 1))',
                                            '--stat-scale': 'clamp(0.85, 0.85 + 0.15 * (100vw - 320px) / 680, 1)'
                                          } as any}
                                          data-testid={`defense-${creature.id}`}
                                        >{creature?.stats?.defense ?? 0}</div>
                                        <div 
                                          className="absolute text-white font-cardo text-lg text-center w-[100px]" 
                                          style={{ 
                                            top: '58.5%',
                                            left: '52%',
                                            transform: 'translateX(-50%) scale(var(--stat-scale, 1))',
                                            '--stat-scale': 'clamp(0.85, 0.85 + 0.15 * (100vw - 320px) / 680, 1)'
                                          } as any}
                                          data-testid={`speed-${creature.id}`}
                                        >{creature?.stats?.speed ?? 0}</div>
                                        <div 
                                          className="absolute text-white font-cardo text-lg text-center w-[100px]" 
                                          style={{ 
                                            top: '71%',
                                            left: '52%',
                                            transform: 'translateX(-50%) scale(var(--stat-scale, 1))',
                                            '--stat-scale': 'clamp(0.85, 0.85 + 0.15 * (100vw - 320px) / 680, 1)'
                                          } as any}
                                          data-testid={`type-${creature.id}`}
                                        >{creature?.stats?.type ?? 'Unknown'}</div>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                    </div>

                    {/* Row 2: Fire creatures (001-003) */}
                    <div className="col-span-full grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
                      {creatures
                        .filter(creature => ['001', '002', '003'].includes(creature.id))
                        .map((creature) => {
                          const discovered = isCreatureDiscovered(creature.id);
                          const showCard = discovered || previewMode;
                          return (
                            <div
                              key={creature.id}
                              className={`achievement-card ${discovered ? 'discovered' : ''}`}
                            >
                              <div className="achievement-card-content">
                                <div className="achievement-card-front">
                                  <div className="relative w-full h-full">
                                    <Image
                                      src={showCard ? `/images/creatures/${creature.id}.png` : '/images/undiscovered.png'}
                                      alt={showCard ? creature.name : `Undiscovered Creature #${creature.id}`}
                                      fill
                                      className="object-contain rounded-lg"
                                      priority
                                    />
                                    {/* Animated overlays for discovered or preview cards */}
                                    {(discovered || previewMode) &&
                                      <>
                                        {/* Fire creatures (001-003) */}
                                        {['001', '002', '003'].includes(creature.id) && (
                                          <div className="absolute inset-0 pointer-events-none">
                                            {[...Array(5 + Math.floor(Math.random() * 4))].map((_, i) => (
                                              <div
                                                key={i}
                                                className={`spark spark-${creature.id}`}
                                                style={{
                                                  position: 'absolute',
                                                  width: '10px',
                                                  height: '10px',
                                                  backgroundColor: '#fbbf24',
                                                  borderRadius: '9999px',
                                                  left: `${10 + Math.random() * 80}%`,
                                                  top: `${30 + Math.random() * 20}%`,
                                                  '--delay': `${Math.random() * 2}s`,
                                                  '--duration': `${1.2 + Number(creature.id) * 0.2}s`
                                                } as any}
                                              />
                                            ))}
                                          </div>
                                        )}
                                      </>
                                    }
                                    <div className="absolute top-4 left-0 right-0 flex justify-center">
                                      <div className="px-4 py-1 bg-black/20 backdrop-blur-sm border border-amber-400 rounded-lg">
                                        <p className="text-xl font-cardo text-amber-400">#{creature.id}</p>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                {(discovered || previewMode) && (
                                  <div className="achievement-card-back">
                                    <div className="relative w-full h-full">
                                      <Image
                                        src="/images/Back_card_stats.png"
                                        alt={`${creature.name} Stats`}
                                        fill
                                        className="object-contain rounded-lg"
                                        priority
                                      />
                                      <div className="absolute inset-0">
                                        <div 
                                          className="absolute text-white font-cardo text-lg text-center w-[100px]" 
                                          style={{ 
                                            top: '21%',
                                            left: '52%',
                                            transform: 'translateX(-50%) scale(var(--stat-scale, 1))',
                                            '--stat-scale': 'clamp(0.85, 0.85 + 0.15 * (100vw - 320px) / 680, 1)'
                                          } as any}
                                          data-testid={`hp-${creature.id}`}
                                        >{creature?.stats?.hp ?? 0}</div>
                                        <div 
                                          className="absolute text-white font-cardo text-lg text-center w-[100px]" 
                                          style={{ 
                                            top: '33.5%',
                                            left: '52%',
                                            transform: 'translateX(-50%) scale(var(--stat-scale, 1))',
                                            '--stat-scale': 'clamp(0.85, 0.85 + 0.15 * (100vw - 320px) / 680, 1)'
                                          } as any}
                                          data-testid={`attack-${creature.id}`}
                                        >{creature?.stats?.attack ?? 0}</div>
                                        <div 
                                          className="absolute text-white font-cardo text-lg text-center w-[100px]" 
                                          style={{ 
                                            top: '46%',
                                            left: '52%',
                                            transform: 'translateX(-50%) scale(var(--stat-scale, 1))',
                                            '--stat-scale': 'clamp(0.85, 0.85 + 0.15 * (100vw - 320px) / 680, 1)'
                                          } as any}
                                          data-testid={`defense-${creature.id}`}
                                        >{creature?.stats?.defense ?? 0}</div>
                                        <div 
                                          className="absolute text-white font-cardo text-lg text-center w-[100px]" 
                                          style={{ 
                                            top: '58.5%',
                                            left: '52%',
                                            transform: 'translateX(-50%) scale(var(--stat-scale, 1))',
                                            '--stat-scale': 'clamp(0.85, 0.85 + 0.15 * (100vw - 320px) / 680, 1)'
                                          } as any}
                                          data-testid={`speed-${creature.id}`}
                                        >{creature?.stats?.speed ?? 0}</div>
                                        <div 
                                          className="absolute text-white font-cardo text-lg text-center w-[100px]" 
                                          style={{ 
                                            top: '71%',
                                            left: '52%',
                                            transform: 'translateX(-50%) scale(var(--stat-scale, 1))',
                                            '--stat-scale': 'clamp(0.85, 0.85 + 0.15 * (100vw - 320px) / 680, 1)'
                                          } as any}
                                          data-testid={`type-${creature.id}`}
                                        >{creature?.stats?.type ?? 'Unknown'}</div>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                    </div>

                    {/* Row 3: Water creatures (004-006) */}
                    <div className="col-span-full grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
                      {creatures
                        .filter(creature => creature.id >= '004' && creature.id <= '006')
                        .map((creature) => {
                          const discovered = isCreatureDiscovered(creature.id);
                          const showCard = discovered || previewMode;
                          return (
                            <div
                              key={creature.id}
                              className={`achievement-card ${discovered ? 'discovered' : ''}`}
                            >
                              <div className="achievement-card-content">
                                <div className="achievement-card-front">
                                  <div className="relative w-full h-full">
                                    <Image
                                      src={showCard ? `/images/creatures/${creature.id}.png` : '/images/undiscovered.png'}
                                      alt={showCard ? creature.name : `Undiscovered Creature #${creature.id}`}
                                      fill
                                      className="object-contain rounded-lg"
                                      priority
                                    />
                                    {/* Animated overlays for discovered or preview cards */}
                                    {(discovered || previewMode) &&
                                      <>
                                        {/* Water creatures (004-006) */}
                                        <div className="absolute inset-0 pointer-events-none">
                                          {[...Array(6 + Math.floor(Math.random() * 5))].map((_, i) => (
                                            <div
                                              key={i}
                                              className={`droplet droplet-${creature.id}`}
                                              style={{
                                                position: 'absolute',
                                                width: '6px',
                                                height: '6px',
                                                backgroundColor: 'rgba(96, 165, 250, 0.5)',
                                                borderRadius: '9999px',
                                                left: `${10 + Math.random() * 80}%`,
                                                top: `${15 + Math.random() * 15}%`,
                                                '--delay': `${Math.random() * 3}s`,
                                                '--duration': `${1.8 + Number(creature.id) * 0.15}s`
                                              } as any}
                                            />
                                          ))}
                                        </div>
                                      </>
                                    }
                                    <div className="absolute top-4 left-0 right-0 flex justify-center">
                                      <div className="px-4 py-1 bg-black/20 backdrop-blur-sm border border-amber-400 rounded-lg">
                                        <p className="text-xl font-cardo text-amber-400">#{creature.id}</p>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                {(discovered || previewMode) && (
                                  <div className="achievement-card-back">
                                    <div className="relative w-full h-full">
                                      <Image
                                        src="/images/Back_card_stats.png"
                                        alt={`${creature.name} Stats`}
                                        fill
                                        className="object-contain rounded-lg"
                                        priority
                                      />
                                      <div className="absolute inset-0">
                                        <div 
                                          className="absolute text-white font-cardo text-lg text-center w-[100px]" 
                                          style={{ 
                                            top: '21%',
                                            left: '52%',
                                            transform: 'translateX(-50%) scale(var(--stat-scale, 1))',
                                            '--stat-scale': 'clamp(0.85, 0.85 + 0.15 * (100vw - 320px) / 680, 1)'
                                          } as any}
                                          data-testid={`hp-${creature.id}`}
                                        >{creature?.stats?.hp ?? 0}</div>
                                        <div 
                                          className="absolute text-white font-cardo text-lg text-center w-[100px]" 
                                          style={{ 
                                            top: '33.5%',
                                            left: '52%',
                                            transform: 'translateX(-50%) scale(var(--stat-scale, 1))',
                                            '--stat-scale': 'clamp(0.85, 0.85 + 0.15 * (100vw - 320px) / 680, 1)'
                                          } as any}
                                          data-testid={`attack-${creature.id}`}
                                        >{creature?.stats?.attack ?? 0}</div>
                                        <div 
                                          className="absolute text-white font-cardo text-lg text-center w-[100px]" 
                                          style={{ 
                                            top: '46%',
                                            left: '52%',
                                            transform: 'translateX(-50%) scale(var(--stat-scale, 1))',
                                            '--stat-scale': 'clamp(0.85, 0.85 + 0.15 * (100vw - 320px) / 680, 1)'
                                          } as any}
                                          data-testid={`defense-${creature.id}`}
                                        >{creature?.stats?.defense ?? 0}</div>
                                        <div 
                                          className="absolute text-white font-cardo text-lg text-center w-[100px]" 
                                          style={{ 
                                            top: '58.5%',
                                            left: '52%',
                                            transform: 'translateX(-50%) scale(var(--stat-scale, 1))',
                                            '--stat-scale': 'clamp(0.85, 0.85 + 0.15 * (100vw - 320px) / 680, 1)'
                                          } as any}
                                          data-testid={`speed-${creature.id}`}
                                        >{creature?.stats?.speed ?? 0}</div>
                                        <div 
                                          className="absolute text-white font-cardo text-lg text-center w-[100px]" 
                                          style={{ 
                                            top: '71%',
                                            left: '52%',
                                            transform: 'translateX(-50%) scale(var(--stat-scale, 1))',
                                            '--stat-scale': 'clamp(0.85, 0.85 + 0.15 * (100vw - 320px) / 680, 1)'
                                          } as any}
                                          data-testid={`type-${creature.id}`}
                                        >{creature?.stats?.type ?? 'Unknown'}</div>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                    </div>

                    {/* Row 4: Nature creatures (007-009) */}
                    <div className="col-span-full grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
                      {creatures
                        .filter(creature => ['007', '008', '009'].includes(creature.id))
                        .map((creature) => {
                          const discovered = isCreatureDiscovered(creature.id);
                          const showCard = discovered || previewMode;
                          return (
                            <div
                              key={creature.id}
                              className={`achievement-card ${discovered ? 'discovered' : ''}`}
                            >
                              <div className="achievement-card-content">
                                <div className="achievement-card-front">
                                  <div className="relative w-full h-full">
                                    <Image
                                      src={showCard ? `/images/creatures/${creature.id}.png` : '/images/undiscovered.png'}
                                      alt={showCard ? creature.name : `Undiscovered Creature #${creature.id}`}
                                      fill
                                      className="object-contain rounded-lg"
                                      priority
                                    />
                                    {/* Animated overlays for discovered or preview cards */}
                                    {(discovered || previewMode) &&
                                      <>
                                        {/* Nature creatures (007-009) */}
                                        {['007', '008', '009'].includes(creature.id) && (
                                          <div className="absolute inset-0 pointer-events-none">
                                            {[...Array(4 + Math.floor(Math.random() * 4))].map((_, i) => (
                                              <div
                                                key={i}
                                                className={`leaf leaf-${creature.id}`}
                                                style={{
                                                  position: 'absolute',
                                                  width: '11px',
                                                  height: '11px',
                                                  backgroundColor: 'rgba(74, 222, 128, 0.5)',
                                                  left: `${10 + Math.random() * 80}%`,
                                                  top: `${25 + Math.random() * 20}%`,
                                                  '--delay': `${Math.random() * 4}s`,
                                                  '--duration': `${2.5 + Number(creature.id) * 0.25}s`
                                                } as any}
                                              />
                                            ))}
                                          </div>
                                        )}
                                      </>
                                    }
                                    <div className="absolute top-4 left-0 right-0 flex justify-center">
                                      <div className="px-4 py-1 bg-black/20 backdrop-blur-sm border border-amber-400 rounded-lg">
                                        <p className="text-xl font-cardo text-amber-400">#{creature.id}</p>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                {(discovered || previewMode) && (
                                  <div className="achievement-card-back">
                                    <div className="relative w-full h-full">
                                      <Image
                                        src="/images/Back_card_stats.png"
                                        alt={`${creature.name} Stats`}
                                        fill
                                        className="object-contain rounded-lg"
                                        priority
                                      />
                                      <div className="absolute inset-0">
                                        <div 
                                          className="absolute text-white font-cardo text-lg text-center w-[100px]" 
                                          style={{ 
                                            top: '21%',
                                            left: '52%',
                                            transform: 'translateX(-50%) scale(var(--stat-scale, 1))',
                                            '--stat-scale': 'clamp(0.85, 0.85 + 0.15 * (100vw - 320px) / 680, 1)'
                                          } as any}
                                          data-testid={`hp-${creature.id}`}
                                        >{creature.stats.hp}</div>
                                        <div 
                                          className="absolute text-white font-cardo text-lg text-center w-[100px]" 
                                          style={{ 
                                            top: '33.5%',
                                            left: '52%',
                                            transform: 'translateX(-50%) scale(var(--stat-scale, 1))',
                                            '--stat-scale': 'clamp(0.85, 0.85 + 0.15 * (100vw - 320px) / 680, 1)'
                                          } as any}
                                          data-testid={`attack-${creature.id}`}
                                        >{creature.stats.attack}</div>
                                        <div 
                                          className="absolute text-white font-cardo text-lg text-center w-[100px]" 
                                          style={{ 
                                            top: '46%',
                                            left: '52%',
                                            transform: 'translateX(-50%) scale(var(--stat-scale, 1))',
                                            '--stat-scale': 'clamp(0.85, 0.85 + 0.15 * (100vw - 320px) / 680, 1)'
                                          } as any}
                                          data-testid={`defense-${creature.id}`}
                                        >{creature.stats.defense}</div>
                                        <div 
                                          className="absolute text-white font-cardo text-lg text-center w-[100px]" 
                                          style={{ 
                                            top: '58.5%',
                                            left: '52%',
                                            transform: 'translateX(-50%) scale(var(--stat-scale, 1))',
                                            '--stat-scale': 'clamp(0.85, 0.85 + 0.15 * (100vw - 320px) / 680, 1)'
                                          } as any}
                                          data-testid={`speed-${creature.id}`}
                                        >{creature.stats.speed}</div>
                                        <div 
                                          className="absolute text-white font-cardo text-lg text-center w-[100px]" 
                                          style={{ 
                                            top: '71%',
                                            left: '52%',
                                            transform: 'translateX(-50%) scale(var(--stat-scale, 1))',
                                            '--stat-scale': 'clamp(0.85, 0.85 + 0.15 * (100vw - 320px) / 680, 1)'
                                          } as any}
                                          data-testid={`type-${creature.id}`}
                                        >{creature.stats.type}</div>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                    </div>

                    {/* Row 5: Stone creatures (010-012) */}
                    <div className="col-span-full grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
                      {creatures
                        .filter(creature => ['010', '011', '012'].includes(creature.id))
                        .map((creature) => {
                          const discovered = isCreatureDiscovered(creature.id);
                          const showCard = discovered || previewMode;
                          return (
                            <div
                              key={creature.id}
                              className={`achievement-card ${discovered ? 'discovered' : ''}`}
                            >
                              <div className="achievement-card-content">
                                <div className="achievement-card-front">
                                  <div className="relative w-full h-full">
                                    <Image
                                      src={showCard ? `/images/creatures/${creature.id}.png` : '/images/undiscovered.png'}
                                      alt={showCard ? creature.name : `Undiscovered Creature #${creature.id}`}
                                      fill
                                      className="object-contain rounded-lg"
                                      priority
                                    />
                                    {/* Animated overlays for discovered or preview cards */}
                                    {(discovered || previewMode) &&
                                      <>
                                        {/* Stone creatures (010-012) */}
                                        {['010', '011', '012'].includes(creature.id) && (
                                          <div className="absolute inset-0 pointer-events-none">
                                            {[...Array(8 + Math.floor(Math.random() * 4))].map((_, i) => (
                                              <div
                                                key={i}
                                                className={`pebble pebble-${creature.id}`}
                                                style={{
                                                  position: 'absolute',
                                                  width: '8px',
                                                  height: '8px',
                                                  backgroundColor: '#8B7355',
                                                  borderRadius: '2px',
                                                  left: `${10 + Math.random() * 80}%`,
                                                  top: `${20 + Math.random() * 40}%`,
                                                  '--delay': `${Math.random() * 3}s`,
                                                  '--duration': `${2 + Number(creature.id.slice(-1)) * 0.2}s`
                                                } as any}
                                              />
                                            ))}
                                          </div>
                                        )}
                                      </>
                                    }
                                    <div className="absolute top-4 left-0 right-0 flex justify-center">
                                      <div className="px-4 py-1 bg-black/20 backdrop-blur-sm border border-amber-400 rounded-lg">
                                        <p className="text-xl font-cardo text-amber-400">#{creature.id}</p>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                {(discovered || previewMode) && (
                                  <div className="achievement-card-back">
                                    <div className="relative w-full h-full">
                                      <Image
                                        src="/images/Back_card_stats.png"
                                        alt={`${creature.name} Stats`}
                                        fill
                                        className="object-contain rounded-lg"
                                        priority
                                      />
                                      <div className="absolute inset-0">
                                        <div 
                                          className="absolute text-white font-cardo text-lg text-center w-[100px]" 
                                          style={{ 
                                            top: '21%',
                                            left: '52%',
                                            transform: 'translateX(-50%) scale(var(--stat-scale, 1))',
                                            '--stat-scale': 'clamp(0.85, 0.85 + 0.15 * (100vw - 320px) / 680, 1)'
                                          } as any}
                                          data-testid={`hp-${creature.id}`}
                                        >{creature.stats.hp}</div>
                                        <div 
                                          className="absolute text-white font-cardo text-lg text-center w-[100px]" 
                                          style={{ 
                                            top: '33.5%',
                                            left: '52%',
                                            transform: 'translateX(-50%) scale(var(--stat-scale, 1))',
                                            '--stat-scale': 'clamp(0.85, 0.85 + 0.15 * (100vw - 320px) / 680, 1)'
                                          } as any}
                                          data-testid={`attack-${creature.id}`}
                                        >{creature.stats.attack}</div>
                                        <div 
                                          className="absolute text-white font-cardo text-lg text-center w-[100px]" 
                                          style={{ 
                                            top: '46%',
                                            left: '52%',
                                            transform: 'translateX(-50%) scale(var(--stat-scale, 1))',
                                            '--stat-scale': 'clamp(0.85, 0.85 + 0.15 * (100vw - 320px) / 680, 1)'
                                          } as any}
                                          data-testid={`defense-${creature.id}`}
                                        >{creature.stats.defense}</div>
                                        <div 
                                          className="absolute text-white font-cardo text-lg text-center w-[100px]" 
                                          style={{ 
                                            top: '58.5%',
                                            left: '52%',
                                            transform: 'translateX(-50%) scale(var(--stat-scale, 1))',
                                            '--stat-scale': 'clamp(0.85, 0.85 + 0.15 * (100vw - 320px) / 680, 1)'
                                          } as any}
                                          data-testid={`speed-${creature.id}`}
                                        >{creature.stats.speed}</div>
                                        <div 
                                          className="absolute text-white font-cardo text-lg text-center w-[100px]" 
                                          style={{ 
                                            top: '71%',
                                            left: '52%',
                                            transform: 'translateX(-50%) scale(var(--stat-scale, 1))',
                                            '--stat-scale': 'clamp(0.85, 0.85 + 0.15 * (100vw - 320px) / 680, 1)'
                                          } as any}
                                          data-testid={`type-${creature.id}`}
                                        >{creature.stats.type}</div>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                    </div>

                    {/* Preview mode switch */}
                    <div className="col-span-full flex items-center justify-center gap-4 mt-8 pb-8">
                      <Switch
                        id="preview-mode"
                        checked={previewMode}
                        onCheckedChange={setPreviewMode}
                        className="data-[state=checked]:bg-amber-500"
                      />
                      <Label htmlFor="preview-mode" className="font-cardo text-amber-400">
                        Preview All Cards
                      </Label>
                    </div>
                  </>
                ) : (
                  // Regular achievement cards
                  getAchievementsByCategory(category.id).map((achievement) => (
                    <div
                      key={achievement.id}
                      className={`achievement-card ${achievement.completed ? 'discovered' : ''}`}
                    >
                      <div className="achievement-card-content">
                        <div className="achievement-card-front">
                          <div className="p-6">
                            <h3 className="text-xl font-cardo mb-2">{achievement.name}</h3>
                            <p className="text-sm opacity-75 font-cardo mb-4">
                              {achievement.description}
                            </p>
                            <div className="space-y-2">
                              <div className="w-full bg-gray-800 rounded-full h-2">
                                <div
                                  className="bg-amber-500 h-2 rounded-full transition-all"
                                  style={{
                                    width: `${(achievement.progress / achievement.target) * 100}%`,
                                  }}
                                />
                              </div>
                              <p className="text-sm text-right">
                                {achievement.progress} / {achievement.target}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="achievement-card-back">
                          <div className="p-6">
                            <h3 className="text-xl font-cardo mb-4">Rewards</h3>
                            <div className="space-y-2">
                              <div className="flex justify-between">
                                <span className="font-cardo">Gold</span>
                                <span>{achievement.rewards.gold}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="font-cardo">Experience</span>
                                <span>{achievement.rewards.experience}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>
      <style jsx>{`
        @keyframes pebble-fall {
          0% {
            transform: translateY(-20px) rotate(0deg);
            opacity: 0;
          }
          20% {
            opacity: 1;
          }
          100% {
            transform: translateY(100px) rotate(360deg);
            opacity: 0;
          }
        }

        .pebble {
          filter: blur(0.5px);
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
          animation: pebble-fall var(--duration) infinite;
          animation-delay: var(--delay);
        }

        @keyframes spark {
          0% {
            transform: translateY(0) scale(1);
            opacity: 1;
          }
          100% {
            transform: translateY(-100px) scale(0);
            opacity: 0;
          }
        }

        @keyframes droplet {
          0% {
            transform: translateY(-20px) scale(1);
            opacity: 0;
          }
          50% {
            opacity: 1;
          }
          100% {
            transform: translateY(100px) scale(0.5);
            opacity: 0;
          }
        }

        @keyframes leaf {
          0% {
            transform: translateX(0) translateY(0) rotate(45deg);
            opacity: 0;
          }
          50% {
            opacity: 1;
          }
          100% {
            transform: translateX(50px) translateY(100px) rotate(225deg);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
} 