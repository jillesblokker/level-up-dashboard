"use client"

import { useEffect } from "react"
import confetti from "canvas-confetti"
import { toast } from "@/components/ui/use-toast"

export function CelebrationSystem() {
  useEffect(() => {
    const handleLevelUp = (e: CustomEvent) => {
      const { newLevel } = e.detail;
      
      // Massive confetti explosion
      const duration = 3 * 1000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

      const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

      const interval: NodeJS.Timeout = setInterval(function() {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);
        confetti({
          ...defaults, particleCount,
          origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
        });
        confetti({
          ...defaults, particleCount,
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
        });
      }, 250);

      // Toast notification
      toast({
        title: "🎉 LEVEL UP! 🎉",
        description: `You've reached Level ${newLevel}! Keep up the great work!`,
        duration: 5000,
        className: "bg-gradient-to-r from-amber-500 to-yellow-600 text-zinc-900 border-none shadow-xl shadow-amber-900/50",
      });
    };

    window.addEventListener('level-up', handleLevelUp as EventListener);
    return () => {
      window.removeEventListener('level-up', handleLevelUp as EventListener);
    };
  }, []);

  return null;
}
