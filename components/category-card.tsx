import { ArrowRight } from "lucide-react"
import Link from "next/link"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"

interface CategoryCardProps {
  name: string
  description: string
  progress: number
  level: number
  icon: string
  color: string
  tasks?: Array<{
    id: number
    name: string
    icon: string
    completed: boolean
    category: string
  }>
  isSelected?: boolean
  className?: string
}

export function CategoryCard({
  name,
  description,
  progress,
  level,
  icon,
  color,
  tasks = [], // Provide a default empty array to prevent mapping errors
  isSelected = false,
  className,
}: CategoryCardProps) {
  // Calculate completed tasks
  const completedTasks = tasks ? tasks.filter((task) => task.completed).length : 0
  const totalTasks = tasks ? tasks.length : 0

  return (
    <Card 
      className={cn(
        "relative overflow-hidden border-amber-800/20 transition-all duration-200",
        isSelected && "ring-2 ring-amber-500",
        className
      )}
      aria-label={`${name}-category-card`}
    >
      <div className={`h-1 w-full bg-gradient-to-r ${color}`}></div>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="text-2xl">{icon}</div>
            <h3 className="font-medium">{name}</h3>
          </div>
          <div className="text-xs font-medium bg-amber-900/30 px-2 py-1 rounded-full">Level {level}</div>
        </div>
        <p className="text-xs text-muted-foreground mb-3">{description}</p>
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span>Progress</span>
            <span>{progress}%</span>
          </div>
          <Progress value={progress} className="h-1.5" />
        </div>
        {tasks && tasks.length > 0 && (
          <div className="mt-3">
            <div className="text-xs text-muted-foreground mb-1">
              Tasks: {completedTasks}/{totalTasks}
            </div>
            <div className="flex flex-wrap gap-1">
              {tasks.slice(0, 3).map((task) => (
                <div
                  key={task.id}
                  className={`text-xs px-1.5 py-0.5 rounded-sm ${
                    task.completed ? "bg-green-900/20 text-green-400" : "bg-gray-800 text-muted-foreground"
                  }`}
                >
                  {task.icon} {task.name}
                </div>
              ))}
              {tasks.length > 3 && (
                <div className="text-xs px-1.5 py-0.5 rounded-sm bg-gray-800 text-muted-foreground">
                  +{tasks.length - 3} more
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="p-0">
        <Link href={`/categories/${name.toLowerCase()}`} className="w-full">
          <div className="flex items-center justify-center py-2 text-xs font-medium hover:bg-amber-900/20 transition-colors">
            View Details
            <ArrowRight className="ml-1 h-3 w-3" />
          </div>
        </Link>
      </CardFooter>
    </Card>
  )
}

