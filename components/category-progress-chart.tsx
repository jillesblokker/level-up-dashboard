"use client"

import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts"

export function CategoryProgressChart() {
  // Sample data for the chart
  const data = [
    { name: "Might", value: 25, color: "#ef4444" },
    { name: "Wisdom", value: 20, color: "#3b82f6" },
    { name: "Vitality", value: 15, color: "#22c55e" },
    { name: "Dexterity", value: 12, color: "#eab308" },
    { name: "Creativity", value: 10, color: "#ec4899" },
    { name: "Resilience", value: 8, color: "#a855f7" },
    { name: "Endurance", value: 6, color: "#f97316" },
    { name: "Responsibility", value: 4, color: "#6b7280" },
  ]

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={2}
            dataKey="value"
            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            labelLine={false}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}

