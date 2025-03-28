"use client"

import { useState } from "react"
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

export function WeeklyProgressChart() {
  // Sample data for the chart
  const data = [
    { name: "Mon", tasks: 12, xp: 120, completedTasks: 10 },
    { name: "Tue", tasks: 15, xp: 150, completedTasks: 13 },
    { name: "Wed", tasks: 8, xp: 80, completedTasks: 7 },
    { name: "Thu", tasks: 10, xp: 100, completedTasks: 9 },
    { name: "Fri", tasks: 18, xp: 180, completedTasks: 15 },
    { name: "Sat", tasks: 20, xp: 200, completedTasks: 18 },
    { name: "Sun", tasks: 16, xp: 160, completedTasks: 14 },
  ]

  const [activeMetric, setActiveMetric] = useState<"tasks" | "xp">("tasks")

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end gap-2">
        <button
          className={`text-xs px-2 py-1 rounded-md ${
            activeMetric === "tasks" ? "bg-amber-900/50 text-white" : "text-muted-foreground"
          }`}
          onClick={() => setActiveMetric("tasks")}
        >
          Tasks
        </button>
        <button
          className={`text-xs px-2 py-1 rounded-md ${
            activeMetric === "xp" ? "bg-amber-900/50 text-white" : "text-muted-foreground"
          }`}
          onClick={() => setActiveMetric("xp")}
        >
          XP
        </button>
      </div>

      <div className="h-64">
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
      </div>
    </div>
  )
}

