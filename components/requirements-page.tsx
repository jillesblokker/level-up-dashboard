import React from 'react';

export default function RequirementsPage() {
  const requirements = [
    'User should be able to add daily quests and easily check them off to track his habits.',
    'Quest give you gold and exp.',
    'Gold can be used to buy tiles.',
    'Tiles can be placed on the realm map.',
    'The user can move his character on the realm map.',
    'When user character moves into a mystery tile there are a few events (Discovered: a city, a town, a dungeon, a monster encounter, a grass tile basically the empty version of finding nothing, or a treasure chest with a random gift like 25-250 gold the higher the more rare the outcome of a lot of gold.',
    'When you discover a town or city is should have an auto name in the medieval rpg style.',
    'In a city you can visit different buildings (Tavern, Castle, Merchant, temple and the stable.',
    'In a town you only have the buildings tavern stable and merchant.',
    'For each building you have a separate page where you can buy stuff.',
  ];

  return (
    <div className="requirements-page">
      <h1 className="text-3xl font-bold mb-4">Project Requirements</h1>
      <ul className="list-disc pl-5">
        {requirements.map((req, index) => (
          <li key={index} className="mb-2">{req}</li>
        ))}
      </ul>
    </div>
  );
} 