"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Image from "next/image";

const creatures = [
  {
    id: "000",
    name: "Forest Spirit",
    description: "A mystical guardian of the woodlands",
    unlockHint: "Discover and protect a sacred grove in the forest region"
  },
  {
    id: "001",
    name: "Mountain Drake",
    description: "A powerful dragon dwelling in mountain peaks",
    unlockHint: "Reach the highest mountain peak and complete the 'Peak Seeker' quest"
  },
  {
    id: "002",
    name: "Desert Wyrm",
    description: "A massive serpentine creature of the sands",
    unlockHint: "Find and explore ancient ruins in the desert region"
  },
  {
    id: "003",
    name: "Frost Giant",
    description: "An ancient being of ice and snow",
    unlockHint: "Complete the 'Frozen Throne' quest in the northern territories"
  },
  {
    id: "004",
    name: "Shadow Stalker",
    description: "A mysterious creature that lurks in darkness",
    unlockHint: "Explore mystery tiles during nighttime events"
  },
  {
    id: "005",
    name: "Crystal Golem",
    description: "A being formed from pure magical crystals",
    unlockHint: "Discover and activate all crystal shrines in the mining region"
  },
  {
    id: "006",
    name: "Storm Phoenix",
    description: "A legendary bird of lightning and thunder",
    unlockHint: "Complete the 'Storm Chaser' achievement during a thunderstorm event"
  },
  {
    id: "007",
    name: "Ancient Treant",
    description: "A wise and ancient tree guardian",
    unlockHint: "Plant and nurture a sacred tree in your kingdom"
  },
  {
    id: "008",
    name: "Sea Serpent",
    description: "A mighty creature of the deep waters",
    unlockHint: "Build a port city and complete the 'Ocean Explorer' quest line"
  },
  {
    id: "009",
    name: "Celestial Dragon",
    description: "A divine dragon from the heavens",
    unlockHint: "Collect all constellation fragments and complete the 'Stargazer' achievement"
  }
];

export default function HintsPage() {
  return (
    <div className="container mx-auto p-8">
      <h1 className="text-4xl font-bold mb-8">Creature Collection Guide</h1>
      <p className="mb-6 text-lg">Discover these mythical creatures by completing specific achievements and quests throughout your journey.</p>
      
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-24">Image</TableHead>
              <TableHead className="w-48">Name</TableHead>
              <TableHead className="w-64">Description</TableHead>
              <TableHead>How to Unlock</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {creatures.map((creature) => (
              <TableRow key={creature.id}>
                <TableCell>
                  <div className="relative w-16 h-16">
                    <Image
                      src={`/images/creatures/${creature.id}.png`}
                      alt={creature.name}
                      fill
                      className="object-contain"
                    />
                  </div>
                </TableCell>
                <TableCell className="font-medium">{creature.name}</TableCell>
                <TableCell>{creature.description}</TableCell>
                <TableCell>{creature.unlockHint}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="mt-8 p-6 bg-muted rounded-lg">
        <h2 className="text-2xl font-semibold mb-4">Additional Tips</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>Some creatures only appear during specific weather conditions or times</li>
          <li>Building certain structures in your kingdom can attract specific creatures</li>
          <li>Completing quest chains may reveal the location of rare creatures</li>
          <li>Certain items and artifacts can help in discovering or attracting creatures</li>
          <li>Keep an eye on mystery tiles as they often lead to creature encounters</li>
        </ul>
      </div>
    </div>
  );
} 