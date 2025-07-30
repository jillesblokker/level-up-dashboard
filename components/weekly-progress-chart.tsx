"use client"

import { useState, useEffect } from "react"
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"
import Image from 'next/image';
import { useRouter } from 'next/navigation';

interface ChartDataPoint {
  name: string;
  tasks?: number;
  completedTasks?: number;
  gold?: number;
  xp?: number;
}

export function WeeklyProgressChart() {
  const [data, setData] = useState<ChartDataPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeMetric, setActiveMetric] = useState<'tasks' | 'xp' | 'gold'>('tasks');
  const router = useRouter();

  // Fetch data from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch quest completions from API
        const response = await fetch('/api/quests/completion');
        if (!response.ok) {
          console.error('Failed to fetch quest completions:', response.status);
          setData([]);
          return;
        }
        const questCompletions = await response.json();
        
        // Get character stats
        const characterStats = JSON.parse(localStorage.getItem('character-stats') || '{}');
        
        // Generate weekly data for the last 7 days
        const weekData: ChartDataPoint[] = [];
        const today = new Date();
        
        for (let i = 6; i >= 0; i--) {
          const date = new Date(today);
          date.setDate(date.getDate() - i);
          const dateStr = date.toISOString().slice(0, 10);
          
          // Find quest completions for this date
          const dayCompletions = questCompletions.filter((q: any) => {
            const completionDate = q.date ? new Date(q.date).toISOString().slice(0, 10) : null;
            return completionDate === dateStr;
          });
          
          const completedQuests = dayCompletions.length;
          const totalQuests = dayCompletions.length; // For now, assume all completions are total quests
          
          // Get gold and XP from character stats (simplified)
          const dayGold = characterStats.goldEarned?.[dateStr] || 0;
          const dayXp = characterStats.xpEarned?.[dateStr] || 0;
          
          weekData.push({
            name: date.toLocaleDateString('en-US', { weekday: 'short' }),
            tasks: totalQuests,
            completedTasks: completedQuests,
            gold: dayGold,
            xp: dayXp
          });
        }
        
        setData(weekData);
      } catch (error) {
        console.error('Error fetching progress data:', error);
        setData([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
    
    // Listen for data updates
    const handleDataUpdate = () => {
      fetchData();
    };
    
    window.addEventListener('quest-completed', handleDataUpdate);
    window.addEventListener('character-stats-update', handleDataUpdate);
    
    return () => {
      window.removeEventListener('quest-completed', handleDataUpdate);
      window.removeEventListener('character-stats-update', handleDataUpdate);
    };
  }, []);

  // Compute isEmpty for each metric - only show empty if there's truly no data
  const isQuestsEmpty = !isLoading && (!data || data.length === 0 || data.every(d => !d.tasks && !d.completedTasks));
  const isGoldEmpty = !isLoading && (!data || data.length === 0 || data.every(d => !d.gold));
  const isXpEmpty = !isLoading && (!data || data.length === 0 || data.every(d => !d.xp));

  let isEmpty = false;
  if (activeMetric === 'tasks') isEmpty = isQuestsEmpty;
  if (activeMetric === 'gold') isEmpty = isGoldEmpty;
  if (activeMetric === 'xp') isEmpty = isXpEmpty;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end gap-2">
        <button
          className={`text-xs px-2 py-1 rounded-md ${
            activeMetric === "tasks" ? "bg-amber-900 text-white" : "text-muted-foreground"
          }`}
          onClick={() => setActiveMetric("tasks")}
          aria-label="Show quest progress"
        >
          Quests
        </button>
        <button
          className={`text-xs px-2 py-1 rounded-md ${
            activeMetric === "gold" ? "bg-amber-900 text-white" : "text-muted-foreground"
          }`}
          onClick={() => setActiveMetric("gold")}
          aria-label="Show gold progress"
        >
          Gold
        </button>
        <button
          className={`text-xs px-2 py-1 rounded-md ${
            activeMetric === "xp" ? "bg-amber-900 text-white" : "text-muted-foreground"
          }`}
          onClick={() => setActiveMetric("xp")}
          aria-label="Show experience progress"
        >
          Experience
        </button>
      </div>

      <div className="h-64 relative rounded-lg overflow-hidden" aria-label="weekly-progress-chart">
        {isLoading ? (
          <div className="h-full flex items-center justify-center bg-black rounded-lg">
            <div className="text-white">Loading progress data...</div>
          </div>
        ) : isEmpty ? (
          <>
            <Image
              src="/images/quests-header.jpg"
              alt="No data yet"
              fill
              className="object-cover rounded-lg z-0"
              priority
              style={{ opacity: 0.7 }}
            />
            <div className="absolute inset-0 bg-black flex flex-col items-center justify-center rounded-lg z-10">
              <span className="text-2xl font-bold text-white drop-shadow mb-2">No data yet</span>
              <button
                className="mt-2 px-4 py-2 bg-amber-500 text-black rounded hover:bg-amber-600 transition text-lg font-semibold shadow"
                aria-label="Start habit building now"
                onClick={() => router.push('/quests')}
                tabIndex={0}
              >
                Start habit building now
              </button>
            </div>
          </>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            {activeMetric === "tasks" ? (
              <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#444" />
                <XAxis dataKey="name" tick={{ fill: "#888" }} axisLine={{ stroke: "#444" }} />
                <YAxis tick={{ fill: "#888" }} axisLine={{ stroke: "#444" }} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#222", border: "1px solid #444" }}
                  labelStyle={{ color: "#fff" }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="completedTasks"
                  stroke="#d97706"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                  name="Completed Tasks"
                />
              </LineChart>
            ) : activeMetric === "gold" ? (
              <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#444" />
                <XAxis dataKey="name" tick={{ fill: "#888" }} axisLine={{ stroke: "#444" }} />
                <YAxis tick={{ fill: "#888" }} axisLine={{ stroke: "#444" }} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#222", border: "1px solid #444" }}
                  labelStyle={{ color: "#fff" }}
                />
                <Bar dataKey="gold" fill="#ffd700" radius={[4, 4, 0, 0]} name="Gold Earned" />
              </BarChart>
            ) : (
              <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#444" />
                <XAxis dataKey="name" tick={{ fill: "#888" }} axisLine={{ stroke: "#444" }} />
                <YAxis tick={{ fill: "#888" }} axisLine={{ stroke: "#444" }} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#222", border: "1px solid #444" }}
                  labelStyle={{ color: "#fff" }}
                />
                <Bar dataKey="xp" fill="#eab308" radius={[4, 4, 0, 0]} name="Experience Points" />
              </BarChart>
            )}
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}

