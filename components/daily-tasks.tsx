"use client"

import { useState, useEffect } from "react"
import { Check, Plus, X, Shield, Heart, Book, Apple, Brain, Sword } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface Task {
  id: string
  title: string
  completed: boolean
  category: string
  gold: number
  xp: number
}

interface DailyTasksProps {
  onTaskComplete?: (task: Task) => void
}

export function DailyTasks({ onTaskComplete }: DailyTasksProps) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [showAddTask, setShowAddTask] = useState(false)
  const [newTaskTitle, setNewTaskTitle] = useState("")
  const [newTaskCategory, setNewTaskCategory] = useState("strength")

  // Load tasks from localStorage
  useEffect(() => {
    const savedTasks = localStorage.getItem("daily-tasks")
    if (savedTasks) {
      setTasks(JSON.parse(savedTasks))
    } else {
      // Default tasks
      const defaultTasks = [
        {
          id: "1",
          title: "Complete 20 push-ups",
          completed: false,
          category: "strength",
          gold: 20,
          xp: 50,
        },
        {
          id: "2",
          title: "Run for 15 minutes",
          completed: false,
          category: "condition",
          gold: 30,
          xp: 75,
        },
        {
          id: "3",
          title: "Read a chapter of a book",
          completed: false,
          category: "knowledge",
          gold: 15,
          xp: 40,
        },
        {
          id: "4",
          title: "Drink 8 glasses of water",
          completed: false,
          category: "nutrition",
          gold: 10,
          xp: 30,
        },
        {
          id: "5",
          title: "Practice meditation for 10 minutes",
          completed: false,
          category: "mental",
          gold: 25,
          xp: 60,
        },
        {
          id: "6",
          title: "Stretch for 10 minutes",
          completed: false,
          category: "strength",
          gold: 15,
          xp: 35,
        },
        {
          id: "7",
          title: "Eat a healthy breakfast",
          completed: false,
          category: "nutrition",
          gold: 20,
          xp: 45,
        },
        {
          id: "8",
          title: "Learn a new skill for 30 minutes",
          completed: false,
          category: "knowledge",
          gold: 35,
          xp: 80,
        },
      ]
      setTasks(defaultTasks)
      localStorage.setItem("daily-tasks", JSON.stringify(defaultTasks))
    }
  }, [])

  // Save tasks to localStorage whenever they change
  useEffect(() => {
    if (tasks.length > 0) {
      localStorage.setItem("daily-tasks", JSON.stringify(tasks))
    }
  }, [tasks])

  const handleTaskToggle = (taskId: string) => {
    setTasks((prevTasks) =>
      prevTasks.map((task) => {
        if (task.id === taskId) {
          const updatedTask = { ...task, completed: !task.completed }

          // If task is being marked as completed, call the onTaskComplete callback
          if (!task.completed && onTaskComplete) {
            onTaskComplete(updatedTask)
          }

          return updatedTask
        }
        return task
      }),
    )
  }

  const handleAddTask = () => {
    if (!newTaskTitle.trim()) return

    const newTask: Task = {
      id: Date.now().toString(),
      title: newTaskTitle,
      completed: false,
      category: newTaskCategory,
      gold: Math.floor(Math.random() * 30) + 10, // Random gold between 10-40
      xp: Math.floor(Math.random() * 50) + 25, // Random XP between 25-75
    }

    setTasks((prevTasks) => [...prevTasks, newTask])
    setNewTaskTitle("")
    setShowAddTask(false)
  }

  const handleDeleteTask = (taskId: string) => {
    setTasks((prevTasks) => prevTasks.filter((task) => task.id !== taskId))
  }

  // Group tasks by category
  const tasksByCategory: Record<string, Task[]> = {}
  tasks.forEach((task) => {
    if (!tasksByCategory[task.category]) {
      tasksByCategory[task.category] = []
    }
    tasksByCategory[task.category].push(task)
  })

  // Get category display name
  const getCategoryName = (category: string) => {
    switch (category) {
      case "strength":
        return "Might"
      case "condition":
        return "Endurance"
      case "knowledge":
        return "Wisdom"
      case "nutrition":
        return "Vitality"
      case "mental":
        return "Spirit"
      default:
        return category.charAt(0).toUpperCase() + category.slice(1)
    }
  }

  // Get category icon
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "strength":
        return <Sword className="h-5 w-5" />
      case "condition":
        return <Heart className="h-5 w-5" />
      case "knowledge":
        return <Book className="h-5 w-5" />
      case "nutrition":
        return <Apple className="h-5 w-5" />
      case "mental":
        return <Brain className="h-5 w-5" />
      default:
        return <Shield className="h-5 w-5" />
    }
  }

  // Get category style
  const getCategoryStyle = (category: string) => {
    switch (category) {
      case "strength":
        return "bg-amber-900 border-t-2 border-amber-600"
      case "condition":
        return "bg-blue-900 border-t-2 border-blue-600"
      case "knowledge":
        return "bg-purple-900 border-t-2 border-purple-600"
      case "nutrition":
        return "bg-green-900 border-t-2 border-green-600"
      case "mental":
        return "bg-indigo-900 border-t-2 border-indigo-600"
      default:
        return "bg-amber-900 border-t-2 border-amber-600"
    }
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold tracking-tight font-serif">Daily Quests</h2>
          <Button
            onClick={() => setShowAddTask(true)}
            className="bg-amber-700 hover:bg-amber-800 text-white"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Quest
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Object.keys(tasksByCategory).map((category) => (
            <Card
              key={category}
              className="bg-gray-950 border-amber-800 overflow-hidden"
            >
              <CardHeader className={`${getCategoryStyle(category)} rounded-t-lg p-4`}>
                <CardTitle className="text-white flex items-center gap-2 font-serif">
                  {getCategoryIcon(category)}
                  {getCategoryName(category)}
                </CardTitle>
                <CardDescription className="text-white/90">
                  {tasksByCategory[category].filter((t) => t.completed).length} of {tasksByCategory[category].length}{" "}
                  completed
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <ul className="space-y-2">
                  {tasksByCategory[category].map((task) => (
                    <li key={task.id} className="flex items-start gap-2">
                      <button
                        onClick={() => handleTaskToggle(task.id)}
                        className={`flex-shrink-0 w-5 h-5 mt-0.5 rounded-full border-2 ${
                          task.completed
                            ? "bg-amber-600 border-amber-600 text-white"
                            : "border-amber-600 text-transparent hover:border-amber-500"
                        } flex items-center justify-center`}
                      >
                        {task.completed && <Check className="h-3 w-3" />}
                      </button>
                      <span className={`flex-1 text-sm ${task.completed ? "line-through text-gray-500" : "text-white"}`}>
                        {task.title}
                        <div className="text-xs text-amber-400/90 mt-1">
                          Reward: {task.gold} gold, {task.xp} XP
                        </div>
                      </span>
                      <button
                        onClick={() => handleDeleteTask(task.id)}
                        className="text-gray-500 hover:text-white"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              </CardContent>

              <CardFooter className="pt-0 pb-4">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full border-amber-800 hover:bg-amber-900 text-amber-400 hover:text-amber-200"
                  onClick={() => {
                    setNewTaskCategory(category)
                    setShowAddTask(true)
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Quest
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>

      <Dialog open={showAddTask} onOpenChange={setShowAddTask}>
        <DialogContent className="sm:max-w-md bg-black text-white border-amber-800/20">
          <DialogHeader>
            <DialogTitle>Add New Quest</DialogTitle>
            <DialogDescription>Create a new daily quest to track your progress.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="task-title">Quest Title</Label>
              <Input
                id="task-title"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                placeholder="Enter quest description..."
                className="bg-gray-900 border-amber-800/20"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="task-category">Category</Label>
              <select
                id="task-category"
                value={newTaskCategory}
                onChange={(e) => setNewTaskCategory(e.target.value)}
                className="w-full px-3 py-2 bg-gray-900 border border-amber-800/20 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="strength">Might</option>
                <option value="condition">Endurance</option>
                <option value="knowledge">Wisdom</option>
                <option value="nutrition">Vitality</option>
                <option value="mental">Spirit</option>
              </select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddTask(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAddTask}
              className="bg-gradient-to-r from-amber-600 to-amber-800 hover:from-amber-700 hover:to-amber-900"
            >
              Add Quest
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

