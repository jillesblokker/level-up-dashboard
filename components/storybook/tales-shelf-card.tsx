'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BookOpen, Sparkles, Compass, CheckCircle2, Trophy } from 'lucide-react';
import { STORY_ADVENTURES } from './stories-data';
import { StoryAdventure, getCompletedStories, CompletedStoryRecord } from '@/lib/storybook-manager';
import { StorybookModal } from './storybook-modal';

export function TalesShelfCard() {
  const [completedRecords, setCompletedRecords] = useState<CompletedStoryRecord[]>([]);
  const [activeStory, setActiveStory] = useState<StoryAdventure | null>(null);

  useEffect(() => {
    const refreshRecords = () => {
      setCompletedRecords(getCompletedStories());
    };

    refreshRecords();
    window.addEventListener('thrivehaven_story_completed', refreshRecords);
    return () => {
      window.removeEventListener('thrivehaven_story_completed', refreshRecords);
    };
  }, []);

  const completedIds = completedRecords.map(r => r.storyId);

  return (
    <Card className="bg-gradient-to-br from-[#120d09] via-zinc-950 to-zinc-950 border-amber-900/40 shadow-xl overflow-hidden font-serif">
      <CardHeader className="p-5 pb-3 border-b border-amber-900/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-amber-400">
            <BookOpen className="w-5 h-5" />
            <CardTitle className="text-lg font-bold font-serif text-amber-200">
              Tales of the realm
            </CardTitle>
          </div>
          <Badge variant="outline" className="border-amber-500/50 text-amber-300 bg-amber-950/40 text-xs font-mono">
            {completedRecords.length} / {STORY_ADVENTURES.length} Unlocked
          </Badge>
        </div>
        <CardDescription className="text-xs text-zinc-400 font-sans mt-0.5">
          Interactive creature fables inspired by legendary board games. Shape stories and strengthen real-life virtues.
        </CardDescription>
      </CardHeader>

      <CardContent className="p-4 sm:p-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {STORY_ADVENTURES.map(story => {
            const isCompleted = completedIds.includes(story.id);
            const record = completedRecords.find(r => r.storyId === story.id);

            return (
              <div
                key={story.id}
                onClick={() => setActiveStory(story)}
                className="group relative p-4 rounded-xl border border-amber-900/40 bg-zinc-950/80 hover:border-amber-500/60 hover:shadow-[0_0_15px_rgba(245,158,11,0.2)] transition-all cursor-pointer flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-mono uppercase font-bold text-amber-400 bg-amber-950/70 border border-amber-600/30 px-2 py-0.5 rounded-full">
                      {story.storyNumber}
                    </span>
                    {isCompleted && (
                      <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-mono font-bold">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Read
                      </span>
                    )}
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="relative w-12 h-12 rounded-xl bg-zinc-900 border border-amber-500/40 overflow-hidden shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                      <Image
                        src={story.avatarImage}
                        alt={story.title}
                        fill
                        className="object-contain p-1"
                        unoptimized
                      />
                    </div>
                    <div className="space-y-0.5">
                      <h4 className="text-sm font-bold text-zinc-100 font-serif group-hover:text-amber-300 transition-colors line-clamp-1">
                        {story.title}
                      </h4>
                      <p className="text-[11px] text-zinc-400 font-sans line-clamp-2 leading-relaxed">
                        {story.narrativeText.slice(0, 90)}…
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-2.5 border-t border-zinc-900 flex items-center justify-between text-xs">
                  <span className="text-[10px] text-zinc-500 font-mono flex items-center gap-1">
                    <Compass className="w-3 h-3 text-amber-500/70" /> {story.locationName.split('•')[0]}
                  </span>
                  <span className="text-[11px] text-amber-400 font-mono font-semibold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                    {isCompleted ? 'Reread story 📜' : 'Read tale 🪶'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>

      <StorybookModal
        isOpen={!!activeStory}
        onClose={() => setActiveStory(null)}
        story={activeStory}
      />
    </Card>
  );
}
