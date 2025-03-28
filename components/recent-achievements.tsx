import { Award, Calendar, Trophy } from "lucide-react"

export function RecentAchievements() {
  // Sample achievements data
  const achievements = [
    {
      id: 1,
      title: "100 Push-ups Club",
      description: "Completed 100 push-ups in a single day",
      date: "Today",
      icon: <Trophy className="h-8 w-8 text-yellow-500" />,
      category: "Might",
    },
    {
      id: 2,
      title: "Knowledge Seeker",
      description: "Read for 30 days in a row",
      date: "Yesterday",
      icon: <Award className="h-8 w-8 text-blue-500" />,
      category: "Wisdom",
    },
    {
      id: 3,
      title: "Early Bird",
      description: "Woke up before 7 AM for 5 days in a row",
      date: "3 days ago",
      icon: <Calendar className="h-8 w-8 text-green-500" />,
      category: "Resilience",
    },
  ]

  return (
    <div className="space-y-4">
      {achievements.map((achievement) => (
        <div key={achievement.id} className="flex items-start gap-3">
          <div className="flex-shrink-0 p-1 bg-gray-800 rounded-md">{achievement.icon}</div>
          <div>
            <h4 className="font-medium">{achievement.title}</h4>
            <p className="text-sm text-muted-foreground">{achievement.description}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-amber-500">{achievement.category}</span>
              <span className="text-xs text-muted-foreground">{achievement.date}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

