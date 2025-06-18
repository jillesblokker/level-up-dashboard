import { BookOpen, Sword, Dumbbell, Brain } from "lucide-react";
import React from "react";
import { Achievement, ActivityLog, Stats } from "../types/game";

export type CategoryItem = {
  id: string;
  name: string;
  subtitle: string;
  description: string;
  image: string;
};

export type CategoryData = {
  name: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  level: number;
  xp: number;
  nextLevelXp: number;
  progress: number;
  streak: number;
  bestStreak: number;
  achievementsCompleted: number;
  weeklyData: number[];
  achievements: Achievement[];
  activityLog: ActivityLog[];
  stats: Stats[];
  items: CategoryItem[];
};

const fitnessItems: CategoryItem[] = [
  {
    id: "workout-1",
    name: "Daily Strength Training",
    subtitle: "Build your physical might",
    description: "Complete a full-body workout focusing on strength and endurance.",
    image: "/images/categories/fitness/strength.jpg",
  },
  {
    id: "workout-2",
    name: "Cardio Challenge",
    subtitle: "Test your stamina",
    description: "A high-intensity cardio workout to improve your endurance.",
    image: "/images/categories/fitness/cardio.jpg",
  },
  {
    id: "workout-3",
    name: "Flexibility Training",
    subtitle: "Enhance your mobility",
    description: "Stretching and mobility exercises to improve flexibility.",
    image: "/images/categories/fitness/flexibility.jpg",
  },
];

const learningItems: CategoryItem[] = [
  {
    id: "learning-1",
    name: "Language Studies",
    subtitle: "Expand your linguistic abilities",
    description: "Daily practice in your chosen language to build proficiency.",
    image: "/images/categories/learning/language.jpg",
  },
  {
    id: "learning-2",
    name: "Programming Challenge",
    subtitle: "Sharpen your coding skills",
    description: "Solve programming problems to enhance your technical abilities.",
    image: "/images/categories/learning/coding.jpg",
  },
  {
    id: "learning-3",
    name: "Book Club",
    subtitle: "Explore new worlds through reading",
    description: "Read and discuss books to expand your knowledge and perspective.",
    image: "/images/categories/learning/books.jpg",
  },
];

const categories: Record<string, CategoryData> = {
  fitness: {
    name: "Fitness",
    title: "Fitness",
    description: "Track your physical training and wellness journey",
    icon: React.createElement(Dumbbell),
    color: "bg-red-500",
    level: 3,
    xp: 340,
    nextLevelXp: 500,
    progress: 68,
    streak: 5,
    bestStreak: 12,
    achievementsCompleted: 3,
    weeklyData: [20, 35, 45, 30, 50, 40, 60],
    achievements: [],
    activityLog: [],
    stats: [],
    items: fitnessItems,
  },
  learning: {
    name: "Learning",
    title: "Learning",
    description: "Expand your knowledge and master new skills",
    icon: React.createElement(BookOpen),
    color: "bg-blue-500",
    level: 5,
    xp: 720,
    nextLevelXp: 1000,
    progress: 72,
    streak: 8,
    bestStreak: 15,
    achievementsCompleted: 5,
    weeklyData: [30, 45, 60, 40, 65, 55, 70],
    achievements: [],
    activityLog: [],
    stats: [],
    items: learningItems,
  },
  combat: {
    name: "Combat Training",
    title: "Combat Training",
    description: "Hone your battle skills and strategy",
    icon: React.createElement(Sword),
    color: "bg-orange-500",
    level: 2,
    xp: 180,
    nextLevelXp: 300,
    progress: 60,
    streak: 3,
    bestStreak: 7,
    achievementsCompleted: 2,
    weeklyData: [15, 25, 20, 35, 30, 40, 45],
    achievements: [],
    activityLog: [],
    stats: [],
    items: [],
  },
  intelligence: {
    name: "Intelligence",
    title: "Intelligence",
    description: "Develop your mental acuity and problem-solving abilities",
    icon: React.createElement(Brain),
    color: "bg-violet-500",
    level: 4,
    xp: 580,
    nextLevelXp: 750,
    progress: 77,
    streak: 6,
    bestStreak: 10,
    achievementsCompleted: 4,
    weeklyData: [25, 40, 35, 50, 45, 55, 65],
    achievements: [],
    activityLog: [],
    stats: [],
    items: [],
  },
};

export function getCategoryData(slug: string): CategoryData | undefined {
  return categories[slug];
} 