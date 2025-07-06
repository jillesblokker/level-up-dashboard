import { useState } from 'react';

export function QuestItem({ quest, userId, onQuestToggled }) {
  const [isLoading, setIsLoading] = useState(false);
  
  const toggleQuest = async () => {
    try {
      setIsLoading(true);
      console.log('[ToggleQuest] Toggling quest:', quest.id, 'to', !quest.completed);
      
      const response = await fetch(`/api/toggle-quest?userId=${userId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          questId: quest.id,
          completed: !quest.completed,
        }),
      });
      
      if (!response.ok) {
        const text = await response.text();
        try {
          const errorData = JSON.parse(text);
          console.error('[ToggleQuest] Error:', errorData);
        } catch (e) {
          console.error('[ToggleQuest] Non-JSON response:', text);
        }
        throw new Error('Failed to toggle quest');
      }
      
      const data = await response.json();
      console.log('[ToggleQuest] Success:', data);
      
      // Call the callback to update the UI
      if (onQuestToggled) {
        onQuestToggled(quest.id, !quest.completed);
      }
    } catch (error) {
      console.error('[ToggleQuest] Error:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="quest-item">
      <h3>{quest.name}</h3>
      <p>{quest.description}</p>
      <div className="quest-details">
        <span>Category: {quest.category}</span>
        <span>Difficulty: {quest.difficulty}</span>
        {quest.xp_reward && <span>XP: {quest.xp_reward}</span>}
      </div>
      <button 
        onClick={toggleQuest} 
        disabled={isLoading}
        className={`quest-toggle-btn ${quest.completed ? 'completed' : ''}`}
      >
        {isLoading ? 'Loading...' : quest.completed ? 'Completed' : 'Mark as Complete'}
      </button>
    </div>
  );
} 