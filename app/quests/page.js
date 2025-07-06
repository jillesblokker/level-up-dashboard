"use client";
import { useEffect, useState } from 'react';
import { QuestItem } from './QuestItem';

export default function QuestsPage() {
  const [quests, setQuests] = useState([]);
  const [loading, setLoading] = useState(true);
  const userId = "user_2z5XXhrBfLdbU0P6AUCBco0CJWC"; // Use your actual userId

  useEffect(() => {
    async function fetchQuests() {
      try {
        const response = await fetch(`/api-quests-static?userId=${userId}`);
        const data = await response.json();
        setQuests(data.quests || data || []);
      } catch (error) {
        console.error('Error fetching quests:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchQuests();
  }, []);

  return (
    <div className="quests-container">
      <h1>Quests</h1>
      {loading ? (
        <p>Loading quests...</p>
      ) : (
        <div className="quests-list">
          {quests.map(quest => (
            <QuestItem 
              key={quest.id} 
              quest={quest} 
              userId={userId}
              onQuestToggled={(questId, completed) => {
                setQuests(prevQuests => prevQuests.map(q => 
                  q.id === questId ? {...q, completed} : q
                ));
              }} 
            />
          ))}
        </div>
      )}
    </div>
  );
} 