"use client";

import { Card } from "@/components/ui/card";

export default function EventsPage() {
  return (
    <div className="container mx-auto p-8">
      <h1 className="text-4xl font-bold mb-8">Event System Guide</h1>
      
      <div className="grid gap-8">
        <Card className="p-6">
          <h2 className="text-2xl font-semibold mb-4">Mystery Events</h2>
          <p className="mb-4">Mystery events are random encounters that can occur when exploring mystery tiles on the map. These events can provide various rewards and challenges.</p>
          
          <h3 className="text-xl font-semibold mb-2">Event Types</h3>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li><span className="font-semibold">Treasure Events:</span> Discover valuable items, gold, or artifacts</li>
            <li><span className="font-semibold">Battle Events:</span> Encounter creatures that you can battle for experience and rewards</li>
            <li><span className="font-semibold">Quest Events:</span> Receive special missions that can lead to unique rewards</li>
            <li><span className="font-semibold">Trade Events:</span> Opportunities to trade resources or items</li>
            <li><span className="font-semibold">Blessing Events:</span> Receive temporary or permanent bonuses</li>
            <li><span className="font-semibold">Curse Events:</span> Face challenges or temporary debuffs</li>
            <li><span className="font-semibold">Riddle Events:</span> Solve puzzles for special rewards</li>
          </ul>
        </Card>

        <Card className="p-6">
          <h2 className="text-2xl font-semibold mb-4">Rewards</h2>
          <div className="space-y-4">
            <div>
              <h3 className="text-xl font-semibold mb-2">Gold Rewards</h3>
              <p>Earn gold that can be used to purchase tiles, items, and upgrades.</p>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">Experience Rewards</h3>
              <p>Gain experience points to level up your character and unlock new abilities.</p>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">Item Rewards</h3>
              <ul className="list-disc pl-6 space-y-1">
                <li>Scrolls: Contain knowledge and can unlock achievements</li>
                <li>Artifacts: Rare items with special properties</li>
                <li>Books: Provide lore and can unlock new features</li>
                <li>Resources: Used for building and crafting</li>
              </ul>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-2xl font-semibold mb-4">Battle System</h2>
          <div className="space-y-4">
            <p>When encountering a creature in a battle event:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Each creature has unique stats and abilities</li>
              <li>Victory rewards include experience, gold, and sometimes special items</li>
              <li>Defeat results in losing some gold but you can try again</li>
              <li>Some battles can lead to creature discoveries for your collection</li>
            </ul>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-2xl font-semibold mb-4">Tips for Events</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>Always check your inventory before making choices in events</li>
            <li>Some events require specific items to unlock the best rewards</li>
            <li>Battle events can be retried if you're defeated</li>
            <li>Mystery tiles can be revisited after some time for new events</li>
            <li>Certain choices can affect your kingdom's stats</li>
            <li>Some events are part of larger questlines</li>
          </ul>
        </Card>
      </div>
    </div>
  );
} 