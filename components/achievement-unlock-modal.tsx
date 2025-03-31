import { useRouter } from 'next/navigation';
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
  const router = useRouter();

  const handleViewAchievement = () => {
    router.push('/achievements');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gray-900 border-amber-800/20">
        <DialogHeader>
          <DialogTitle className="text-2xl font-cardo text-amber-500">
            New Creature Discovered!
          </DialogTitle>
          <DialogDescription className="text-gray-300">
            You have unlocked a new creature for your collection.
          </DialogDescription>
        </DialogHeader>

        <div className="relative w-full aspect-square max-w-sm mx-auto my-4">
          <Image
            src={`/images/creatures/${creatureId}_front.png`}
            alt={creatureName}
            fill
            className="object-contain"
          />
        </div>

        <div className="text-center mb-4">
          <h3 className="text-xl font-cardo text-white">{creatureName}</h3>
          <p className="text-gray-400">#{creatureId}</p>
        </div>

        <DialogFooter className="flex gap-2 sm:gap-0">
          <Button
            variant="secondary"
            onClick={onClose}
            className="flex-1 sm:flex-none"
          >
            Close
          </Button>
          <Button
            onClick={handleViewAchievement}
            className="flex-1 sm:flex-none bg-amber-600 hover:bg-amber-700"
          >
            View in Collection
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 