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
        className="bg-gradient-to-b from-amber-950/90 via-zinc-950 to-zinc-950 border-amber-600/30 shadow-2xl shadow-amber-500/20 overflow-hidden max-h-[90vh] p-0 flex flex-col"
        role="dialog"
        aria-label="achievement-unlock-modal"
      >
        <div className="relative z-10 flex-1 overflow-y-auto p-6 scrollbar-hide">
          <div className="flex flex-col items-center">
            {/* Background Effects */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-80 h-80 bg-amber-400/10 rounded-full blur-3xl animate-pulse" />
              <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-amber-500/5 via-transparent to-transparent" />
            </div>

            <DialogDescription id="achievement-unlock-modal-desc" className="sr-only">
              Achievement unlocked details
            </DialogDescription>

            <DialogHeader className="relative z-10 text-center items-center">
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
            <div className="relative z-10 flex flex-col items-center py-8">
              {/* Decorative Ring System */}
              <div className="relative group">
                <div className="absolute inset-0 bg-amber-400/20 rounded-full blur-3xl animate-pulse scale-150 opacity-40" />
                <div className="absolute -inset-2 border-2 border-dashed border-amber-400/30 rounded-full animate-spin-slow" />
                <div className="relative w-52 h-52 rounded-full bg-zinc-900 border-4 border-amber-500/40 p-1.5 shadow-2xl shadow-amber-500/20 overflow-hidden group-hover:scale-105 transition-transform duration-500">
                  <div className="relative w-full h-full rounded-full overflow-hidden bg-gradient-to-b from-amber-900/20 to-zinc-950">
                    <Image
                      src={`/images/creatures/${creatureId}_front.png`}
                      alt={creatureName}
                      fill
                      className="object-contain p-6 drop-shadow-[0_0_20px_rgba(251,191,36,0.4)]"
                    />
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_transparent_40%,_black_90%)] opacity-40" />
                  </div>
                </div>
                <div className="absolute -top-6 -left-6">
                  <Sparkles className="w-8 h-8 text-amber-300/60 animate-pulse" />
                </div>
                <div className="absolute -bottom-4 -right-2">
                  <Sparkles className="w-6 h-6 text-amber-400/50 animate-pulse" style={{ animationDelay: '0.7s' }} />
                </div>
              </div>

              {/* Creature Info */}
              <div className="mt-8 text-center relative z-10">
                <h3 className="text-3xl font-serif text-amber-100 mb-1">{creatureName}</h3>
                <p className="text-amber-400/60 font-mono text-sm tracking-widest uppercase">Registry Entry #{creatureId}</p>
              </div>
            </div>

            <DialogFooter className="relative z-10 flex flex-row gap-3 w-full mt-4">
              <Button
                variant="ghost"
                onClick={onClose}
                className="flex-1 h-12 text-amber-200/60 hover:text-amber-100 hover:bg-amber-900/20 rounded-xl"
              >
                Close
              </Button>
              <Button
                onClick={handleViewAchievement}
                className="flex-1 h-12 bg-amber-600 hover:bg-amber-500 text-white shadow-lg shadow-amber-500/20 gap-2 rounded-xl"
              >
                <Eye className="w-4 h-4" />
                View in Collection
              </Button>
            </DialogFooter>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
