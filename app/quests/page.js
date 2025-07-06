"use client";
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui/tabs';
import { Milestones } from '../../components/milestones';
import RiddleChallenge from '../../components/riddle-challenge';
import DungeonChallenge from '../../components/dungeon-challenge';
import DailyQuests from '../../components/daily-quests';
import Image from 'next/image';

export default function QuestsPage() {
  return (
    <div className="quests-container">
      {/* Cover/Header Image */}
      <div className="w-full h-48 relative mb-6">
        <Image
          src="/images/quests-header.jpg"
          alt="Quests Cover"
          fill
          className="object-cover rounded-lg"
          priority
        />
        <div className="absolute inset-0 bg-black/40 rounded-lg flex items-center justify-center">
          <h1 className="text-4xl font-bold text-amber-200 drop-shadow-lg">Quests</h1>
        </div>
      </div>
      <Tabs defaultValue="quests" className="w-full">
        <TabsList aria-label="quest-tabs" className="mb-4">
          <TabsTrigger value="quests" aria-label="quests-tab">Quests</TabsTrigger>
          <TabsTrigger value="challenges" aria-label="challenges-tab">Challenges</TabsTrigger>
          <TabsTrigger value="milestones" aria-label="milestones-tab">Milestones</TabsTrigger>
        </TabsList>
        <TabsContent value="quests">
          <DailyQuests />
        </TabsContent>
        <TabsContent value="challenges">
          <div className="space-y-6">
            <RiddleChallenge />
            <DungeonChallenge />
          </div>
        </TabsContent>
        <TabsContent value="milestones">
          <Milestones />
        </TabsContent>
      </Tabs>
    </div>
  );
} 