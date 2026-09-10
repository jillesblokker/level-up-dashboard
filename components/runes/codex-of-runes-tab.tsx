"use client";

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import {
  ALL_RUNES,
  RuneDefinition,
  CipherLetter,
  CIPHER_WORDS,
  CIPHER_SENTENCE,
  getCipherProgress,
  isCipherSolved,
  getCollectedRuneIds,
  getCollectedPlacements,
  RUNE_COLLECTED_EVENT,
  WORD_HUNT_TIERS,
  WordHuntTier,
  letterToRuneSymbol,
  getInscribedWords,
  getInscribedTiersProgress,
  inscribeWord,
  RUNE_WORD_INSCRIBED_EVENT,
  INSCRIBED_WORDS_STORAGE_KEY,
  CRYPTO_UNLOCKED_STORAGE_KEY,
} from '@/lib/runes-service';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Sparkles,
  Trophy,
  Compass,
  Lock,
  Unlock,
  RotateCcw,
  Volume2,
  Shield,
  Eye,
  EyeOff,
  BookOpen,
  KeyRound,
  CheckCircle2,
  Feather,
  Send,
  Delete,
  HelpCircle,
  Star,
  Zap,
  Crosshair,
  Sword,
} from 'lucide-react';
import { playSFX } from '@/lib/sound-manager';
import { hapticLight, hapticMedium, hapticSuccess } from '@/lib/haptics';
import { toast } from '@/components/ui/use-toast';
import { setUserPreference, getUserPreference } from '@/lib/user-preferences-manager';
import { updateCharacterStats, getCharacterStats } from '@/lib/character-stats-service';
import { useCreatureStore } from '@/stores/creatureStore';

const CIPHER_CLAIMED_KEY = 'thrivehaven_runic_cipher_claimed';

export function CodexOfRunesTab() {
  const [unlockedRuneIds, setUnlockedRuneIds] = useState<string[]>([]);
  const [collectedPlacements, setCollectedPlacements] = useState<string[]>([]);
  const [activeRuneModal, setActiveRuneModal] = useState<RuneDefinition | null>(null);
  const [selectedAett, setSelectedAett] = useState<'all' | 'freyr' | 'heimdall' | 'tyr'>('all');
  const [showFullDecryption, setShowFullDecryption] = useState<boolean>(false);
  const [showAlphabetKey, setShowAlphabetKey] = useState<boolean>(false);
  const [isCipherClaimed, setIsCipherClaimed] = useState<boolean>(false);

  // Word hunt / Long Codex state
  const [inscribedWords, setInscribedWords] = useState<string[]>([]);
  const [inputWord, setInputWord] = useState<string>('');
  const [isCryptoClaimed, setIsCryptoClaimed] = useState<boolean>(false);
  const [isCryptoCardFlipped, setIsCryptoCardFlipped] = useState<boolean>(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const refreshState = () => {
    setUnlockedRuneIds(getCollectedRuneIds());
    setCollectedPlacements(getCollectedPlacements());
    setInscribedWords(getInscribedWords());
  };

  useEffect(() => {
    refreshState();

    // Check if cipher reward was claimed
    try {
      const localClaimed = localStorage.getItem(CIPHER_CLAIMED_KEY) === 'true';
      setIsCipherClaimed(localClaimed);

      const cryptoClaimed = localStorage.getItem(CRYPTO_UNLOCKED_STORAGE_KEY) === 'true';
      setIsCryptoClaimed(cryptoClaimed);

      getUserPreference(CIPHER_CLAIMED_KEY).then((val) => {
        if (val === true) setIsCipherClaimed(true);
      }).catch(() => {});

      getUserPreference(CRYPTO_UNLOCKED_STORAGE_KEY).then((val) => {
        if (val === true) setIsCryptoClaimed(true);
      }).catch(() => {});
    } catch {}

    const handleUpdate = () => {
      refreshState();
    };

    window.addEventListener(RUNE_COLLECTED_EVENT, handleUpdate);
    window.addEventListener(RUNE_WORD_INSCRIBED_EVENT, handleUpdate);
    return () => {
      window.removeEventListener(RUNE_COLLECTED_EVENT, handleUpdate);
      window.removeEventListener(RUNE_WORD_INSCRIBED_EVENT, handleUpdate);
    };
  }, []);

  const totalRunes = ALL_RUNES.length;
  const unlockedCount = unlockedRuneIds.length;
  const progressPercent = (unlockedCount / totalRunes) * 100;
  const isMaster = unlockedCount === totalRunes;

  // Cipher calculation
  const cipherProgress = getCipherProgress(unlockedRuneIds);
  const cipherSolved = isCipherSolved(unlockedRuneIds);

  // Long codex / Word hunt progress
  const wordHuntProgress = getInscribedTiersProgress();
  const allWordTiersComplete = wordHuntProgress.isAllComplete;

  // If all tiers complete, automatically ensure Crypto is unlocked in creature store
  useEffect(() => {
    if (allWordTiersComplete) {
      try {
        useCreatureStore.getState().discoverCreature('019');
      } catch (e) {
        console.error(e);
      }
    }
  }, [allWordTiersComplete]);

  const filteredRunes = selectedAett === 'all'
    ? ALL_RUNES
    : ALL_RUNES.filter((r) => r.aett === selectedAett);

  // Alphabetical list of runes for translation key (A–Z)
  const alphabetRunes = [...ALL_RUNES].sort((a, b) => a.letter.localeCompare(b.letter));

  const handleRuneClick = (rune: RuneDefinition, isUnlocked: boolean) => {
    if (isUnlocked) {
      playSFX('achievement');
      hapticSuccess();
      setActiveRuneModal(rune);
    } else {
      toast({
        title: `Undiscovered rune (${rune.aettLabel})`,
        description: rune.hint,
      });
    }
  };

  const handleLetterTileClick = (letterItem: CipherLetter, isUnlocked: boolean) => {
    const runeDef = ALL_RUNES.find((r) => r.id === letterItem.runeId);
    playSFX('streak');
    hapticLight();

    if (isUnlocked && runeDef) {
      toast({
        title: `${letterItem.symbol} = "${letterItem.letter}" (${letterItem.name})`,
        description: `${runeDef.meaning}. Connected in your codex.`,
      });
    } else if (runeDef) {
      toast({
        title: `Veiled letter: "${letterItem.letter}"`,
        description: `Corresponds to ${letterItem.name} (${letterItem.symbol}). Find its hiding place in the realm to illuminate it.`,
      });
    }
  };

  const handleClaimCipherReward = async () => {
    if (isCipherClaimed || !cipherSolved) return;

    playSFX('achievement');
    hapticSuccess();
    setIsCipherClaimed(true);

    try {
      localStorage.setItem(CIPHER_CLAIMED_KEY, 'true');
      await setUserPreference(CIPHER_CLAIMED_KEY, true);

      // Award 300 gold, 500 XP, and legendary title
      const currentStats = getCharacterStats();
      updateCharacterStats({
        gold: (currentStats.gold || 0) + 300,
        experience: (currentStats.experience || 0) + 500,
        title: 'Cipherbreaker of the ancients',
      }, 'runic_cipher_solved');

      toast({
        title: '✦ Ancient blessing bestowed ✦',
        description: 'Necrion recognizes your wisdom. You received +300 gold, +500 exp, and the title "Cipherbreaker of the ancients".',
      });
    } catch (e) {
      console.error(e);
    }
  };

  // Submit word into the long codex
  const handleSubmitWord = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const word = inputWord.trim().toUpperCase();
    if (!word) {
      toast({
        title: 'Empty inscription',
        description: 'Enter a word using the runes to inscribe it into the codex.',
      });
      return;
    }

    const res = await inscribeWord(word);
    if (res.success && res.tier) {
      playSFX('achievement');
      hapticSuccess();
      setInputWord('');
      setInscribedWords(getInscribedWords());

      if (res.allTiersComplete) {
        useCreatureStore.getState().discoverCreature('019');
        toast({
          title: '✦ The long codex is complete! ✦',
          description: `All eight tiers from shortest to longest have been carved! The ancient crocodile guardian Crypto awakens!`,
        });
      } else {
        toast({
          title: `✦ Word carved: ${res.word} ✦`,
          description: `${res.tier.label} unsealed! (${res.completedTiersCount} of ${res.totalTiers} tiers completed)`,
        });
      }
    } else if (res.alreadyInscribed) {
      playSFX('streak');
      hapticMedium();
      toast({
        title: 'Already carved',
        description: `The word "${word}" is already recorded in your long codex.`,
      });
    } else {
      hapticMedium();
      toast({
        title: 'The runes remain silent',
        description: `"${word}" does not resonate with Necrion's prophecy. Inspect the cipher above for clues!`,
      });
    }
  };

  const handleClearInput = () => {
    setInputWord('');
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleAppendLetter = (char: string) => {
    if (inputWord.length >= 10) return;
    hapticLight();
    playSFX('click');
    setInputWord((prev) => (prev + char).slice(0, 10));
  };

  const handleClaimCryptoReward = async () => {
    if (isCryptoClaimed || !allWordTiersComplete) return;

    playSFX('achievement');
    hapticSuccess();
    setIsCryptoClaimed(true);

    try {
      localStorage.setItem(CRYPTO_UNLOCKED_STORAGE_KEY, 'true');
      await setUserPreference(CRYPTO_UNLOCKED_STORAGE_KEY, true);

      // Award 500 gold, 1000 XP, and Keeper of Crypto title
      const currentStats = getCharacterStats();
      updateCharacterStats({
        gold: (currentStats.gold || 0) + 500,
        experience: (currentStats.experience || 0) + 1000,
        title: 'Keeper of Crypto',
      }, 'crypto_creature_unlocked');

      useCreatureStore.getState().discoverCreature('019');

      toast({
        title: '✦ Crocodile guardian Crypto awakened! ✦',
        description: 'Crypto has joined your creature collection! You received +500 gold, +1000 exp, and the title "Keeper of Crypto".',
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handleResetRunes = async () => {
    if (confirm('Reset all collected runes so you can discover them again throughout the realm?')) {
      try {
        localStorage.removeItem('thrivehaven_collected_rune_placements');
        localStorage.removeItem(CIPHER_CLAIMED_KEY);
        localStorage.removeItem(INSCRIBED_WORDS_STORAGE_KEY);
        localStorage.removeItem(CRYPTO_UNLOCKED_STORAGE_KEY);
        setIsCipherClaimed(false);
        setIsCryptoClaimed(false);
        setInputWord('');
        await setUserPreference('thrivehaven_collected_rune_placements', []);
        await setUserPreference(CIPHER_CLAIMED_KEY, false);
        await setUserPreference(INSCRIBED_WORDS_STORAGE_KEY, []);
        await setUserPreference(CRYPTO_UNLOCKED_STORAGE_KEY, false);
        window.dispatchEvent(new CustomEvent(RUNE_COLLECTED_EVENT, { detail: { reset: true } }));
        refreshState();
        toast({
          title: 'Runes dispersed',
          description: 'All 24 elder runes have returned to their hiding places across the realm.',
        });
      } catch (e) {
        console.error(e);
      }
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* ─── 1. HERO BANNER ────────────────────────────────────────────── */}
      <div className="relative rounded-3xl overflow-hidden border border-amber-500/40 bg-gradient-to-br from-zinc-950 via-[#130d06] to-zinc-950 p-6 sm:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <Badge className="bg-amber-500/20 text-amber-300 border border-amber-500/40 font-mono text-xs px-2.5 py-0.5">
                ✦ Sacred elder futhark
              </Badge>
              {isMaster && (
                <Badge className="bg-gradient-to-r from-amber-500 to-amber-300 text-zinc-950 font-bold text-xs px-2.5 py-0.5 shadow-md">
                  Elder runic master
                </Badge>
              )}
            </div>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-amber-100 flex items-center gap-3">
              <span>Codex of the 24 elder runes</span>
              <span className="font-mono text-amber-400 text-base sm:text-lg">ᚠ ᚢ ᚦ ᚨ ᚱ ᚲ ᚷ ᚹ</span>
            </h2>
            <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
              The 24 historical Elder Futhark runes lie scattered across Thrivehaven. Seek their subtle resonance throughout the realm to awaken their ancient power into your codex.
            </p>
          </div>

          <div className="w-full md:w-64 bg-zinc-900/80 border border-amber-500/30 p-4 rounded-2xl flex flex-col gap-2 shadow-inner">
            <div className="flex justify-between items-center text-xs font-mono">
              <span className="text-zinc-400">Codex completion</span>
              <span className="text-amber-300 font-bold">{unlockedCount} / {totalRunes}</span>
            </div>
            <Progress value={progressPercent} className="h-2 bg-zinc-950" />
            <p className="text-[11px] text-zinc-400 italic text-right">
              {isMaster ? 'All 24 sacred runes awakened' : `${totalRunes - unlockedCount} runes remaining`}
            </p>
          </div>
        </div>

        {/* Master unlocked celebration banner */}
        {isMaster && (
          <div className="mt-6 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Trophy className="w-6 h-6 text-amber-400 animate-bounce shrink-0" />
              <div>
                <p className="text-sm font-bold text-amber-200 font-serif">Elder runic master of Thrivehaven</p>
                <p className="text-xs text-zinc-300">You have bound all 24 ancient Elder Futhark runes to your codex.</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetRunes}
              className="border-amber-500/40 text-amber-300 hover:bg-amber-950 text-xs rounded-xl h-8 gap-1.5 w-full sm:w-auto"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Re-hide for hunt
            </Button>
          </div>
        )}
      </div>

      {/* ─── 2. NECRION'S LORE & STORY CARD ────────────────────────────── */}
      <div className="relative rounded-3xl overflow-hidden border border-emerald-500/30 bg-gradient-to-br from-zinc-950 via-[#0a120c] to-zinc-950 p-6 sm:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 -mt-16 -mr-16 w-60 h-60 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center gap-5 sm:gap-6">
          {/* Necrion Avatar */}
          <div className="relative shrink-0 group">
            <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 opacity-30 blur group-hover:opacity-60 transition duration-500" />
            <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden border-2 border-emerald-500/50 shadow-xl bg-zinc-950">
              <Image
                src="/images/creatures/Necrion.webp"
                alt="Necrion, speaker of ancient echoes"
                width={96}
                height={96}
                className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
                priority
              />
            </div>
          </div>

          {/* Dialogue & Lore */}
          <div className="space-y-2.5 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-mono text-[11px] px-2.5 py-0.5 flex items-center gap-1.5">
                <Feather className="w-3 h-3 text-emerald-400" />
                Lorekeeper of the shadows
              </Badge>
              <span className="text-xs font-serif text-zinc-400">
                Necrion, speaker of ancient echoes
              </span>
            </div>

            <div className="relative p-4 rounded-2xl bg-zinc-950/70 border border-emerald-500/20 shadow-inner">
              <p className="text-xs sm:text-sm text-zinc-200 leading-relaxed font-sans italic">
                &ldquo;Mortal traveler... you walk through Thrivehaven seeing busy markets and stone towers, yet beneath every cobblestone whispers the Elder Futhark. The ancients did not carve these glyphs for simple ornament—they etched them as mirrors to human perseverance. They will never reveal themselves to the hurried or the idle. Only those with patient curiosity, unbroken daily discipline, and quiet bravery will sense where the runes sleep.
              </p>
              <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed mt-2 font-sans">
                Long ago, we sealed our sacred creed into the stone cipher below. Each rune represents both an ancient concept and a living letter of your tongue. Learn the runes, connect their glyphs to letters, and inscribe every word length—from the shortest to the longest—into the codex to summon Crypto, the ancient crocodile guardian.&rdquo;
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ─── 3. NECRION'S SECRET CIPHER TABLET ─────────────────────────── */}
      <div className="relative rounded-3xl overflow-hidden border border-amber-500/40 bg-gradient-to-b from-zinc-950 via-[#140e06] to-zinc-950 p-6 sm:p-8 shadow-2xl space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-amber-500/20">
          <div>
            <div className="flex items-center gap-2">
              <Badge className="bg-amber-500/15 text-amber-300 border border-amber-500/30 font-mono text-xs px-2.5 py-0.5">
                ✦ Inscribed prophecy
              </Badge>
              {cipherSolved && (
                <Badge className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold text-xs px-2 py-0.5 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  Prophecy unsealed
                </Badge>
              )}
            </div>
            <h3 className="text-xl sm:text-2xl font-serif font-bold text-amber-100 mt-1">
              The secret prophecy of Necrion
            </h3>
            <p className="text-xs sm:text-sm text-zinc-400">
              Connect the elder runes to their alphabet letters to decode the secret creed of habit building and bravery.
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2 self-stretch sm:self-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAlphabetKey(!showAlphabetKey)}
              className="border-amber-500/30 text-amber-300 hover:bg-amber-950 text-xs rounded-xl h-8 gap-1.5"
            >
              <KeyRound className="w-3.5 h-3.5" />
              {showAlphabetKey ? 'Hide alphabet key' : 'Show alphabet key'}
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFullDecryption(!showFullDecryption)}
              className="border-amber-500/30 text-amber-300 hover:bg-amber-950 text-xs rounded-xl h-8 gap-1.5"
            >
              {showFullDecryption ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              {showFullDecryption ? 'Hide deciphered text' : 'Decode all letters'}
            </Button>
          </div>
        </div>

        {/* Real-time Decipher Progress Bar */}
        <div className="p-4 rounded-2xl bg-zinc-900/80 border border-amber-500/20 space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs font-mono gap-1">
            <span className="text-zinc-400">
              Decipher progress: <strong className="text-amber-300">{cipherProgress.percent}%</strong> ({cipherProgress.unlockedUniqueRunes} of {cipherProgress.totalUniqueRunes} cipher runes awakened)
            </span>
            <span className="text-zinc-500">
              {cipherProgress.unlockedLettersCount} / {cipherProgress.totalLettersCount} letters revealed
            </span>
          </div>
          <Progress value={cipherProgress.percent} className="h-2 bg-zinc-950" />
        </div>

        {/* ─── INTERACTIVE STONE CIPHER TABLET ─── */}
        <div className="p-5 sm:p-7 rounded-2xl bg-black/60 border border-amber-500/30 shadow-inner">
          <div className="flex flex-wrap gap-y-5 gap-x-6 sm:gap-x-8 items-center justify-center">
            {CIPHER_WORDS.map((wordObj, wordIdx) => (
              <div key={wordIdx} className="inline-flex items-center gap-1 sm:gap-1.5">
                {wordObj.letters.map((letterItem, letterIdx) => {
                  const isUnlocked = unlockedRuneIds.includes(letterItem.runeId);
                  const isRevealed = isUnlocked || showFullDecryption;

                  return (
                    <button
                      key={letterIdx}
                      onClick={() => handleLetterTileClick(letterItem, isUnlocked)}
                      className={`group flex flex-col items-center justify-center w-8 sm:w-11 h-14 sm:h-16 rounded-xl border transition-all duration-200 select-none ${
                        isUnlocked
                          ? 'bg-amber-500/15 border-amber-500/50 hover:border-amber-300 hover:scale-105 shadow-[0_0_12px_rgba(245,158,11,0.2)]'
                          : isRevealed
                          ? 'bg-zinc-900/90 border-zinc-700 hover:border-zinc-500'
                          : 'bg-zinc-950/80 border-zinc-800/90 hover:border-zinc-700 opacity-70 hover:opacity-100'
                      }`}
                      title={`${letterItem.symbol} = ${letterItem.letter} (${letterItem.name})`}
                    >
                      {/* Runic glyph */}
                      <span
                        className={`font-mono text-base sm:text-xl font-bold leading-none transition-colors ${
                          isUnlocked
                            ? 'text-amber-300 drop-shadow-[0_0_8px_rgba(245,158,11,0.7)]'
                            : 'text-zinc-600'
                        }`}
                      >
                        {isUnlocked ? letterItem.symbol : '᛬'}
                      </span>

                      {/* Latin letter */}
                      <span
                        className={`mt-1 font-serif text-xs sm:text-sm font-bold leading-none ${
                          isUnlocked
                            ? 'text-amber-100'
                            : isRevealed
                            ? 'text-zinc-400 font-mono text-[11px]'
                            : 'text-zinc-700'
                        }`}
                      >
                        {isRevealed ? letterItem.letter : '·'}
                      </span>
                    </button>
                  );
                })}

                {wordObj.punctuation && (
                  <span className="font-serif text-lg sm:text-xl font-bold text-amber-400/80 self-end mb-1 sm:mb-2 ml-0.5">
                    {wordObj.punctuation}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Translation Banner / Solved Message Reveal */}
        {(showFullDecryption || cipherSolved) && (
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/40 text-center space-y-1 animate-in fade-in zoom-in-95 duration-300">
            <span className="text-[11px] font-mono text-amber-400 uppercase tracking-wider block">
              Decoded ancient inscription
            </span>
            <p className="text-base sm:text-lg font-serif font-bold text-amber-200">
              &ldquo;{CIPHER_SENTENCE}.&rdquo;
            </p>
          </div>
        )}

        {/* Prophecy Solved Claim Reward Banner */}
        {cipherSolved && (
          <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-500/20 via-emerald-500/10 to-amber-500/20 border border-amber-500/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Sparkles className="w-6 h-6 text-amber-300 animate-spin shrink-0" style={{ animationDuration: '6s' }} />
              <div>
                <p className="text-sm font-bold text-amber-200 font-serif">
                  The ancient creed has been awakened
                </p>
                <p className="text-xs text-zinc-300">
                  You have united the runes of bravery, curiosity, and daily discipline.
                </p>
              </div>
            </div>

            <Button
              onClick={handleClaimCipherReward}
              disabled={isCipherClaimed}
              className={`text-xs font-bold rounded-xl h-9 px-4 shrink-0 w-full sm:w-auto ${
                isCipherClaimed
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 cursor-default'
                  : 'btn-primary-cta text-zinc-950 font-bold'
              }`}
            >
              {isCipherClaimed ? '✓ Blessing claimed' : 'Claim Necrion\'s blessing (+300 gold, +500 exp)'}
            </Button>
          </div>
        )}
      </div>

      {/* ─── 4. THE LONG CODEX WORD HUNT & CRYPTO REWARD ────────────────── */}
      <div className="relative rounded-3xl overflow-hidden border border-emerald-500/40 bg-gradient-to-b from-zinc-950 via-[#0b140e] to-zinc-950 p-6 sm:p-8 shadow-2xl space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-emerald-500/20">
          <div>
            <div className="flex items-center gap-2">
              <Badge className="bg-emerald-500/15 text-emerald-300 border border-emerald-500/40 font-mono text-xs px-2.5 py-0.5">
                ✦ Grand achievement hunt
              </Badge>
              {allWordTiersComplete && (
                <Badge className="bg-gradient-to-r from-emerald-500 to-teal-400 text-zinc-950 font-bold text-xs px-2.5 py-0.5 shadow-md flex items-center gap-1">
                  <Trophy className="w-3 h-3" />
                  All 8 tiers mastered
                </Badge>
              )}
            </div>
            <h3 className="text-xl sm:text-2xl font-serif font-bold text-emerald-100 mt-1">
              The long codex of words
            </h3>
            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
              Inscribe words into the 10-slot stone console based on the longest word. Enter the shortest word (3 letters), the longest (10 letters), and each length in between to summon the legendary crocodile guardian Crypto!
            </p>
          </div>

          <div className="w-full sm:w-60 bg-zinc-900/80 border border-emerald-500/30 p-3.5 rounded-2xl flex flex-col gap-1.5 shadow-inner">
            <div className="flex justify-between items-center text-xs font-mono">
              <span className="text-zinc-400">Codex word tiers</span>
              <span className="text-emerald-300 font-bold">{wordHuntProgress.completedCount} / {wordHuntProgress.totalCount}</span>
            </div>
            <Progress value={wordHuntProgress.percent} className="h-2 bg-zinc-950" />
            <p className="text-[11px] text-zinc-400 italic text-right">
              {allWordTiersComplete ? 'Crocodile guardian Crypto awakened!' : `${wordHuntProgress.totalCount - wordHuntProgress.completedCount} tiers left to carve`}
            </p>
          </div>
        </div>

        {/* ─── 10-SLOT STONE INSCRIPTION CONSOLE ─── */}
        <div className="p-5 sm:p-6 rounded-2xl bg-black/60 border border-emerald-500/30 space-y-4 shadow-inner">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-emerald-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              10-slot runic inscriber (longest word capacity)
            </span>
            <span className="text-zinc-500">
              {inputWord.length} / 10 letters entered
            </span>
          </div>

          {/* Stone Slots Display (10 slots based on longest word) */}
          <div className="flex items-center justify-center gap-1 sm:gap-2 overflow-x-auto py-2">
            {Array.from({ length: 10 }).map((_, idx) => {
              const char = inputWord[idx] || '';
              const runeSym = char ? letterToRuneSymbol(char) : '᛬';
              const isActive = idx === inputWord.length;

              return (
                <div
                  key={idx}
                  className={`flex flex-col items-center justify-center w-8 sm:w-11 h-14 sm:h-16 rounded-xl border transition-all select-none ${
                    char
                      ? 'bg-emerald-500/15 border-emerald-500/60 shadow-[0_0_10px_rgba(16,185,129,0.25)] text-emerald-200'
                      : isActive
                      ? 'bg-zinc-900 border-emerald-500/50 animate-pulse text-zinc-600'
                      : 'bg-zinc-950/70 border-zinc-800 text-zinc-700'
                  }`}
                >
                  <span className="font-mono text-base sm:text-xl font-bold leading-none">
                    {runeSym}
                  </span>
                  <span className="mt-1 font-serif text-xs sm:text-sm font-bold leading-none text-zinc-300">
                    {char || '·'}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Inscription Form / Action Controls */}
          <form onSubmit={handleSubmitWord} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            <div className="relative flex-1">
              <input
                ref={inputRef}
                type="text"
                maxLength={10}
                value={inputWord}
                onChange={(e) => setInputWord(e.target.value.toUpperCase().slice(0, 10))}
                placeholder="Type word (e.g. BRAVE, AND, DISCIPLINE)..."
                className="w-full bg-zinc-900/90 border border-emerald-500/30 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-mono tracking-widest text-emerald-200 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400"
              />
              {inputWord && (
                <button
                  type="button"
                  onClick={handleClearInput}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 p-1"
                >
                  <Delete className="w-4 h-4" />
                </button>
              )}
            </div>

            <Button
              type="submit"
              disabled={!inputWord.trim()}
              className="btn-primary-cta text-xs font-bold rounded-xl h-10 px-5 gap-1.5 shrink-0"
            >
              <Send className="w-3.5 h-3.5" />
              Carve word into codex
            </Button>
          </form>

          {/* Quick Runic Letter Keyboard (for mobile / fast input) */}
          <div className="pt-2 border-t border-zinc-800/80">
            <p className="text-[11px] text-zinc-400 font-mono mb-2 flex items-center justify-between">
              <span>Tap letters to inscribe into slots:</span>
              <button
                type="button"
                onClick={handleClearInput}
                className="text-zinc-500 hover:text-zinc-300 underline"
              >
                Clear slots
              </button>
            </p>
            <div className="flex flex-wrap gap-1 justify-center">
              {'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map((char) => (
                <button
                  key={char}
                  type="button"
                  onClick={() => handleAppendLetter(char)}
                  className="w-7 h-8 sm:w-8 sm:h-9 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-emerald-500/50 hover:bg-emerald-950/40 text-zinc-300 hover:text-emerald-200 text-xs font-serif font-bold transition-all flex flex-col items-center justify-center"
                >
                  <span className="text-[9px] font-mono text-emerald-400/70 leading-none">
                    {letterToRuneSymbol(char)}
                  </span>
                  <span className="text-xs leading-none mt-0.5">
                    {char}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ─── THE 8 CODEX WORD SHELVES (FROM SHORTEST TO LONGEST) ─── */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-serif font-bold text-base text-emerald-200 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-emerald-400" />
              The eight word shelves of the long codex
            </h4>
            <span className="text-xs font-mono text-zinc-400">
              Lengths 3 to 10
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {WORD_HUNT_TIERS.map((tier) => {
              const inscribedWord = wordHuntProgress.completedTiers[tier.length];
              const isTierComplete = !!inscribedWord;

              return (
                <div
                  key={tier.length}
                  className={`p-4 rounded-2xl border transition-all duration-300 flex flex-col justify-between gap-3 ${
                    isTierComplete
                      ? 'bg-gradient-to-r from-emerald-950/30 via-zinc-950 to-zinc-950 border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.1)]'
                      : 'bg-zinc-950/60 border-zinc-800/80 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-serif font-bold text-sm text-emerald-300">
                          {tier.label}
                        </span>
                        <span className="text-[10px] font-mono text-zinc-500">
                          ({tier.length} letters)
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-400 italic mt-0.5">
                        {tier.hint}
                      </p>
                    </div>

                    {isTierComplete ? (
                      <Badge className="bg-emerald-500/15 text-emerald-300 border border-emerald-500/40 text-[10px] font-mono flex items-center gap-1 shrink-0">
                        <CheckCircle2 className="w-3 h-3" /> Inscribed
                      </Badge>
                    ) : (
                      <Badge className="bg-zinc-900 text-zinc-500 border-zinc-800 text-[10px] flex items-center gap-1 shrink-0">
                        <Lock className="w-2.5 h-2.5" /> Empty shelf
                      </Badge>
                    )}
                  </div>

                  {/* Visual Word Slot Carving */}
                  <div className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto py-1">
                    {Array.from({ length: tier.length }).map((_, slotIdx) => {
                      const char = isTierComplete ? inscribedWord[slotIdx] : '';
                      const runeSym = char ? letterToRuneSymbol(char) : '᛬';

                      return (
                        <div
                          key={slotIdx}
                          className={`w-7 sm:w-8 h-10 sm:h-11 rounded-lg border flex flex-col items-center justify-center shrink-0 ${
                            isTierComplete
                              ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-200'
                              : 'bg-zinc-900/60 border-zinc-800/80 text-zinc-700'
                          }`}
                        >
                          <span className="font-mono text-xs sm:text-sm font-bold leading-none">
                            {runeSym}
                          </span>
                          <span className="font-serif text-[10px] sm:text-xs font-bold leading-none mt-0.5 text-zinc-300">
                            {char || '·'}
                          </span>
                        </div>
                      );
                    })}

                    {isTierComplete && (
                      <span className="ml-2 font-serif font-bold text-xs sm:text-sm text-emerald-300">
                        = {inscribedWord}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ─── 5. GRAND REWARD: CREATURE CARD "CRYPTO" (CROCODILE WARRIOR) ─── */}
        {allWordTiersComplete && (
          <div className="pt-6 border-t border-emerald-500/30 space-y-6 animate-in fade-in zoom-in-95 duration-500">
            <div className="text-center max-w-xl mx-auto space-y-2">
              <Badge className="bg-gradient-to-r from-emerald-500 to-teal-400 text-zinc-950 font-bold text-xs px-3 py-1 shadow-lg">
                ✦ Master achievement unlocked ✦
              </Badge>
              <h3 className="text-2xl sm:text-3xl font-serif font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-200 via-emerald-400 to-teal-200">
                Crypto, the runic crocodile guardian
              </h3>
              <p className="text-xs sm:text-sm text-zinc-300">
                You have carved every word tier from length 3 to 10 into the long codex. Slumbering beneath the stone archives, Crypto has awakened!
              </p>
            </div>

            {/* 3D Flippable Creature Card for Crypto */}
            <div className="flex justify-center">
              <div
                className="relative h-[480px] sm:h-[520px] w-full max-w-[340px] [perspective:1000px] cursor-pointer group"
                onClick={() => setIsCryptoCardFlipped(!isCryptoCardFlipped)}
              >
                <div
                  className={`relative w-full h-full transition-all duration-700 [transform-style:preserve-3d] ${
                    isCryptoCardFlipped ? '[transform:rotateY(180deg)]' : ''
                  }`}
                >
                  {/* FRONT FACE */}
                  <div className="absolute inset-0 w-full h-full [backface-visibility:hidden] overflow-hidden rounded-3xl border-2 border-emerald-500/60 bg-gradient-to-b from-zinc-950 via-[#0a150e] to-zinc-950 flex flex-col shadow-2xl shadow-emerald-950/50 group-hover:border-emerald-400 group-hover:scale-[1.01] transition-transform">
                    <div className="relative w-full h-full p-4 flex flex-col items-center justify-between">
                      {/* Card Header */}
                      <div className="w-full flex items-center justify-between z-20">
                        <Badge className="bg-emerald-500 text-black font-bold text-[10px] px-2.5 py-0.5">
                          #019 • Special
                        </Badge>
                        <span className="text-[10px] font-mono text-emerald-400">
                          (Tap to flip)
                        </span>
                      </div>

                      {/* Creature Image */}
                      <div className="relative w-52 h-52 sm:w-60 sm:h-60 z-10">
                        <Image
                          src="/images/creatures/Crypto.webp"
                          alt="Crypto the runic crocodile"
                          fill
                          className="object-contain drop-shadow-[0_0_20px_rgba(16,185,129,0.3)] group-hover:scale-105 transition-transform duration-500"
                          priority
                        />
                      </div>

                      {/* Bottom Info Banner */}
                      <div className="w-full bg-black/80 backdrop-blur-md rounded-2xl p-4 border border-emerald-500/30 text-center z-20 space-y-1">
                        <h4 className="text-2xl font-black text-emerald-300 uppercase tracking-wider font-serif">
                          Crypto
                        </h4>
                        <p className="text-xs text-zinc-400 font-serif">
                          Cipher guardian • Crocodile warrior
                        </p>
                        <div className="flex items-center justify-center gap-3 text-xs font-mono text-emerald-200/90 pt-1">
                          <span className="flex items-center gap-1">
                            <Star className="w-3 h-3 text-emerald-400" /> Runic
                          </span>
                          <span className="w-1 h-1 rounded-full bg-emerald-500/50" />
                          <span className="flex items-center gap-1">
                            <Shield className="w-3 h-3 text-emerald-400" /> DEF: 26
                          </span>
                          <span className="w-1 h-1 rounded-full bg-emerald-500/50" />
                          <span className="flex items-center gap-1">
                            <Sword className="w-3 h-3 text-emerald-400" /> ATK: 28
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* BACK FACE */}
                  <div className="absolute inset-0 w-full h-full [transform:rotateY(180deg)] [backface-visibility:hidden] rounded-3xl border-2 border-emerald-500/60 bg-zinc-950 p-6 flex flex-col justify-between shadow-2xl overflow-hidden">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-emerald-950/30 via-zinc-950 to-zinc-950 pointer-events-none" />

                    <div className="relative z-10 space-y-4">
                      <div className="flex items-center justify-between border-b border-emerald-500/20 pb-3">
                        <div>
                          <h4 className="text-2xl font-black text-emerald-400 uppercase font-serif">
                            Crypto
                          </h4>
                          <span className="text-[11px] font-mono text-zinc-400">
                            The runic crocodile
                          </span>
                        </div>
                        <Badge variant="outline" className="text-emerald-300 border-emerald-500/40 text-xs">
                          Runic tank
                        </Badge>
                      </div>

                      {/* Combat Stats Grid */}
                      <div className="grid grid-cols-2 gap-2.5">
                        <div className="bg-white/5 p-2.5 rounded-xl border border-white/5">
                          <span className="text-[10px] text-zinc-400 uppercase tracking-widest block">HP</span>
                          <div className="text-lg font-mono text-white flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                            96
                          </div>
                        </div>

                        <div className="bg-white/5 p-2.5 rounded-xl border border-white/5">
                          <span className="text-[10px] text-zinc-400 uppercase tracking-widest block">Attack</span>
                          <div className="text-lg font-mono text-white flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
                            28
                          </div>
                        </div>

                        <div className="bg-white/5 p-2.5 rounded-xl border border-white/5">
                          <span className="text-[10px] text-zinc-400 uppercase tracking-widest block">Defense</span>
                          <div className="text-lg font-mono text-white flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
                            26
                          </div>
                        </div>

                        <div className="bg-white/5 p-2.5 rounded-xl border border-white/5">
                          <span className="text-[10px] text-zinc-400 uppercase tracking-widest block">Speed</span>
                          <div className="text-lg font-mono text-white flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.8)]" />
                            18
                          </div>
                        </div>
                      </div>

                      {/* Lore & Quote */}
                      <div className="space-y-2 text-xs text-zinc-300 leading-relaxed">
                        <p className="italic text-emerald-200/90 font-serif">
                          &ldquo;Snap! You cracked Necrion&apos;s codex, didn&apos;t you? My armor is humming with ancient power!&rdquo;
                        </p>
                        <p className="text-[11px] text-zinc-400">
                          Slumbers beneath the stone archives. Awakens only when all eight tiers of the Elder Futhark prophecy—from the shortest whisper to the longest decree—are carved into the long codex.
                        </p>
                      </div>
                    </div>

                    <div className="relative z-10 pt-2 border-t border-zinc-900 text-center">
                      <span className="text-[10px] font-mono text-zinc-500">
                        (Tap to view front face)
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Claim Reward Button */}
            <div className="flex justify-center">
              <Button
                onClick={handleClaimCryptoReward}
                disabled={isCryptoClaimed}
                className={`text-xs font-bold rounded-2xl h-11 px-6 shadow-xl ${
                  isCryptoClaimed
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 cursor-default'
                    : 'btn-primary-cta text-zinc-950 font-bold'
                }`}
              >
                {isCryptoClaimed
                  ? '✓ Crypto claimed (+500 gold, +1000 exp, "Keeper of Crypto")'
                  : 'Claim Crypto reward (+500 gold, +1000 exp, title "Keeper of Crypto")'}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* ─── 5. RUNIC ALPHABET TRANSLATION KEY (A–Z) ───────────────────── */}
      {showAlphabetKey && (
        <div className="relative rounded-3xl overflow-hidden border border-amber-500/30 bg-zinc-950 p-6 sm:p-7 shadow-xl space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-amber-400" />
              <h4 className="font-serif font-bold text-base text-amber-200">
                Elder futhark alphabet key (A–Z)
              </h4>
            </div>
            <span className="text-xs font-mono text-zinc-400">
              {unlockedCount} of 24 deciphered
            </span>
          </div>
          <p className="text-xs text-zinc-400">
            Each historical rune connects directly to a sound and letter. Golden glyphs represent runes bound to your codex.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
            {alphabetRunes.map((rune) => {
              const isUnlocked = unlockedRuneIds.includes(rune.id);
              return (
                <div
                  key={rune.id}
                  onClick={() => handleRuneClick(rune, isUnlocked)}
                  className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 cursor-pointer transition-all ${
                    isUnlocked
                      ? 'bg-amber-500/10 border-amber-500/40 hover:border-amber-300 text-amber-200'
                      : 'bg-zinc-900/60 border-zinc-800 text-zinc-500 hover:border-zinc-700'
                  }`}
                  title={`${rune.letter} = ${rune.symbol} (${rune.name})`}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-serif font-bold text-xs text-amber-300 w-5">
                      {rune.letter}
                    </span>
                    <span className="font-mono text-lg font-bold">
                      {isUnlocked ? rune.symbol : '᛬'}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-zinc-400 truncate max-w-[65px]">
                    {isUnlocked ? rune.name : 'hidden'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ─── 6. ÆTT SELECTION PILLS ────────────────────────────────────── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 custom-scrollbar">
        {[
          { id: 'all', label: 'All 24 runes', count: totalRunes },
          { id: 'freyr', label: "Freyr's ætt (1–8)", count: 8 },
          { id: 'heimdall', label: "Heimdall's ætt (9–16)", count: 8 },
          { id: 'tyr', label: "Tyr's ætt (17–24)", count: 8 },
        ].map((tab) => {
          const isActive = selectedAett === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setSelectedAett(tab.id as any)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-serif font-bold transition-all whitespace-nowrap border ${
                isActive
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-sm'
                  : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:border-zinc-700 hover:text-zinc-200'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ─── 7. RUNE TILES GRID ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredRunes.map((rune) => {
          const isUnlocked = unlockedRuneIds.includes(rune.id);
          const foundPlacements = rune.placements.filter((p) =>
            collectedPlacements.includes(p.id)
          );

          return (
            <div
              key={rune.id}
              onClick={() => handleRuneClick(rune, isUnlocked)}
              className={`relative group rounded-2xl p-5 border transition-all duration-300 cursor-pointer select-none flex flex-col justify-between min-h-[170px] ${
                isUnlocked
                  ? 'bg-gradient-to-b from-amber-950/20 via-zinc-950 to-zinc-950/90 border-amber-500/40 hover:border-amber-400 hover:shadow-[0_0_20px_rgba(245,158,11,0.2)] hover:-translate-y-0.5'
                  : 'bg-zinc-950/60 border-zinc-800/80 hover:border-amber-900/50 opacity-80 hover:opacity-100'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3.5">
                  <div
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center font-mono text-3xl font-bold transition-transform group-hover:scale-105 ${
                      isUnlocked
                        ? 'bg-amber-500/10 border border-amber-500/40 text-amber-300 drop-shadow-[0_0_10px_rgba(245,158,11,0.5)]'
                        : 'bg-zinc-900/80 border border-zinc-800 text-zinc-600'
                    }`}
                  >
                    {isUnlocked ? rune.symbol : '᛬'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3
                        className={`font-serif font-bold text-base ${
                          isUnlocked ? 'text-amber-200' : 'text-zinc-500'
                        }`}
                      >
                        {isUnlocked ? rune.name : 'Undiscovered'}
                      </h3>
                      {isUnlocked && (
                        <span className="text-[11px] font-mono text-amber-500/70">
                          {rune.letter} • {rune.phonetic}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-zinc-400 font-medium line-clamp-1">
                      {isUnlocked ? rune.meaning : rune.aettLabel}
                    </p>
                  </div>
                </div>

                {isUnlocked ? (
                  <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-[10px] uppercase font-mono">
                    Bound
                  </Badge>
                ) : (
                  <Badge className="bg-zinc-900 text-zinc-500 border-zinc-800 text-[10px] flex items-center gap-1">
                    <Lock className="w-2.5 h-2.5" /> Hidden
                  </Badge>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-zinc-900 text-xs">
                {isUnlocked ? (
                  <div className="space-y-1">
                    <p className="text-zinc-300 text-[11px] line-clamp-2 leading-relaxed">
                      {rune.description}
                    </p>
                    <div className="flex items-center gap-1 text-[10px] text-amber-500/80 pt-1 font-mono">
                      <Compass className="w-3 h-3" />
                      <span>
                        Found in {foundPlacements.map((p) => p.label).join(', ') || 'the realm'}
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="text-zinc-400 text-[11px] italic line-clamp-2 leading-relaxed">
                    💡 &ldquo;{rune.hint}&rdquo;
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ─── 8. RUNE DETAIL INSPECTOR MODAL ────────────────────────────── */}
      {activeRuneModal && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setActiveRuneModal(null)}
        >
          <div
            className="bg-gradient-to-b from-zinc-950 via-[#120e09] to-zinc-950 border border-amber-500/40 rounded-3xl p-6 max-w-md w-full space-y-5 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-amber-900/30">
              <div className="flex items-center gap-3">
                <span className="text-5xl font-mono text-amber-300 drop-shadow-[0_0_15px_rgba(245,158,11,0.6)]">
                  {activeRuneModal.symbol}
                </span>
                <div>
                  <h3 className="font-serif font-bold text-xl text-amber-200">
                    {activeRuneModal.name}
                  </h3>
                  <p className="text-xs text-amber-400/80 font-mono">
                    Letter: {activeRuneModal.letter} • Sound: {activeRuneModal.phonetic}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  playSFX('streak');
                  hapticSuccess();
                }}
                className="p-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30"
                title="Attune runic frequency"
              >
                <Volume2 className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-zinc-300 leading-relaxed">
              <div className="flex items-center gap-2">
                <Badge className="bg-amber-500/10 text-amber-300 border border-amber-500/30 text-[10px] font-mono">
                  {activeRuneModal.aettLabel}
                </Badge>
                <Badge className="bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 text-[10px] font-mono">
                  Letter &ldquo;{activeRuneModal.letter}&rdquo;
                </Badge>
              </div>
              <p>{activeRuneModal.description}</p>
              <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800 space-y-1">
                <span className="font-bold text-amber-300 block font-serif text-[11px]">
                  Where to locate in Thrivehaven:
                </span>
                <ul className="list-disc list-inside text-zinc-400 space-y-0.5">
                  {activeRuneModal.placements.map((p) => (
                    <li key={p.id}>
                      {p.label} (<span className="text-zinc-500 font-mono">{p.page}</span>)
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <Button
              className="w-full btn-primary-cta text-xs font-bold rounded-xl h-10"
              onClick={() => setActiveRuneModal(null)}
            >
              Close codex entry
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
