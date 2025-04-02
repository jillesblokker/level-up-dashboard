import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { useCreatureStore } from '@/stores/creatureStore';

interface BattleMinigameProps {
  onClose: () => void;
  onVictory: (gold: number, exp: number) => void;
  onDefeat: () => void;
}

type BattleAction = 'fight' | 'defend' | 'duck' | 'flee';
type BattleRound = {
  playerAction: BattleAction;
  opponentAction: BattleAction;
  damage: number;
  target: 'player' | 'opponent';
};

export function BattleMinigame({ onClose, onVictory, onDefeat }: BattleMinigameProps) {
  const { toast } = useToast();
  const { getCreature } = useCreatureStore();

  // Get Necrion and a random opponent
  const necrion = getCreature('000');
  const opponentId = String(Math.floor(Math.random() * 12) + 1).padStart(3, '0');
  const opponent = getCreature(opponentId);

  const [playerHealth, setPlayerHealth] = useState(necrion?.stats.hp || 64);
  const [opponentHealth, setOpponentHealth] = useState(opponent?.stats.hp || 64);
  const [round, setRound] = useState(1);
  const [battleLog, setBattleLog] = useState<BattleRound[]>([]);
  const [isGameOver, setIsGameOver] = useState(false);

  // AI opponent action selection
  const getOpponentAction = (): BattleAction => {
    const actions: BattleAction[] = ['fight', 'defend', 'duck'];
    const weights = [0.5, 0.3, 0.2]; // 50% fight, 30% defend, 20% duck
    const random = Math.random();
    let sum = 0;
    for (let i = 0; i < weights.length; i++) {
      sum += weights[i];
      if (random <= sum) return actions[i];
    }
    return 'fight';
  };

  // Calculate damage based on stats and actions
  const calculateDamage = (attacker: typeof necrion, defender: typeof necrion, attackerAction: BattleAction, defenderAction: BattleAction): number => {
    if (!attacker || !defender) return 0;
    if (defenderAction === 'defend') return 0;
    if (defenderAction === 'duck') return Math.floor(attacker.stats.attack * 0.3);
    return attacker.stats.attack - Math.floor(defender.stats.defense * 0.5);
  };

  const handleAction = (playerAction: BattleAction) => {
    if (isGameOver || !necrion || !opponent) return;

    const opponentAction = getOpponentAction();
    let damage = 0;
    let target: 'player' | 'opponent' = 'opponent';

    if (playerAction === 'flee') {
      // 70% chance to successfully flee
      if (Math.random() < 0.7) {
        toast({
          title: "Escaped!",
          description: "You successfully fled from battle.",
        });
        onClose();
        return;
      } else {
        damage = calculateDamage(opponent, necrion, 'fight', 'fight');
        target = 'player';
        setPlayerHealth(prev => Math.max(0, prev - damage));
        toast({
          title: "Failed to Escape!",
          description: `${opponent.name} caught you! Took ${damage} damage.`,
          variant: "destructive",
        });
      }
    } else {
      // Normal battle round
      if (playerAction === 'fight') {
        damage = calculateDamage(necrion, opponent, playerAction, opponentAction);
        if (damage > 0) {
          setOpponentHealth(prev => Math.max(0, prev - damage));
        }
      }

      // Opponent's turn
      if (opponentAction === 'fight') {
        const opponentDamage = calculateDamage(opponent, necrion, opponentAction, playerAction);
        if (opponentDamage > 0) {
          setPlayerHealth(prev => Math.max(0, prev - opponentDamage));
          damage = opponentDamage;
          target = 'player';
        }
      }
    }

    // Record the round
    setBattleLog(prev => [...prev, { playerAction, opponentAction, damage, target }]);
    setRound(prev => prev + 1);
  };

  // Check for game over conditions
  useEffect(() => {
    if (playerHealth <= 0) {
      setIsGameOver(true);
      onDefeat();
    } else if (opponentHealth <= 0) {
      setIsGameOver(true);
      const goldWon = Math.floor(Math.random() * 481) + 20; // 20-500 gold
      const expWon = Math.floor(Math.random() * 41) + 10; // 10-50 exp
      onVictory(goldWon, expWon);
    }
  }, [playerHealth, opponentHealth, onDefeat, onVictory]);

  if (!necrion || !opponent) return null;

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] bg-gray-900 border border-amber-800/20">
        <DialogHeader>
          <DialogTitle className="text-2xl font-medievalsharp text-amber-500">
            Battle: {necrion.name} vs {opponent.name}
          </DialogTitle>
          <DialogDescription>
            Round {round} - Choose your action wisely!
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4 my-4">
          {/* Player */}
          <div className="text-center">
            <div className="relative w-full h-48 mb-2">
              <Image
                src="/images/creatures/000.png"
                alt={necrion.name}
                fill
                className="object-contain"
              />
            </div>
            <div className="space-y-2">
              <p className="font-medievalsharp text-lg">{necrion.name}</p>
              <div className="w-full bg-gray-800 h-2 rounded-full">
                <div
                  className="bg-green-500 h-2 rounded-full transition-all"
                  style={{ width: `${(playerHealth / necrion.stats.hp) * 100}%` }}
                />
              </div>
              <p className="text-sm">{playerHealth}/{necrion.stats.hp} HP</p>
            </div>
          </div>

          {/* Opponent */}
          <div className="text-center">
            <div className="relative w-full h-48 mb-2">
              <Image
                src={`/images/creatures/${opponent.id}.png`}
                alt={opponent.name}
                fill
                className="object-contain"
              />
            </div>
            <div className="space-y-2">
              <p className="font-medievalsharp text-lg">{opponent.name}</p>
              <div className="w-full bg-gray-800 h-2 rounded-full">
                <div
                  className="bg-red-500 h-2 rounded-full transition-all"
                  style={{ width: `${(opponentHealth / opponent.stats.hp) * 100}%` }}
                />
              </div>
              <p className="text-sm">{opponentHealth}/{opponent.stats.hp} HP</p>
            </div>
          </div>
        </div>

        {/* Battle Log */}
        <div className="max-h-32 overflow-y-auto bg-gray-800/50 rounded-lg p-2 mb-4">
          {battleLog.map((log, index) => (
            <div key={index} className="text-sm mb-1">
              <span className="text-amber-500">Round {index + 1}:</span>{' '}
              {log.target === 'opponent' ? necrion.name : opponent.name} dealt {log.damage} damage
              {log.damage > 0 ? ' ⚔️' : ' 🛡️'}
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2">
          <Button
            onClick={() => handleAction('fight')}
            disabled={isGameOver}
            className="bg-red-600 hover:bg-red-700"
          >
            Fight ⚔️
          </Button>
          <Button
            onClick={() => handleAction('defend')}
            disabled={isGameOver}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Defend 🛡️
          </Button>
          <Button
            onClick={() => handleAction('duck')}
            disabled={isGameOver}
            className="bg-green-600 hover:bg-green-700"
          >
            Duck 🦆
          </Button>
          <Button
            onClick={() => handleAction('flee')}
            disabled={isGameOver}
            variant="secondary"
          >
            Flee 🏃
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
} 