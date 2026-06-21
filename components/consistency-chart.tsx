"use client"

import React, { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { motion } from 'framer-motion'

export function ConsistencyChart() {
  // Mock data for the last 7 days of consistency
  // In a real app, this would be computed from the user's completed quests/habits history
  const data = useMemo(() => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const today = new Date().getDay(); // 0 = Sun, 1 = Mon, etc.
    
    // Generate a satisfying upwards trend for the demo
    return Array.from({ length: 7 }).map((_, i) => {
      const dayIndex = (today - 6 + i + 7) % 7;
      return {
        name: days[dayIndex === 0 ? 6 : dayIndex - 1], // Map to Mon-Sun
        quests: Math.floor(Math.random() * 3) + 2 + (i * 0.5), // Upward trend
      }
    });
  }, []);

  return (
    <Card className="border-amber-900/30 bg-zinc-950 overflow-hidden shadow-[0_0_15px_rgba(245,158,11,0.05)]">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-bold text-amber-500 font-medieval tracking-wide">7-Day Consistency</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[200px] w-full mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" vertical={false} />
              <XAxis 
                dataKey="name" 
                stroke="#a1a1aa" 
                fontSize={12} 
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                stroke="#a1a1aa" 
                fontSize={12} 
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${value}`}
              />
              <Tooltip 
                contentStyle={{ backgroundColor: '#09090b', border: '1px solid #78350f', borderRadius: '8px' }}
                itemStyle={{ color: '#fbbf24' }}
              />
              <Line 
                type="monotone" 
                dataKey="quests" 
                stroke="#f59e0b" 
                strokeWidth={3}
                dot={{ r: 4, fill: '#f59e0b', strokeWidth: 0 }}
                activeDot={{ r: 6, fill: '#fbbf24', stroke: '#78350f', strokeWidth: 2 }}
                animationDuration={1500}
                animationEasing="ease-out"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
