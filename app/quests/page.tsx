"use client"

import React, { useEffect, useState, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useSupabaseClientWithToken } from '@/lib/hooks/use-supabase-client';
import { useUser } from '@clerk/nextjs';
import { Quest } from '@/lib/quest-types';
import { gainGold } from '@/lib/gold-manager';
import { gainExperience } from '@/lib/experience-manager';
import { emitQuestCompletedWithRewards } from "@/lib/kingdom-events";
import { useToast } from '@/components/ui/use-toast';
import { Award, Coins, PlusCircle, Save, Settings, RefreshCw, Trash2, Check, X } from "lucide-react";
import { logger } from "@/lib/logger";
import { Loader2 } from "lucide-react";
import { defaultQuests } from '@/lib/quest-sample-data';
import { notificationService } from "@/lib/notification-service";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { HeaderSection } from "@/components/HeaderSection";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Milestones } from '@/components/milestones';
import { KnowledgeModal } from "@/components/category-modals/knowledge-modal";
import { ConditionModal } from "@/components/category-modals/condition-modal";
import { NutritionModal } from "@/components/category-modals/nutrition-modal";
import { useSupabaseSync } from '@/hooks/use-supabase-sync';
import { QuestService } from '@/lib/supabase-services';

export default function QuestsPage() {
  const { user } = useUser();
  const userId = user?.id;
  const { toast } = useToast();
  const [quests, setQuests] = useState<Quest[]>([]);
  const [checkedQuests, setCheckedQuests] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);

  const { supabase } = useSupabaseClientWithToken();
  const { isSignedIn } = useSupabaseSync();

  const loadInitialData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let loadedQuests: Quest[] = [];
      let loadedCheckedIds: string[] = [];

      if (isSignedIn && supabase && userId) {
        // Logged in: Fetch from Supabase
        const [questsResult, checkedResult] = await Promise.all([
          supabase.from('quest_stats').select('*').eq('user_id', userId),
          QuestService.getCheckedQuests()
        ]);
        
        if (questsResult.error) throw new Error(`Supabase quests fetch failed: ${questsResult.error.message}`);
        
        if (questsResult.data && questsResult.data.length > 0) {
            loadedQuests = questsResult.data.map(q => ({
                id: q.quest_id,
                title: q.quest_name,
                category: q.category,
                completed: q.completed,
                progress: q.progress,
                description: 'Fetched from Supabase',
                difficulty: 'easy' as const, // Default difficulty
                rewards: {
                    xp: 50, // default
                    gold: 25, // default
                },
                userId: userId || '',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            }));
        } else {
          loadedQuests = defaultQuests;
        }
        loadedCheckedIds = checkedResult;
        localStorage.setItem('quests', JSON.stringify(loadedQuests));
        localStorage.setItem('checked-quests', JSON.stringify(loadedCheckedIds));
      } else {
        // Not logged in: Fallback to localStorage
        loadedQuests = JSON.parse(localStorage.getItem('quests') || JSON.stringify(defaultQuests));
        loadedCheckedIds = JSON.parse(localStorage.getItem('checked-quests') || '[]');
      }
      
      setQuests(loadedQuests);
      setCheckedQuests(new Set(loadedCheckedIds));
    } catch (err: any) {
      setError('Failed to load quest data. Displaying cached or default data.');
      console.error(err);
      // Load from local storage as a final fallback
      const localQuests = JSON.parse(localStorage.getItem('quests') || JSON.stringify(defaultQuests));
      const localChecked = JSON.parse(localStorage.getItem('checked-quests') || '[]');
      setQuests(localQuests);
      setCheckedQuests(new Set(localChecked));
    } finally {
      setLoading(false);
    }
  }, [isSignedIn, supabase, userId]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  const handleQuestToggle = async (questId: string) => {
    const isCompleted = !checkedQuests.has(questId);
    setSyncError(null);

    // Optimistically update UI
    const newCheckedState = new Set(checkedQuests);
    if (isCompleted) {
      newCheckedState.add(questId);
    } else {
      newCheckedState.delete(questId);
    }
    setCheckedQuests(newCheckedState);
    
    // Update local storage immediately
    localStorage.setItem('checked-quests', JSON.stringify(Array.from(newCheckedState)));

    if (!isSignedIn) return;

    try {
      await QuestService.updateCheckedQuests(questId, isCompleted);
      
      const quest = quests.find(q => q.id === questId);
      if (quest) {
        await QuestService.updateQuestStats({
          quest_id: questId,
          quest_name: quest.title,
          category: quest.category,
          completed: isCompleted,
          progress: isCompleted ? 100 : 0,
          completed_at: isCompleted ? new Date().toISOString() : null,
        });

        if (isCompleted) {
            toast({ title: "Quest Completed!", description: `You earned ${quest.rewards.xp} XP and ${quest.rewards.gold} Gold!`, variant: "default" });
        }
      }
    } catch (err: any) {
      console.error("Failed to sync quest state:", err);
      setSyncError(`Failed to save quest completion: ${err.message}`);
      
      // Revert optimistic update on failure
      const revertedCheckedState = new Set(checkedQuests);
      if (isCompleted) {
          revertedCheckedState.delete(questId);
      } else {
          revertedCheckedState.add(questId);
      }
      setCheckedQuests(revertedCheckedState);
      localStorage.setItem('checked-quests', JSON.stringify(Array.from(revertedCheckedState)));

      toast({
        title: "Sync Error",
        description: `Failed to save quest completion: ${err.message}`,
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-16 w-16 animate-spin" />
      </div>
    );
  }

  const questsByCategory = quests.reduce((acc, quest) => {
    const category = quest.category || 'uncategorized';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(quest);
    return acc;
  }, {} as Record<string, Quest[]>);


  return (
    <ScrollArea className="h-full" aria-label="quests-scroll-area">
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <HeaderSection
          title="Quests"
          description="Embark on adventures, complete tasks, and earn rewards."
        />
        {syncError && (
          <div className="bg-red-800 border border-red-600 text-white p-4 rounded-md mb-4 flex justify-between items-center">
            <span>{syncError}</span>
            <Button variant="ghost" size="icon" onClick={() => setSyncError(null)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
        <Tabs defaultValue={Object.keys(questsByCategory)[0] || 'all'}>
          <TabsList>
            {Object.keys(questsByCategory).map(category => (
              <TabsTrigger key={category} value={category}>{category.charAt(0).toUpperCase() + category.slice(1)}</TabsTrigger>
            ))}
          </TabsList>
          {Object.entries(questsByCategory).map(([category, questsInCategory]) => (
            <TabsContent key={category} value={category}>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {questsInCategory.map(quest => (
                  <Card key={quest.id} className="w-full">
                    <CardHeader>
                      <CardTitle className="flex justify-between items-center">
                        {quest.title}
                        <Checkbox
                          checked={checkedQuests.has(quest.id)}
                          onCheckedChange={() => handleQuestToggle(quest.id)}
                          aria-label={`Mark quest ${quest.title} as ${checkedQuests.has(quest.id) ? 'incomplete' : 'complete'}`}
                        />
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-400 mb-2">{quest.description}</p>
                      <div className="flex justify-between items-center">
                        <Badge variant="outline">{quest.category}</Badge>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-semibold text-yellow-400">{quest.rewards.xp} XP</span>
                          <span className="text-sm font-semibold text-amber-500">{quest.rewards.gold} Gold</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </ScrollArea>
  );
}