"use client"

import { useState } from "react"
import {
  ChevronLeft,
  ChevronRight,
  Brain,
  Trash2,
  Newspaper,
  BananaIcon as Mango,
  Bed,
  PenTool,
  Filter,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface Activity {
  name: string;
  icon: JSX.Element;
  total: number;
  days: number[];
  color: string;
}

interface ActivityData {
  [key: string]: Activity;
}

export function ActivityCalendar() {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [activeFilters, setActiveFilters] = useState<string[]>([])

  // Generate calendar data based on the uploaded image
  const generateCalendarData = (): Activity[] => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()

    // Sample data based on the image
    const activityData: ActivityData = {
      // Mindpal - lots of activity
      mindpal: {
        name: "Mindpal",
        icon: <Brain className="h-5 w-5 text-purple-500" />,
        total: 233,
        days: [9, 10, 11, 12, 13, 14, 15, 16],
        color: "bg-purple-500",
      },
      // Trashbin at the road - less activity
      trashbin: {
        name: "Trashbin at the road",
        icon: <Trash2 className="h-5 w-5 text-green-500" />,
        total: 22,
        days: [15],
        color: "bg-green-500",
      },
      // Paper on the road - less activity
      paper: {
        name: "Paper on the road",
        icon: <Newspaper className="h-5 w-5 text-blue-500" />,
        total: 14,
        days: [12],
        color: "bg-blue-500",
      },
      // Mango food fill
      mango: {
        name: "Mango food fill",
        icon: <Mango className="h-5 w-5 text-yellow-500" />,
        total: 7,
        days: [5, 6],
        color: "bg-yellow-500",
      },
      // Bed laundry
      laundry: {
        name: "Bed laundry",
        icon: <Bed className="h-5 w-5 text-red-500" />,
        total: 6,
        days: [3, 4],
        color: "bg-red-500",
      },
      // 24 draw lesson
      draw: {
        name: "24 draw lesson",
        icon: <PenTool className="h-5 w-5 text-amber-500" />,
        total: 1,
        days: [1],
        color: "bg-amber-500",
      },
    }

    return Object.values(activityData)
  }

  const activities = generateCalendarData()
  const filteredActivities =
    activeFilters.length > 0 ? activities.filter((activity) => activeFilters.includes(activity.name)) : activities

  // Get days in month
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate()
  }

  // Get day of week for first day of month (0 = Sunday, 1 = Monday, etc.)
  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay()
  }

  const year = currentMonth.getFullYear()
  const month = currentMonth.getMonth()
  const daysInMonth = getDaysInMonth(year, month)
  const firstDayOfMonth = getFirstDayOfMonth(year, month)

  // Month names
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

  // Day names
  const dayNames = ["S", "M", "T", "W", "T", "F", "S"]

  // Previous month
  const prevMonth = () => {
    setCurrentMonth(new Date(year, month - 1, 1))
  }

  // Next month
  const nextMonth = () => {
    setCurrentMonth(new Date(year, month + 1, 1))
  }

  // Toggle filter
  const toggleFilter = (activityName: string) => {
    setActiveFilters((prev) => {
      if (prev.includes(activityName)) {
        return prev.filter((name) => name !== activityName)
      } else {
        return [...prev, activityName]
      }
    })
  }

  // Get last active text
  const getLastActiveText = (activity: Activity): string => {
    if (activity.days.length === 0) return "Never"

    const lastDay = Math.max(...activity.days)
    const today = new Date().getDate()

    if (lastDay === today) return "Today"
    if (lastDay === today - 1) return "Yesterday"
    return `${today - lastDay} days ago`
  }

  // Check if a day has activity for any of the filtered activities
  const hasActivityOnDay = (day: number): boolean => {
    if (activeFilters.length === 0) {
      return activities.some((activity) => activity.days.includes(day))
    }
    return filteredActivities.some((activity) => activity.days.includes(day))
  }

  // Get color for a day with activity
  const getActivityColorForDay = (day: number): string => {
    const activitiesOnDay = filteredActivities.filter((activity) => activity.days.includes(day))
    if (activitiesOnDay.length === 0) return ""
    if (activitiesOnDay.length === 1) return activitiesOnDay[0]!.color
    return "bg-gradient-to-r from-amber-500 to-purple-500" // Multiple activities
  }

  return (
    <div className="space-y-6" aria-label="activity-calendar">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-5 w-5 p-0" 
            onClick={prevMonth}
            aria-label="Previous month"
          >
            <ChevronLeft className="h-3 w-3" />
          </Button>
          <span className="text-sm">
            {year} · {monthNames[month]}
          </span>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-5 w-5 p-0" 
            onClick={nextMonth}
            aria-label="Next month"
          >
            <ChevronRight className="h-3 w-3" />
          </Button>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 gap-1" aria-label="Filter activities">
              <Filter className="h-3.5 w-3.5" />
              <span className="text-xs">Filter</span>
              {activeFilters.length > 0 && <Badge className="ml-1 h-5 px-1 text-xs">{activeFilters.length}</Badge>}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            {activities.map((activity, index) => (
              <DropdownMenuCheckboxItem
                key={index}
                checked={activeFilters.includes(activity.name)}
                onCheckedChange={() => toggleFilter(activity.name)}
                className="flex items-center gap-2"
              >
                <span className="flex items-center gap-2">
                  {activity.icon}
                  <span className="text-sm">{activity.name}</span>
                </span>
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-7 gap-1" aria-label="calendar-grid">
          {dayNames.map((day, i) => (
            <div key={i} className="text-center text-xs text-muted-foreground">
              {day}
            </div>
          ))}

          {/* Empty cells for days before the first day of month */}
          {Array.from({ length: firstDayOfMonth }).map((_, i) => (
            <div key={`empty-${i}`} className="h-8 rounded-sm bg-gray-800/20"></div>
          ))}

          {/* Calendar days */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1
            const hasActivity = hasActivityOnDay(day)
            const activityColor = getActivityColorForDay(day)

            return (
              <div
                key={`day-${day}`}
                className={`h-8 rounded-sm flex items-center justify-center text-xs ${
                  hasActivity ? activityColor + " text-white" : "bg-gray-800/50 text-muted-foreground"
                }`}
                aria-label={`Day ${day}${hasActivity ? ' with activity' : ''}`}
              >
                {day}
              </div>
            )
          })}
        </div>

        <div className="space-y-2 mt-4">
          <h3 className="text-sm font-medium">Activity Legend</h3>
          <div className="flex flex-wrap gap-3" aria-label="activity-legend">
            {activities.map((activity, index) => (
              <div key={index} className="flex items-center gap-1">
                {activity.icon}
                <span className="text-xs">
                  {activity.name} ({activity.total})
                </span>
                <span className="text-xs text-muted-foreground ml-1">{getLastActiveText(activity)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

