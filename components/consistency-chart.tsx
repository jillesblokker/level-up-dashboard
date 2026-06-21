"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export function ConsistencyChart() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const data = [
    { name: 'Mon', quests: 2 },
    { name: 'Tue', quests: 3 },
    { name: 'Wed', quests: 2 },
    { name: 'Thu', quests: 4 },
    { name: 'Fri', quests: 5 },
    { name: 'Sat', quests: 4 },
    { name: 'Sun', quests: 6 },
  ];

  if (!isMounted) {
    return (
      <Card className="border-amber-900/30 bg-zinc-950 overflow-hidden shadow-[0_0_15px_rgba(245,158,11,0.05)]">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-bold text-amber-500 font-medieval tracking-wide">7-Day Consistency</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[200px] w-full mt-4 flex items-center justify-center text-zinc-600">
            Loading...
          </div>
        </CardContent>
      </Card>
    )
  }

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
