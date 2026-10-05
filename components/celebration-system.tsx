"use client"

import { useEffect } from "react"

import { toast } from "@/components/ui/use-toast"

export function CelebrationSystem() {
  useEffect(() => {
    const handleLevelUp = async (e: CustomEvent) => {
      const { newLevel } = e.detail;
      
      // Massive confetti explosion
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let confettiFn: any = null;
      try {
        const mod = await import('canvas-confetti');
        confettiFn = mod.default;
      } catch {}
      if (!confettiFn) return;

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
        confettiFn!({
          ...defaults, particleCount,
          origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
        });
        confettiFn!({
          ...defaults, particleCount,
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
        });
      }, 250);

      // Toast notification
      toast({
        title: "🎉 Level up!",
        description: `Level ${newLevel} achieved! Spirit Sprite and all your unlocked citizens celebrate in the town square!`,
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
