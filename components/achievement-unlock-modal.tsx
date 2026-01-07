"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { Sparkles, Eye, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

interface AchievementUnlockModalProps {
  isOpen: boolean;
  onClose: () => void;
  creatureId: string;
  creatureName: string;
}

export function AchievementUnlockModal({
  isOpen,
  onClose,
  creatureId,
  creatureName,
}: AchievementUnlockModalProps) {
  const handleViewAchievement = () => {
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="bg-gradient-to-b from-amber-950/90 via-zinc-950 to-zinc-950 border-amber-600/30 shadow-2xl shadow-amber-500/20 overflow-hidden"
        role="dialog"
        aria-label="achievement-unlock-modal"
      >
        {/* Background Effects */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-80 h-80 bg-amber-400/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-amber-500/5 via-transparent to-transparent" />
        </div>

        <DialogDescription id="achievement-unlock-modal-desc" className="sr-only">
          Achievement unlocked details
        </DialogDescription>

        <DialogHeader className="relative z-10 text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <Trophy className="w-6 h-6 text-amber-400 animate-bounce" />
            <DialogTitle className="text-3xl font-serif text-amber-300 tracking-wide">
              Discovery!
            </DialogTitle>
            <Trophy className="w-6 h-6 text-amber-400 animate-bounce" />
          </div>
          <DialogDescription className="text-amber-200/70 italic font-light">
            A new creature joins your collection
          </DialogDescription>
        </DialogHeader>

        {/* Creature Display */}
        <div className="relative z-10 flex flex-col items-center py-6">
          {/* Glow Ring */}
          <div className="relative">
            <div className="absolute inset-0 bg-amber-400/20 rounded-full blur-2xl animate-pulse scale-110" />
            <div className="absolute inset-0 border-2 border-amber-400/30 rounded-full animate-spin" style={{ animationDuration: '8s' }} />

            <div className="relative w-48 h-48 rounded-full bg-gradient-to-b from-amber-900/40 to-zinc-900/80 border border-amber-500/30 p-4 shadow-xl shadow-amber-500/10">
              <Image
                src={`/images/creatures/${creatureId}_front.png`}
                alt={creatureName}
                fill
                className="object-contain p-4 drop-shadow-[0_0_15px_rgba(251,191,36,0.3)]"
              />
            </div>
          </div>

          {/* Creature Info */}
          <div className="mt-6 text-center">
            <h3 className="text-2xl font-serif text-amber-100 mb-1">{creatureName}</h3>
            <p className="text-amber-400/60 font-mono text-sm">#{creatureId}</p>
          </div>

          {/* Sparkle Decorations */}
          <div className="absolute top-4 left-8">
            <Sparkles className="w-4 h-4 text-amber-300/50 animate-pulse" />
          </div>
          <div className="absolute top-12 right-10">
            <Sparkles className="w-3 h-3 text-amber-300/40 animate-pulse" style={{ animationDelay: '0.5s' }} />
          </div>
          <div className="absolute bottom-8 left-12">
            <Sparkles className="w-5 h-5 text-amber-300/30 animate-pulse" style={{ animationDelay: '1s' }} />
          </div>
        </div>

        <DialogFooter className="relative z-10 flex gap-3 sm:gap-3">
          <Button
            variant="ghost"
            onClick={onClose}
            className="flex-1 sm:flex-none text-amber-200/60 hover:text-amber-100 hover:bg-amber-900/20"
          >
            Close
          </Button>
          <Button
            onClick={handleViewAchievement}
            className="flex-1 sm:flex-none bg-amber-600 hover:bg-amber-500 text-white shadow-lg shadow-amber-500/20 gap-2"
          >
            <Eye className="w-4 h-4" />
            View in Collection
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
