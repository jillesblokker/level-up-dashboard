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
  // Fire Creatures
  { id: "001", name: "Flamio", description: "A fiery creature awakened by the destruction of forests.", unlockHint: "Destroy 1 forest tile" },
  { id: "002", name: "Embera", description: "A more powerful fire entity born from continued forest destruction.", unlockHint: "Destroy 5 forest tiles" },
  { id: "003", name: "Vulcana", description: "The ultimate fire creature, master of forest destruction.", unlockHint: "Destroy 10 forest tiles" },
  // Grass Creatures
  { id: "007", name: "Leaf", description: "A small grass creature that appears when planting new forests.", unlockHint: "Place 1 forest tile" },
  { id: "008", name: "Oaky", description: "A stronger forest guardian, protector of growing woodlands.", unlockHint: "Place 5 forest tiles" },
  { id: "009", name: "Seqoio", description: "The mighty forest spirit, overseer of vast woodlands.", unlockHint: "Place 10 forest tiles" },
  // Water Creatures
  { id: "004", name: "Dolphio", description: "A playful water creature that appears when expanding water territories.", unlockHint: "Place 1 water tile" },
  { id: "005", name: "Divero", description: "A more experienced water dweller, guardian of expanding waters.", unlockHint: "Place 5 water tiles" },
  { id: "006", name: "Flippur", description: "The supreme water creature, master of vast water territories.", unlockHint: "Place 10 water tiles" },
  // Rock Creatures
  { id: "010", name: "Rockie", description: "A small rock creature that emerges from destroyed mountains.", unlockHint: "Destroy 1 mountain tile" },
  { id: "011", name: "Buldour", description: "A stronger mountain spirit, born from continued destruction.", unlockHint: "Destroy 5 mountain tiles" },
  { id: "012", name: "Montano", description: "The ultimate mountain creature, master of destroyed peaks.", unlockHint: "Destroy 10 mountain tiles" },
  // Ice Creatures
  { id: "013", name: "Icey", description: "A small ice creature that appears in frozen territories.", unlockHint: "Place 1 ice tile" },
  { id: "014", name: "Blizzey", description: "A powerful ice spirit, master of frozen landscapes.", unlockHint: "Place 5 ice tiles" },
  { id: "015", name: "Hailey", description: "The supreme ice creature, ruler of vast frozen realms.", unlockHint: "Place 10 ice tiles" },
  // Electric Creatures
  { id: "016", name: "Sparky", description: "An electric creature that appears near city power sources.", unlockHint: "Destroy 1 water tile" },
  { id: "017", name: "Boulty", description: "A stronger electric being, drawn to urban development.", unlockHint: "Destroy 5 water tiles" },
  { id: "018", name: "Voulty", description: "The ultimate electric creature, master of city networks.", unlockHint: "Destroy 10 water tiles" },
  // Dragon Creatures
  { id: "101", name: "Drakon", description: "A legendary dragon awakened by great achievements.", unlockHint: "Complete 100 quests" },
  { id: "102", name: "Fireon", description: "A mighty dragon drawn to exceptional accomplishments.", unlockHint: "Complete 500 quests" },
  { id: "103", name: "Valerion", description: "The supreme dragon lord, master of all realms.", unlockHint: "Complete 1000 quests" },
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
    </div>
  );
} 