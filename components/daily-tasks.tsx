"use client"

import { useState, useEffect } from "react"
import { Plus, X, Shield, Heart, Book, Apple, Brain, Sword, Sparkles } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { storageService } from '@/lib/storage-service'
import { cn } from "@/lib/utils"

interface Task {
  id: string
  title: string
  completed: boolean
  category: string
  gold: number
  xp: number
  priority: string
}

interface DailyTasksProps {
  onTaskComplete?: (task: Task) => void
}

export function DailyTasks({ onTaskComplete }: DailyTasksProps) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [showAddTask, setShowAddTask] = useState(false)
  const [newTaskTitle, setNewTaskTitle] = useState("")
  const [newTaskCategory, setNewTaskCategory] = useState("strength")
  const [newTaskPriority, setNewTaskPriority] = useState("medium")

  // Load tasks from localStorage
  useEffect(() => {
    // const savedTasks = storageService.get<Task[]>('daily-tasks', []) // Removed
    const savedTasks: Task[] = []; // Temporary
    if (savedTasks.length > 0) {
      setTasks(savedTasks)
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
          priority: "medium",
        },
        {
          id: "2",
          title: "Run for 15 minutes",
          completed: false,
          category: "condition",
          gold: 30,
          xp: 75,
          priority: "medium",
        },
        {
          id: "3",
          title: "Read a chapter of a book",
          completed: false,
          category: "knowledge",
          gold: 15,
          xp: 40,
          priority: "medium",
        },
        {
          id: "4",
          title: "Drink 8 glasses of water",
          completed: false,
          category: "nutrition",
          gold: 10,
          xp: 30,
          priority: "medium",
        },
        {
          id: "5",
          title: "Practice meditation for 10 minutes",
          completed: false,
          category: "mental",
          gold: 25,
          xp: 60,
          priority: "medium",
        },
        {
          id: "6",
          title: "Stretch for 10 minutes",
          completed: false,
          category: "strength",
          gold: 15,
          xp: 35,
          priority: "medium",
        },
        {
          id: "7",
          title: "Eat a healthy breakfast",
          completed: false,
          category: "nutrition",
          gold: 20,
          xp: 45,
          priority: "medium",
        },
        {
          id: "8",
          title: "Learn a new skill for 30 minutes",
          completed: false,
          category: "knowledge",
          gold: 35,
          xp: 80,
          priority: "medium",
        },
      ]
      setTasks(defaultTasks)
      // storageService.set('daily-tasks', defaultTasks) // Removed
    }
  }, [])

  // Save tasks to localStorage whenever they change
  useEffect(() => {
    if (tasks.length > 0) {
      // storageService.set('daily-tasks', tasks) // Removed
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
      priority: newTaskPriority,
    }

    setTasks((prevTasks) => [...prevTasks, newTask])
    setNewTaskTitle("")
    setShowAddTask(false)
  }

  const handleDeleteTask = (taskId: string) => {
    setTasks((prevTasks) => prevTasks.filter((task) => task.id !== taskId))
  }

  // Group tasks by category
  const tasksByCategory: Record<string, Task[]> = {
    strength: [],
    condition: [],
    knowledge: [],
    nutrition: [],
    mental: []
  }
  tasks.forEach((task) => {
    const category = task.category as keyof typeof tasksByCategory;
    if (category in tasksByCategory) {
      tasksByCategory[category]?.push(task);
    }
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
      <div className="space-y-6">
        <div className="flex items-center justify-between px-1">
          <div>
            <h2 className="text-3xl font-serif text-white tracking-tight">Daily Quests</h2>
            <p className="text-zinc-500 text-sm mt-1">Consistency is the path to legendary status.</p>
          </div>
          <Button
            onClick={() => setShowAddTask(true)}
            className="bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl shadow-lg border-t border-white/10 px-6 h-11"
          >
            <Plus className="mr-2 h-4 w-4" />
            New Quest
          </Button>
        </div>

        {/* Daily Tasks List */}
        <div className="w-full">
          {/* Mobile: horizontally scrollable row for daily tasks */}
          <div className="flex gap-4 overflow-x-auto flex-nowrap md:hidden py-4 px-1 scrollbar-hide" style={{ WebkitOverflowScrolling: 'touch' }}>
            {Object.keys(tasksByCategory).map((category) => (
              <Card
                key={category}
                className={cn(
                  "bg-zinc-950 border-zinc-800 overflow-hidden min-w-[260px] max-w-[280px] flex-shrink-0 flex flex-col shadow-xl",
                  "hover:border-zinc-700 transition-all duration-300"
                )}
              >
                <div className={cn(
                  "h-1.5 w-full",
                  category === "strength" ? "bg-red-500" :
                    category === "condition" ? "bg-blue-500" :
                      category === "knowledge" ? "bg-purple-500" :
                        category === "nutrition" ? "bg-green-500" :
                          "bg-indigo-500"
                )} />
                <CardHeader className="p-5 pb-3">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "p-2 rounded-lg bg-white/5 border border-white/5",
                      category === "strength" ? "text-red-400" :
                        category === "condition" ? "text-blue-400" :
                          category === "knowledge" ? "text-purple-400" :
                            category === "nutrition" ? "text-green-400" :
                              "text-indigo-400"
                    )}>
                      {getCategoryIcon(category)}
                    </div>
                    <div>
                      <CardTitle className="text-white text-lg font-serif">
                        {getCategoryName(category)}
                      </CardTitle>
                      <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-0.5">
                        {tasksByCategory[category]?.filter((t) => t.completed).length || 0} / {tasksByCategory[category]?.length || 0} Complete
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-5 pt-0 space-y-3 flex-1">
                  {(tasksByCategory[category] || []).map((task) => (
                    <div
                      key={task.id}
                      className={cn(
                        "flex items-center justify-between gap-3 p-3 rounded-xl border transition-all cursor-pointer group",
                        task.completed
                          ? "bg-zinc-900/40 border-emerald-500/20"
                          : "bg-zinc-900/60 border-white/5 hover:border-white/10"
                      )}
                      onClick={() => handleTaskToggle(task.id)}
                    >
                      <div className="flex-1 min-w-0">
                        <span className={cn(
                          "text-sm font-medium block truncate",
                          task.completed ? "text-zinc-500 line-through" : "text-zinc-200"
                        )}>
                          {task.title}
                        </span>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] text-amber-500 font-bold">+{task.gold}g</span>
                          <span className="text-[10px] text-blue-400 font-bold">+{task.xp}xp</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 relative z-10">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteTask(task.id);
                          }}
                          className="h-8 w-8 text-zinc-600 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                          aria-label={`Delete task: ${task.title}`}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                        <Checkbox
                          checked={task.completed}
                          onCheckedChange={() => handleTaskToggle(task.id)}
                          onClick={(e) => e.stopPropagation()}
                          className="h-5 w-5 border-zinc-700 data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500"
                          aria-label={`Mark as ${task.completed ? 'incomplete' : 'complete'}`}
                        />
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Desktop/tablet: grid layout */}
          <div className="hidden md:grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
            {Object.keys(tasksByCategory).map((category) => (
              <Card
                key={category}
                className={cn(
                  "bg-zinc-950 border-zinc-800 overflow-hidden flex flex-col shadow-2xl relative group/card",
                  "hover:border-zinc-700 transition-all duration-500"
                )}
              >
                {/* Accent line with glow */}
                <div className={cn(
                  "h-1 w-full relative",
                  category === "strength" ? "bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.3)]" :
                    category === "condition" ? "bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.3)]" :
                      category === "knowledge" ? "bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.3)]" :
                        category === "nutrition" ? "bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.3)]" :
                          "bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.3)]"
                )} />

                <CardHeader className="p-6 pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "p-3 rounded-xl bg-zinc-900 border border-white/5 transition-transform duration-300 group-hover/card:scale-110",
                        category === "strength" ? "text-red-400 shadow-lg shadow-red-900/10" :
                          category === "condition" ? "text-blue-400 shadow-lg shadow-blue-900/10" :
                            category === "knowledge" ? "text-purple-400 shadow-lg shadow-purple-900/10" :
                              category === "nutrition" ? "text-green-400 shadow-lg shadow-green-900/10" :
                                "text-indigo-400 shadow-lg shadow-indigo-900/10"
                      )}>
                        {getCategoryIcon(category)}
                      </div>
                      <div>
                        <CardTitle className="text-xl font-serif text-white tracking-wide">
                          {getCategoryName(category)}
                        </CardTitle>
                        <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.2em] mt-1">
                          The Path of the {getCategoryName(category)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-serif text-white opacity-20">
                        {tasksByCategory[category]?.filter((t) => t.completed).length || 0}
                        <span className="text-sm opacity-50 mx-1">/</span>
                        {tasksByCategory[category]?.length || 0}
                      </p>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="p-6 pt-0 space-y-4">
                  <div className="h-px w-full bg-gradient-to-r from-transparent via-white/5 to-transparent mb-6" />

                  <div className="space-y-3">
                    {(tasksByCategory[category] || []).map((task) => (
                      <div
                        key={task.id}
                        className={cn(
                          "relative flex items-center justify-between gap-4 p-4 rounded-2xl border transition-all duration-300 cursor-pointer group/item overflow-hidden",
                          task.completed
                            ? "bg-emerald-500/5 border-emerald-500/20"
                            : "bg-zinc-900/40 border-white/5 hover:bg-zinc-900/60 hover:border-white/10"
                        )}
                        onClick={() => handleTaskToggle(task.id)}
                      >
                        {/* Task background flash on hover */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent translate-x-[-100%] group-hover/item:translate-x-[100%] transition-transform duration-1000 pointer-events-none" />

                        <div className="flex-1 min-w-0 relative z-10">
                          <span className={cn(
                            "text-sm font-medium block transition-all duration-300",
                            task.completed ? "text-zinc-500 line-through" : "text-zinc-200 group-hover/item:text-white"
                          )}>
                            {task.title}
                          </span>
                          <div className="flex items-center gap-3 mt-1.5">
                            <div className="flex items-center gap-1">
                              <div className="w-1 h-1 rounded-full bg-amber-500" />
                              <span className="text-[10px] text-amber-500/80 font-bold uppercase">{task.gold} Gold</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <div className="w-1 h-1 rounded-full bg-blue-500" />
                              <span className="text-[10px] text-blue-400/80 font-bold uppercase">{task.xp} XP</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 relative z-10">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteTask(task.id);
                            }}
                            className="h-8 w-8 text-zinc-600 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors opacity-0 group-hover/item:opacity-100"
                            aria-label={`Delete task: ${task.title}`}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                          <Checkbox
                            checked={task.completed}
                            onCheckedChange={() => handleTaskToggle(task.id)}
                            onClick={(e) => e.stopPropagation()}
                            className={cn(
                              "h-6 w-6 rounded-lg transition-all duration-300",
                              "border-zinc-700 data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500",
                              "group-hover/item:border-zinc-500"
                            )}
                            aria-label={`Mark as ${task.completed ? 'incomplete' : 'complete'}`}
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  {tasksByCategory[category]?.length === 0 && (
                    <div className="py-12 flex flex-col items-center justify-center text-center opacity-40">
                      <Sparkles className="h-8 w-8 mb-3 text-zinc-600" />
                      <p className="text-xs font-medium text-zinc-500">No quests registered in this focus.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      <Dialog open={showAddTask} onOpenChange={setShowAddTask}>
        <DialogContent className="sm:max-w-md max-h-[90vh] bg-zinc-950 border-zinc-800 text-zinc-100 p-0 overflow-hidden flex flex-col shadow-2xl" role="dialog" aria-label="daily-tasks-modal">
          {/* Background Effects */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-amber-500/10 rounded-full blur-[100px] animate-pulse" />
          </div>

          <div className="relative z-10 flex-1 overflow-y-auto p-6 scrollbar-hide">
            <DialogHeader className="text-center items-center pb-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-[10px] font-bold uppercase tracking-widest mb-4 text-amber-500 shadow-sm">
                <Plus className="w-3 h-3" />
                New Scroll
              </div>
              <DialogTitle className="text-3xl font-serif text-white tracking-tight">Draft New Quest</DialogTitle>
              <DialogDescription id="daily-tasks-modal-desc" className="text-zinc-500 mt-2">
                Specify a new deed to be recorded in your daily archive.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-2">
              <div className="space-y-2">
                <Label htmlFor="task-title" className="text-xs font-bold uppercase tracking-widest text-zinc-500 ml-1">Quest Title</Label>
                <div className="relative group/input">
                  <Input
                    id="task-title"
                    value={newTaskTitle}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewTaskTitle(e.target.value)}
                    placeholder="e.g., Slay the morning fog (10 min meditation)..."
                    className="bg-zinc-900/60 border-white/5 focus:border-amber-500/50 h-12 rounded-xl px-4 text-zinc-200 placeholder:text-zinc-600 transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="task-category" className="text-xs font-bold uppercase tracking-widest text-zinc-500 ml-1">Category</Label>
                  <select
                    id="task-category"
                    aria-label="Task Category"
                    value={newTaskCategory}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setNewTaskCategory(e.target.value)}
                    className="w-full h-12 px-4 bg-zinc-900/60 border border-white/5 rounded-xl text-zinc-300 focus:outline-none focus:border-amber-500/50 appearance-none transition-all cursor-pointer"
                  >
                    <option value="strength">Might</option>
                    <option value="condition">Endurance</option>
                    <option value="knowledge">Wisdom</option>
                    <option value="nutrition">Vitality</option>
                    <option value="mental">Spirit</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="task-priority" className="text-xs font-bold uppercase tracking-widest text-zinc-500 ml-1">Priority</Label>
                  <select
                    id="task-priority"
                    aria-label="Task Priority"
                    value={newTaskPriority}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setNewTaskPriority(e.target.value)}
                    className="w-full h-12 px-4 bg-zinc-900/60 border border-white/5 rounded-xl text-zinc-300 focus:outline-none focus:border-amber-500/50 appearance-none transition-all cursor-pointer"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>

              <div className="bg-amber-500/5 border border-amber-500/10 rounded-2xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center border border-amber-500/20">
                    <Sparkles className="w-5 h-5 text-amber-500" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-amber-500/60">Estimated Reward</p>
                    <p className="text-sm font-bold text-amber-200">Bonus XP & Gold awarded upon success</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 bg-zinc-950 border-t border-white/5 flex flex-row gap-3">
            <Button
              variant="ghost"
              onClick={() => setShowAddTask(false)}
              className="flex-1 h-12 rounded-xl text-zinc-500 hover:text-zinc-200 hover:bg-zinc-900"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddTask}
              aria-label="Add Task"
              className="flex-[2] h-12 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl shadow-lg shadow-amber-900/20 border-t border-white/10"
            >
              Dispatch Quest
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
