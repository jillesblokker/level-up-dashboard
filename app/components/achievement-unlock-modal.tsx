import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

export interface AchievementUnlockModalProps {
  open: boolean;
  onClose: () => void;
  creatureId: string;
  creatureName: string;
}

export function AchievementUnlockModal({
  open,
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
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>New Creature Discovered!</DialogTitle>
          <DialogDescription>
            You have discovered {creatureName} (#{creatureId})! Would you like to view it in your collection?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Continue Playing
          </Button>
          <Button onClick={handleViewAchievement}>
            View Collection
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 