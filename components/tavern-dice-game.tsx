"use client";

import React, { useState, useEffect, useRef } from "react";
import { Dices, Shield, Sparkles, Volume2, VolumeX, RotateCcw, Trophy, Skull, HelpCircle, Swords } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/use-toast";
import { getCharacterStats, addToCharacterStat } from "@/lib/character-stats-service";
import { formatGold, cn } from "@/lib/utils";

// --- TYPES ---
export type AIDifficulty = 'easy' | 'normal' | 'hard';

export interface Bid {
  quantity: number;
  face: number; // 1..6
  bidder: 'player' | 'computer';
}

export type GamePhase = 
  | 'difficultySelect'
  | 'rolling'
  | 'playerTurn'
  | 'computerTurn'
  | 'challengeRevealing'
  | 'roundResult'
  | 'gameOver';

// --- WEB AUDIO SYNTHESIZER (Zero external asset dependencies, works everywhere) ---
class TavernAudio {
  private ctx: AudioContext | null = null;
  public enabled: boolean = true;

  private getContext() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  playDiceRoll() {
    if (!this.enabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    // Simulate 4 quick rattle clicks
    for (let i = 0; i < 5; i++) {
      setTimeout(() => {
        if (!ctx) return;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(150 + Math.random() * 300, ctx.currentTime);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start();
        osc.stop(ctx.currentTime + 0.04);
      }, i * 65);
    }
  }

  playChallengeSound() {
    if (!this.enabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    // Heavy tavern drum thud
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(120, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(30, ctx.currentTime + 0.35);

    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.35);
  }

  playWinSound() {
    if (!this.enabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const notes = [392.00, 523.25, 659.25, 783.99]; // G4, C5, E5, G5
    notes.forEach((freq, idx) => {
      setTimeout(() => {
        if (!ctx) return;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start();
        osc.stop(ctx.currentTime + 0.3);
      }, idx * 100);
    });
  }

  playLossSound() {
    if (!this.enabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const notes = [300, 260, 220];
    notes.forEach((freq, idx) => {
      setTimeout(() => {
        if (!ctx) return;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start();
        osc.stop(ctx.currentTime + 0.35);
      }, idx * 120);
    });
  }
}

const tavernAudio = new TavernAudio();

// --- PROBABILITY & AI ENGINE ---

// Combinations helper nCr
function combinations(n: number, r: number): number {
  if (r < 0 || r > n) return 0;
  if (r === 0 || r === n) return 1;
  let res = 1;
  for (let i = 1; i <= r; i++) {
    res = (res * (n - i + 1)) / i;
  }
  return res;
}

// Binomial probability: P(X >= k) for n hidden dice with p = 1/6
function probAtLeast(kRequired: number, nHidden: number): number {
  if (kRequired <= 0) return 1.0;
  if (kRequired > nHidden) return 0.0;

  const p = 1 / 6;
  let totalProb = 0;
  for (let k = kRequired; k <= nHidden; k++) {
    const probK = combinations(nHidden, k) * Math.pow(p, k) * Math.pow(1 - p, nHidden - k);
    totalProb += probK;
  }
  return totalProb;
}

// Compute AI's decision given AI's visible dice, total player hidden dice, difficulty, and current bid
function computeAIDecision(
  aiDice: number[],
  playerDiceCount: number,
  currentBid: Bid | null,
  difficulty: AIDifficulty,
  bidHistory: Bid[]
): { action: 'challenge' | 'raise'; nextBid?: Bid } {
  const totalDiceInPlay = aiDice.length + playerDiceCount;

  // 1. FIRST TURN (No current bid)
  if (!currentBid) {
    // Pick AI's most frequent face
    const counts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
    aiDice.forEach(d => {
      counts[d] = (counts[d] ?? 0) + 1;
    });
    let bestFace = 1;
    let maxCount = -1;
    for (let f = 6; f >= 1; f--) {
      const cnt = counts[f] ?? 0;
      if (cnt > maxCount) {
        maxCount = cnt;
        bestFace = f;
      }
    }

    let initialQty = Math.max(1, Math.floor(totalDiceInPlay / 3));
    if (difficulty === 'easy') {
      initialQty = Math.min(initialQty, Math.floor(Math.random() * 2) + 1);
    }
    return {
      action: 'raise',
      nextBid: { quantity: Math.min(totalDiceInPlay, initialQty), face: bestFace, bidder: 'computer' }
    };
  }

  // 2. EXISTING BID - Evaluate probability of current bid being true
  const aiMatchingCount = aiDice.filter(d => d === currentBid.face).length;
  const neededFromPlayer = currentBid.quantity - aiMatchingCount;
  const probTrue = probAtLeast(neededFromPlayer, playerDiceCount);

  // Challenge threshold based on difficulty
  let challengeThreshold = 0.22;
  if (difficulty === 'easy') challengeThreshold = 0.08; // Rarely challenges on easy
  if (difficulty === 'hard') challengeThreshold = 0.30; // Very skeptical on hard

  // Force challenge if bid is physically impossible
  if (currentBid.quantity > totalDiceInPlay || neededFromPlayer > playerDiceCount) {
    return { action: 'challenge' };
  }

  // Check if AI should challenge
  if (probTrue < challengeThreshold) {
    // Small chance to raise anyway on easy/normal
    if (difficulty === 'easy' && Math.random() < 0.3) {
      // Continue to raise
    } else {
      return { action: 'challenge' };
    }
  }

  // 3. GENERATE LEGAL RAISES
  const legalRaises: Bid[] = [];
  
  // Option A: Same face, higher quantity
  for (let q = currentBid.quantity + 1; q <= totalDiceInPlay; q++) {
    legalRaises.push({ quantity: q, face: currentBid.face, bidder: 'computer' });
  }

  // Option B: Same quantity, higher face
  for (let f = currentBid.face + 1; f <= 6; f++) {
    legalRaises.push({ quantity: currentBid.quantity, face: f, bidder: 'computer' });
  }

  // Option C: Higher quantity, any face (1..6)
  for (let q = currentBid.quantity + 1; q <= Math.min(totalDiceInPlay, currentBid.quantity + 2); q++) {
    for (let f = 1; f <= 6; f++) {
      if (q > currentBid.quantity || (q === currentBid.quantity && f > currentBid.face)) {
        if (!legalRaises.some(b => b.quantity === q && b.face === f)) {
          legalRaises.push({ quantity: q, face: f, bidder: 'computer' });
        }
      }
    }
  }

  if (legalRaises.length === 0) {
    return { action: 'challenge' };
  }

  // Score legal raises by plausibility & AI held dice
  const scoredRaises = legalRaises.map(bid => {
    const held = aiDice.filter(d => d === bid.face).length;
    const needed = bid.quantity - held;
    const prob = probAtLeast(needed, playerDiceCount);
    
    // Hard AI bluffing bonus: if AI holds 0 of a face, slightly bluff occasionally
    let bluffBonus = 0;
    if (difficulty === 'hard' && held === 0 && Math.random() < 0.25) {
      bluffBonus = 0.15;
    }

    const score = prob + (held * 0.15) + bluffBonus;
    return { bid, score, prob };
  });

  // Sort by score descending
  scoredRaises.sort((a, b) => b.score - a.score);

  const bestRaise = scoredRaises[0];
  if (!bestRaise || (bestRaise.prob < 0.12 && Math.random() > 0.15)) {
    return { action: 'challenge' };
  }

  // Select raise based on difficulty randomness
  let chosenIdx = 0;
  if (difficulty === 'easy' && scoredRaises.length > 1) {
    chosenIdx = Math.floor(Math.random() * Math.min(4, scoredRaises.length));
  } else if (difficulty === 'normal' && scoredRaises.length > 1) {
    chosenIdx = Math.random() < 0.75 ? 0 : Math.floor(Math.random() * Math.min(2, scoredRaises.length));
  }

  const selectedRaise = scoredRaises[chosenIdx] || bestRaise;

  return {
    action: 'raise',
    nextBid: selectedRaise.bid
  };
}

// --- 3D-STYLED PHYSICAL DICE COMPONENT ---
function Die3D({ value, isHidden = false, isHighlighted = false, size = 'md' }: { value: number; isHidden?: boolean; isHighlighted?: boolean; size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'w-8 h-8 rounded-lg text-xs border',
    md: 'w-12 h-12 rounded-xl text-base border-2',
    lg: 'w-16 h-16 rounded-2xl text-xl border-2'
  }[size];

  if (isHidden) {
    return (
      <div className={cn(
        sizeClasses,
        "bg-gradient-to-br from-amber-950 via-zinc-900 to-amber-950 border-amber-800/60 shadow-lg flex items-center justify-center relative overflow-hidden group transition-transform"
      )}>
        <div className="absolute inset-0 bg-[radial-gradient(#d97706_1px,transparent_1px)] [background-size:8px_8px] opacity-20" />
        <Shield className="w-4 h-4 text-amber-500/60" />
      </div>
    );
  }

  // Pip positions mapping for 1 to 6
  const pipsMap: Record<number, string[]> = {
    1: ['col-start-2 row-start-2'],
    2: ['col-start-1 row-start-1', 'col-start-3 row-start-3'],
    3: ['col-start-1 row-start-1', 'col-start-2 row-start-2', 'col-start-3 row-start-3'],
    4: ['col-start-1 row-start-1', 'col-start-3 row-start-1', 'col-start-1 row-start-3', 'col-start-3 row-start-3'],
    5: ['col-start-1 row-start-1', 'col-start-3 row-start-1', 'col-start-2 row-start-2', 'col-start-1 row-start-3', 'col-start-3 row-start-3'],
    6: ['col-start-1 row-start-1', 'col-start-3 row-start-1', 'col-start-1 row-start-2', 'col-start-3 row-start-2', 'col-start-1 row-start-3', 'col-start-3 row-start-3']
  };

  const defaultPips = ['col-start-2 row-start-2'];
  const pips = pipsMap[value] ?? defaultPips;

  return (
    <div className={cn(
      sizeClasses,
      "bg-gradient-to-b from-amber-50 via-[#fffbeb] to-[#fef3c7] text-zinc-950 shadow-2xl relative grid grid-cols-3 grid-rows-3 p-1.5 items-center justify-items-center transition-all duration-300 transform hover:scale-105",
      isHighlighted ? "border-amber-400 ring-4 ring-amber-400/60 shadow-[0_0_25px_#f59e0b] scale-110" : "border-amber-900/40"
    )}>
      {pips.map((posClass, i) => (
        <span
          key={i}
          className={cn(
            "w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-gradient-to-b from-zinc-900 to-amber-950 shadow-inner inline-block",
            posClass,
            isHighlighted ? "bg-gradient-to-b from-amber-700 to-amber-950" : ""
          )}
        />
      ))}
    </div>
  );
}

// --- MAIN COMPONENT ---
export function TavernDiceGame() {
  const [goldBalance, setGoldBalance] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Game setup
  const [difficulty, setDifficulty] = useState<AIDifficulty>('normal');
  const [phase, setPhase] = useState<GamePhase>('difficultySelect');
  
  // Players state
  const [playerDiceCount, setPlayerDiceCount] = useState(5);
  const [computerDiceCount, setComputerDiceCount] = useState(5);

  // Dice values
  const [playerDice, setPlayerDice] = useState<number[]>([1, 2, 3, 4, 5]);
  const [computerDice, setComputerDice] = useState<number[]>([1, 2, 3, 4, 5]);

  // Turn & bidding
  const [startingPlayer, setStartingPlayer] = useState<'player' | 'computer'>('player');
  const [currentTurn, setCurrentTurn] = useState<'player' | 'computer'>('player');
  const [currentBid, setCurrentBid] = useState<Bid | null>(null);
  const [bidHistory, setBidHistory] = useState<Bid[]>([]);
  
  // Custom Player Raise Selectors
  const [selectedRaiseQty, setSelectedRaiseQty] = useState<number>(1);
  const [selectedRaiseFace, setSelectedRaiseFace] = useState<number>(1);

  // Challenge resolution state
  const [challengeInfo, setChallengeInfo] = useState<{
    challenger: 'player' | 'computer';
    bidder: 'player' | 'computer';
    bid: Bid;
    totalMatches: number;
    bidTruthful: boolean;
    loser: 'player' | 'computer';
  } | null>(null);

  // Stats sync
  const loadStats = async () => {
    try {
      const stats = await getCharacterStats();
      if (stats) setGoldBalance(stats.gold || 0);
    } catch (e) {
      console.error('Error loading stats:', e);
    }
  };

  useEffect(() => {
    loadStats();
    const handleStatsUpdate = () => loadStats();
    window.addEventListener('character-stats-update', handleStatsUpdate);
    return () => window.removeEventListener('character-stats-update', handleStatsUpdate);
  }, []);

  // Sync sound toggle
  useEffect(() => {
    tavernAudio.enabled = soundEnabled;
  }, [soundEnabled]);

  // --- START NEW GAME ---
  const startNewGame = (selectedDiff: AIDifficulty) => {
    setDifficulty(selectedDiff);
    setPlayerDiceCount(5);
    setComputerDiceCount(5);
    setStartingPlayer('player');
    startNewRound('player', 5, 5);
  };

  // --- START NEW ROUND ---
  const startNewRound = (starter: 'player' | 'computer', pCount: number, cCount: number) => {
    setPhase('rolling');
    setCurrentBid(null);
    setBidHistory([]);
    setChallengeInfo(null);
    setStartingPlayer(starter);

    // Roll player dice
    const pRolls: number[] = [];
    for (let i = 0; i < pCount; i++) {
      pRolls.push(Math.floor(Math.random() * 6) + 1);
    }
    pRolls.sort((a, b) => a - b);
    setPlayerDice(pRolls);

    // Roll computer dice
    const cRolls: number[] = [];
    for (let i = 0; i < cCount; i++) {
      cRolls.push(Math.floor(Math.random() * 6) + 1);
    }
    cRolls.sort((a, b) => a - b);
    setComputerDice(cRolls);

    tavernAudio.playDiceRoll();

    // After brief roll animation, transition to turn
    setTimeout(() => {
      setCurrentTurn(starter);
      if (starter === 'player') {
        setPhase('playerTurn');
        // Default initial player bid selectors
        setSelectedRaiseQty(1);
        setSelectedRaiseFace(1);
      } else {
        setPhase('computerTurn');
        triggerAITurn(cRolls, pCount, null, selectedDiffRef.current, []);
      }
    }, 1200);
  };

  const selectedDiffRef = useRef<AIDifficulty>(difficulty);
  useEffect(() => {
    selectedDiffRef.current = difficulty;
  }, [difficulty]);

  // --- COMPUTER TURN LOGIC ---
  const triggerAITurn = (
    cDice: number[],
    pCount: number,
    cBid: Bid | null,
    diff: AIDifficulty,
    history: Bid[]
  ) => {
    setPhase('computerTurn');

    setTimeout(() => {
      const decision = computeAIDecision(cDice, pCount, cBid, diff, history);

      if (decision.action === 'challenge' && cBid) {
        // AI Challenges Player's Bid
        executeChallenge('computer', cBid, cDice);
      } else if (decision.action === 'raise' && decision.nextBid) {
        // AI Raises
        const newBid = decision.nextBid;
        setCurrentBid(newBid);
        setBidHistory(prev => [newBid, ...prev]);
        setCurrentTurn('player');
        setPhase('playerTurn');

        // Set default player selectors to next valid higher bid
        setSelectedRaiseQty(newBid.quantity);
        setSelectedRaiseFace(Math.min(6, newBid.face + 1));
      }
    }, 1500);
  };

  // --- PLAYER ACTIONS ---
  const handlePlayerBid = (qty: number, face: number) => {
    if (phase !== 'playerTurn') return;

    // Validate bid is higher
    if (currentBid) {
      const isQtyHigher = qty > currentBid.quantity;
      const isFaceHigherSameQty = qty === currentBid.quantity && face > currentBid.face;
      const isValidRaise = isQtyHigher || isFaceHigherSameQty;

      if (!isValidRaise) {
        toast({
          title: "Invalid Bid!",
          description: `Bid must be higher in quantity (${currentBid.quantity}+) or higher in face value (${currentBid.face}+).`,
          variant: "destructive"
        });
        return;
      }
    }

    const newBid: Bid = { quantity: qty, face, bidder: 'player' };
    setCurrentBid(newBid);
    setBidHistory(prev => [newBid, ...prev]);

    // Pass turn to Computer
    triggerAITurn(computerDice, playerDiceCount, newBid, difficulty, [newBid, ...bidHistory]);
  };

  const handlePlayerChallenge = () => {
    if (phase !== 'playerTurn' || !currentBid) return;
    executeChallenge('player', currentBid, computerDice);
  };

  // --- EXECUTE CHALLENGE RESOLUTION ---
  const executeChallenge = (challenger: 'player' | 'computer', targetBid: Bid, cDice: number[]) => {
    setPhase('challengeRevealing');
    tavernAudio.playChallengeSound();

    // Count matching dice across BOTH players
    const allDice = [...playerDice, ...cDice];
    const totalMatches = allDice.filter(d => d === targetBid.face).length;
    const bidTruthful = totalMatches >= targetBid.quantity;
    const loser = bidTruthful ? challenger : targetBid.bidder;

    const info = {
      challenger,
      bidder: targetBid.bidder,
      bid: targetBid,
      totalMatches,
      bidTruthful,
      loser
    };

    setChallengeInfo(info);

    setTimeout(() => {
      setPhase('roundResult');

      // Deduct 1 die from loser
      let newPCount = playerDiceCount;
      let newCCount = computerDiceCount;

      if (loser === 'player') {
        newPCount = Math.max(0, playerDiceCount - 1);
        setPlayerDiceCount(newPCount);
        tavernAudio.playLossSound();
      } else {
        newCCount = Math.max(0, computerDiceCount - 1);
        setComputerDiceCount(newCCount);
        tavernAudio.playWinSound();
      }

      // Check for Game Over
      if (newPCount <= 0 || newCCount <= 0) {
        setTimeout(() => {
          setPhase('gameOver');
          if (newPCount > 0) {
            // Reward player with gold for victory
            const goldReward = difficulty === 'hard' ? 300 : difficulty === 'normal' ? 150 : 75;
            addToCharacterStat('gold', goldReward, 'liars-dice-win');
            setGoldBalance(prev => prev + goldReward);
          }
        }, 1500);
      }
    }, 2000);
  };

  // Continue next round
  const handleNextRound = () => {
    if (!challengeInfo) return;
    const nextStarter = challengeInfo.loser;
    startNewRound(nextStarter, playerDiceCount, computerDiceCount);
  };

  const totalDiceInPlay = playerDiceCount + computerDiceCount;

  return (
    <Card className="w-full max-w-4xl mx-auto bg-[#0f1117] border-amber-900/40 text-amber-100 shadow-2xl overflow-hidden relative font-sans">
      
      {/* HEADER BAR: Medieval Tavern Title & Audio Toggle */}
      <CardHeader className="bg-gradient-to-r from-amber-950 via-zinc-950 to-amber-950 border-b border-amber-900/40 py-4 px-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-950/80 border border-amber-500/40 rounded-xl shadow-inner">
              <Dices className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <CardTitle className="font-serif text-xl sm:text-2xl font-bold tracking-wider text-[#f5e6c8] flex items-center gap-2">
                Liar&apos;s Dice Tavern
                <Badge variant="outline" className="text-[10px] font-mono border-amber-500/40 text-amber-300 uppercase">
                  {difficulty} AI
                </Badge>
              </CardTitle>
              <CardDescription className="text-xs text-zinc-400">
                Outwit the tavern gambler in a medieval game of bluff & deduction
              </CardDescription>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1.5 bg-zinc-900/90 border border-amber-500/30 px-3 py-1.5 rounded-xl text-xs font-mono text-amber-300">
              <span>🪙</span> {formatGold(goldBalance)} Gold
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="text-zinc-400 hover:text-amber-300 hover:bg-amber-950/40 h-9 w-9 rounded-xl"
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-zinc-600" />}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 sm:p-6 space-y-6">

        {/* 1. DIFFICULTY SELECTION SCREEN */}
        {phase === 'difficultySelect' && (
          <div className="py-8 space-y-6 text-center animate-in fade-in duration-300">
            <div className="max-w-md mx-auto space-y-2">
              <h3 className="font-serif text-2xl font-bold text-[#f5e6c8]">Choose Opponent Difficulty</h3>
              <p className="text-xs text-zinc-400">
                Each opponent uses strict probability deduction and bluffing tactics. Select your tavern challenger:
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto">
              
              {/* Easy */}
              <button
                onClick={() => startNewGame('easy')}
                className="group p-5 bg-gradient-to-b from-zinc-900 to-zinc-950 hover:from-emerald-950/40 hover:to-zinc-900 border border-zinc-800 hover:border-emerald-500/50 rounded-2xl transition-all text-center space-y-2 shadow-lg hover:scale-105"
              >
                <div className="text-3xl">🍺</div>
                <h4 className="font-serif font-bold text-base text-emerald-300 group-hover:text-emerald-200">Easy</h4>
                <p className="text-[11px] text-zinc-400">Garrick the Novice. Makes simple bids and rarely challenges.</p>
                <Badge className="bg-emerald-950 text-emerald-300 border-emerald-500/30 text-[10px]">Prize: 75 Gold</Badge>
              </button>

              {/* Normal */}
              <button
                onClick={() => startNewGame('normal')}
                className="group p-5 bg-gradient-to-b from-zinc-900 to-zinc-950 hover:from-amber-950/40 hover:to-zinc-900 border border-zinc-800 hover:border-amber-500/50 rounded-2xl transition-all text-center space-y-2 shadow-lg hover:scale-105"
              >
                <div className="text-3xl">⚔️</div>
                <h4 className="font-serif font-bold text-base text-amber-300 group-hover:text-amber-200">Normal</h4>
                <p className="text-[11px] text-zinc-400">Barnaby the Gambler. Calculates exact probabilities based on visible dice.</p>
                <Badge className="bg-amber-950 text-amber-300 border-amber-500/30 text-[10px]">Prize: 150 Gold</Badge>
              </button>

              {/* Hard */}
              <button
                onClick={() => startNewGame('hard')}
                className="group p-5 bg-gradient-to-b from-zinc-900 to-zinc-950 hover:from-purple-950/40 hover:to-zinc-900 border border-zinc-800 hover:border-purple-500/50 rounded-2xl transition-all text-center space-y-2 shadow-lg hover:scale-105"
              >
                <div className="text-3xl">👑</div>
                <h4 className="font-serif font-bold text-base text-purple-300 group-hover:text-purple-200">Hard</h4>
                <p className="text-[11px] text-zinc-400">Master Malakor. Strategic bluffs, probability tracking & aggressive claims.</p>
                <Badge className="bg-purple-950 text-purple-300 border-purple-500/30 text-[10px]">Prize: 300 Gold</Badge>
              </button>
            </div>
          </div>
        )}

        {/* GAMEPLAY SCREEN */}
        {phase !== 'difficultySelect' && (
          <div className="space-y-6">

            {/* ATMOSPHERIC WOODEN TAVERN BOARD */}
            <div className="bg-gradient-to-b from-[#1a1410] via-[#120d0a] to-[#0a0705] border-2 border-amber-900/50 rounded-2xl p-5 shadow-2xl relative overflow-hidden space-y-6">
              
              {/* Candlelight ambient blur overlays */}
              <div className="absolute -top-12 -left-12 w-48 h-48 bg-amber-600/10 blur-3xl rounded-full pointer-events-none" />
              <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-amber-700/10 blur-3xl rounded-full pointer-events-none" />

              {/* 1. OPPONENT AREA */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-zinc-950/80 p-4 rounded-xl border border-white/10">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-950 to-zinc-900 border border-red-500/40 flex items-center justify-center text-2xl shadow-lg">
                      🎭
                    </div>
                    {currentTurn === 'computer' && phase === 'computerTurn' && (
                      <span className="absolute -top-1 -right-1 flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500" />
                      </span>
                    )}
                  </div>
                  <div>
                    <h4 className="font-serif font-bold text-sm text-zinc-200 flex items-center gap-2">
                      {difficulty === 'hard' ? 'Master Malakor' : difficulty === 'normal' ? 'Barnaby the Gambler' : 'Garrick the Novice'}
                    </h4>
                    <div className="flex items-center gap-2 text-xs text-zinc-400">
                      <span>Dice remaining:</span>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: computerDiceCount }).map((_, i) => (
                          <span key={i} className="text-amber-400 text-xs">🎲</span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Opponent Hidden Dice Cup Area */}
                <div className="flex items-center gap-2">
                  {computerDice.map((val, idx) => (
                    <Die3D
                      key={idx}
                      value={val}
                      isHidden={phase !== 'challengeRevealing' && phase !== 'roundResult' && phase !== 'gameOver'}
                      isHighlighted={
                        (phase === 'challengeRevealing' || phase === 'roundResult') &&
                        challengeInfo?.bid.face === val
                      }
                      size="md"
                    />
                  ))}
                </div>
              </div>

              {/* 2. CENTRAL BOARD BIDS DISPLAY & STATUS FEED */}
              <div className="bg-zinc-950/90 border border-amber-900/40 p-4 rounded-xl text-center space-y-3 shadow-inner">
                
                {/* Total Dice In Play Badge */}
                <div className="flex items-center justify-center gap-2 text-xs text-zinc-400 font-mono">
                  <span>Total Dice in Play:</span>
                  <Badge className="bg-amber-950 text-amber-300 border border-amber-500/30 font-extrabold text-xs">
                    {totalDiceInPlay} Dice ({playerDiceCount} You vs {computerDiceCount} Opponent)
                  </Badge>
                </div>

                {/* Current Bid Display Banner */}
                {currentBid ? (
                  <div className="space-y-1">
                    <div className="text-[11px] uppercase tracking-widest font-bold text-zinc-400">
                      Current Claimed Bid
                    </div>
                    <div className="inline-flex items-center gap-3 bg-gradient-to-r from-amber-950/90 via-zinc-950 to-amber-950/90 px-6 py-2.5 rounded-2xl border border-amber-500/50 shadow-xl">
                      <span className="text-xl font-mono font-black text-amber-300">
                        {currentBid.quantity} ×
                      </span>
                      <Die3D value={currentBid.face} isHighlighted size="sm" />
                      <span className="text-xs font-serif font-bold text-zinc-300">
                        ({currentBid.quantity} {currentBid.face === 1 ? 'Ones' : currentBid.face === 2 ? 'Twos' : currentBid.face === 3 ? 'Threes' : currentBid.face === 4 ? 'Fours' : currentBid.face === 5 ? 'Fives' : 'Sixes'})
                      </span>
                      <Badge className={currentBid.bidder === 'player' ? 'bg-blue-950 text-blue-300 border-blue-500/40 text-[10px]' : 'bg-red-950 text-red-300 border-red-500/40 text-[10px]'}>
                        By {currentBid.bidder === 'player' ? 'You' : 'Opponent'}
                      </Badge>
                    </div>
                  </div>
                ) : (
                  <div className="text-sm font-serif italic text-amber-200/80 py-2">
                    {startingPlayer === 'player' ? 'Your turn to open the bidding!' : 'Opponent is opening the bidding...'}
                  </div>
                )}

                {/* Status Message / Thinking Banner */}
                {phase === 'computerTurn' && (
                  <div className="text-xs text-amber-400 font-serif italic animate-pulse flex items-center justify-center gap-2">
                    <Swords className="w-4 h-4 animate-spin" /> Opponent is contemplating the dice...
                  </div>
                )}

                {phase === 'rolling' && (
                  <div className="text-xs text-amber-300 font-serif italic animate-pulse">
                    🎲 Shaking dice cups onto the wooden table...
                  </div>
                )}
              </div>

              {/* 3. PLAYER AREA */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-zinc-950/80 p-4 rounded-xl border border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-950 to-zinc-900 border border-blue-500/40 flex items-center justify-center text-2xl shadow-lg">
                    🧙‍♂️
                  </div>
                  <div>
                    <h4 className="font-serif font-bold text-sm text-zinc-200 flex items-center gap-2">
                      Your Hand
                    </h4>
                    <div className="flex items-center gap-2 text-xs text-zinc-400">
                      <span>Dice remaining:</span>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: playerDiceCount }).map((_, i) => (
                          <span key={i} className="text-amber-400 text-xs">🎲</span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Player Visible Dice */}
                <div className="flex items-center gap-2">
                  {playerDice.map((val, idx) => (
                    <Die3D
                      key={idx}
                      value={val}
                      isHighlighted={
                        (phase === 'challengeRevealing' || phase === 'roundResult') &&
                        challengeInfo?.bid.face === val
                      }
                      size="md"
                    />
                  ))}
                </div>
              </div>

            </div>

            {/* 4. PLAYER CONTROLS & BIDDING INTERFACE */}
            {phase === 'playerTurn' && (
              <div className="bg-zinc-950 border border-amber-900/40 rounded-2xl p-5 space-y-4 shadow-xl animate-in zoom-in-95 duration-200">
                
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <h4 className="font-serif font-bold text-sm text-amber-300 flex items-center gap-2">
                    <span>⚡ Your Turn — Choose Action</span>
                  </h4>
                  <span className="text-xs text-zinc-400">
                    Must increase Quantity or Face Value
                  </span>
                </div>

                {/* Action Controls Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                  {/* ACTION 1: RAISE QUANTITY */}
                  <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-3.5 space-y-3 flex flex-col justify-between">
                    <div>
                      <div className="text-xs font-serif font-bold text-amber-400">1. Raise Quantity</div>
                      <p className="text-[10px] text-zinc-400">Keep face value, increase total dice count.</p>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-zinc-400">Quantity:</span>
                        <span className="font-mono font-bold text-amber-300">{selectedRaiseQty}</span>
                      </div>
                      <div className="grid grid-cols-5 gap-1">
                        {Array.from({ length: Math.min(10, totalDiceInPlay) }).map((_, i) => {
                          const q = i + 1;
                          const isValid = currentBid ? (q > currentBid.quantity || (q === currentBid.quantity && selectedRaiseFace > currentBid.face)) : true;
                          return (
                            <Button
                              key={q}
                              size="sm"
                              variant={selectedRaiseQty === q ? "default" : "outline"}
                              disabled={!isValid}
                              onClick={() => setSelectedRaiseQty(q)}
                              className={`h-7 text-xs font-mono p-0 ${selectedRaiseQty === q ? 'bg-amber-600 hover:bg-amber-500 text-black font-bold' : ''}`}
                            >
                              {q}
                            </Button>
                          );
                        })}
                      </div>

                      <Button
                        onClick={() => handlePlayerBid(selectedRaiseQty, currentBid ? currentBid.face : selectedRaiseFace)}
                        disabled={currentBid ? selectedRaiseQty <= currentBid.quantity : false}
                        className="w-full h-9 bg-amber-700 hover:bg-amber-600 text-black font-bold text-xs rounded-lg shadow mt-2"
                      >
                        Bid {selectedRaiseQty} × {currentBid ? currentBid.face : selectedRaiseFace}
                      </Button>
                    </div>
                  </div>

                  {/* ACTION 2: RAISE FACE VALUE */}
                  <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-3.5 space-y-3 flex flex-col justify-between">
                    <div>
                      <div className="text-xs font-serif font-bold text-amber-400">2. Raise Face Value</div>
                      <p className="text-[10px] text-zinc-400">Keep quantity, increase face number.</p>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-zinc-400">Face Value:</span>
                        <span className="font-mono font-bold text-amber-300">{selectedRaiseFace}</span>
                      </div>
                      <div className="grid grid-cols-6 gap-1">
                        {[1, 2, 3, 4, 5, 6].map(f => {
                          const isValid = currentBid ? (selectedRaiseQty > currentBid.quantity || (selectedRaiseQty === currentBid.quantity && f > currentBid.face)) : true;
                          return (
                            <Button
                              key={f}
                              size="sm"
                              variant={selectedRaiseFace === f ? "default" : "outline"}
                              disabled={!isValid}
                              onClick={() => setSelectedRaiseFace(f)}
                              className={`h-7 text-xs font-mono p-0 ${selectedRaiseFace === f ? 'bg-amber-600 hover:bg-amber-500 text-black font-bold' : ''}`}
                            >
                              {f}
                            </Button>
                          );
                        })}
                      </div>

                      <Button
                        onClick={() => handlePlayerBid(currentBid ? currentBid.quantity : selectedRaiseQty, selectedRaiseFace)}
                        disabled={currentBid ? (selectedRaiseFace <= currentBid.face && selectedRaiseQty <= currentBid.quantity) : false}
                        className="w-full h-9 bg-amber-700 hover:bg-amber-600 text-black font-bold text-xs rounded-lg shadow mt-2"
                      >
                        Bid {currentBid ? currentBid.quantity : selectedRaiseQty} × {selectedRaiseFace}
                      </Button>
                    </div>
                  </div>

                  {/* ACTION 3: CALL LIAR (CHALLENGE) */}
                  <div className="bg-gradient-to-b from-red-950/80 via-zinc-900 to-red-950/80 border border-red-500/40 rounded-xl p-3.5 space-y-3 flex flex-col justify-between shadow-xl">
                    <div>
                      <div className="text-xs font-serif font-bold text-red-300 flex items-center gap-1.5">
                        <Skull className="w-4 h-4 text-red-400" /> 3. Call Liar
                      </div>
                      <p className="text-[10px] text-red-200 opacity-80">
                        Challenge opponent&apos;s claim! Reveal all dice. Loser loses 1 die.
                      </p>
                    </div>

                    <Button
                      onClick={handlePlayerChallenge}
                      disabled={!currentBid}
                      className="w-full h-14 bg-gradient-to-r from-red-700 via-red-600 to-red-700 hover:from-red-600 hover:to-red-500 text-white font-serif font-black tracking-widest uppercase text-sm border border-red-400 shadow-xl active:scale-95 disabled:opacity-40"
                    >
                      🔥 CALL LIAR!
                    </Button>
                  </div>

                </div>

              </div>
            )}

            {/* 5. CHALLENGE REVEAL / ROUND RESULT MODAL */}
            {(phase === 'challengeRevealing' || phase === 'roundResult') && challengeInfo && (
              <div className="bg-zinc-950 border-2 border-amber-500/50 rounded-2xl p-6 text-center space-y-4 shadow-2xl animate-in zoom-in-95 duration-300">
                <Badge className="bg-amber-950 text-amber-300 border border-amber-500/40 text-xs uppercase font-serif px-3 py-1">
                  Challenge Resolution
                </Badge>

                <div className="space-y-2">
                  <h3 className="font-serif text-2xl font-bold text-[#f5e6c8]">
                    {challengeInfo.bidTruthful ? 'TRUTH!' : 'LIAR!'}
                  </h3>

                  <div className="text-sm text-zinc-300 max-w-md mx-auto">
                    Claimed Bid: <strong className="text-amber-300">{challengeInfo.bid.quantity} × {challengeInfo.bid.face}s</strong> by <strong className="text-zinc-100">{challengeInfo.bidder === 'player' ? 'You' : 'Opponent'}</strong>.
                  </div>

                  <div className="inline-flex items-center gap-2 bg-zinc-900 border border-amber-500/30 px-4 py-2 rounded-xl text-xs font-mono text-amber-200">
                    <span>Actual Total Found:</span>
                    <strong className="text-base text-amber-400 font-mono">{challengeInfo.totalMatches} × {challengeInfo.bid.face}s</strong>
                  </div>
                </div>

                <div className="p-3 bg-red-950/80 border border-red-500/40 rounded-xl text-xs text-red-200 font-bold max-w-md mx-auto">
                  {challengeInfo.loser === 'player' ? (
                    <span>😭 You lost the challenge and lost 1 die!</span>
                  ) : (
                    <span>🎉 Opponent was wrong! Opponent lost 1 die!</span>
                  )}
                </div>

                {phase === 'roundResult' && (
                  <Button
                    onClick={handleNextRound}
                    size="lg"
                    className="bg-amber-600 hover:bg-amber-500 text-black font-serif font-bold text-sm px-8 shadow-xl mt-2"
                  >
                    Start Next Round &rarr;
                  </Button>
                )}
              </div>
            )}

            {/* 6. GAME OVER SCREEN (VICTORY / DEFEAT) */}
            {phase === 'gameOver' && (
              <div className="bg-zinc-950 border-2 border-amber-500/60 rounded-2xl p-8 text-center space-y-6 shadow-2xl animate-in zoom-in-95 duration-500">
                {playerDiceCount > 0 ? (
                  <div className="space-y-3">
                    <Trophy className="w-16 h-16 text-amber-400 mx-auto filter drop-shadow-[0_0_20px_#f59e0b] animate-bounce" />
                    <h2 className="font-serif text-3xl font-black text-amber-300 tracking-wider uppercase">VICTORY!</h2>
                    <p className="text-sm text-zinc-300 max-w-md mx-auto">
                      You have outwitted the tavern&apos;s finest liar and claimed your prize!
                    </p>
                    <Badge className="bg-emerald-950 text-emerald-300 border border-emerald-500/40 text-sm px-4 py-1 font-mono">
                      +{(difficulty === 'hard' ? 300 : difficulty === 'normal' ? 150 : 75)} Gold Earned 🪙
                    </Badge>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <Skull className="w-16 h-16 text-red-500 mx-auto filter drop-shadow-[0_0_20px_#ef4444]" />
                    <h2 className="font-serif text-3xl font-black text-red-400 tracking-wider uppercase">DEFEAT!</h2>
                    <p className="text-sm text-zinc-300 max-w-md mx-auto">
                      The dice have betrayed you. Better luck at the tavern tables next time!
                    </p>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
                  <Button
                    onClick={() => startNewGame(difficulty)}
                    size="lg"
                    className="w-full sm:w-auto bg-amber-600 hover:bg-amber-500 text-black font-serif font-bold text-sm px-6"
                  >
                    <RotateCcw className="w-4 h-4 mr-2" /> Play Again
                  </Button>

                  <Button
                    onClick={() => setPhase('difficultySelect')}
                    variant="outline"
                    size="lg"
                    className="w-full sm:w-auto border-amber-900/50 text-amber-200 hover:bg-amber-950/40 font-serif font-bold text-sm px-6"
                  >
                    Change Opponent
                  </Button>
                </div>
              </div>
            )}

          </div>
        )}

      </CardContent>
    </Card>
  );
}
