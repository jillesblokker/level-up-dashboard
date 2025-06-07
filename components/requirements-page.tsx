import React from 'react';

export default function RequirementsPage() {
  const requirements = [
    // Quests & Progression
    'Users can add, edit, and check off daily quests to track habits.',
    'Completing quests awards gold and experience.',
    'New quest types can be created and managed.',

    // Realm & Map
    'Gold can be used to buy and place tiles on the realm map.',
    'The user can move their character on the map.',
    'Mystery tiles trigger events: city, town, dungeon, monster, empty, or treasure.',

    // Towns & Cities
    'Towns and cities are auto-named in a medieval RPG style.',
    'Cities have buildings: Tavern, Castle, Merchant, Temple, Stable.',
    'Towns have: Tavern, Stable, Merchant.',

    // Buildings & Shops
    'Each building has a dedicated page for buying items.',

    // Achievements & Milestones
    'Users unlock achievements for actions (e.g., placing/destroying tiles, completing milestones).',
    'Milestones can be checked off, tracked, and synced.',
    'Achievement 104: Dream big (hint: complete a major milestone).',
    'Achievement 105: Great achievement (hint: complete all default milestones).',
    'Achievement 106: ??? (hint: check off a hidden milestone).',

    // Accessibility & UX
    'All interactive elements have ARIA labels and follow accessibility rules.',
    'Cards, grids, and sections use semantic HTML and ARIA attributes.',

    // State Management & Persistence
    'Local storage fallback for offline progress.',
    'Supabase sync for persistent data.',

    // Log Center
    'All logs are viewable in a centralized log center accessible from the account menu.',
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