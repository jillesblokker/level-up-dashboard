"use client"

import { logger } from "@/lib/logger";
import { useState, useEffect, useRef } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Wind, Sparkles, ScrollText, Loader2 } from 'lucide-react'
import { updateCharacterStats } from '@/lib/character-stats-service'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { notificationService } from "@/lib/notification-service"
import { fetchWithAuth } from '@/lib/fetchWithAuth'
import { playSFX } from '@/lib/sound-manager'

export interface BreathPhase {
    name: 'inhale' | 'hold' | 'exhale' | 'hold_empty';
    label: string;
    duration: number; // in seconds
    scale: string;
    circleBg: string;
    glowBg: string;
    iconRotation: string;
    iconOpacity: string;
}

export interface BreathingExercise {
    id: string;
    name: string;
    badge: string;
    subtitle: string;
    iconEmoji: string;
    phases: BreathPhase[];
    cyclesRequired: number;
    totalSeconds: number;
    theme: {
        dialogBorder: string;
        dialogShadow: string;
        topGradient: string;
        titleColor: string;
        circleBorder: string;
        iconColor: string;
        dividerGlow: string;
        progressBar: string;
        claimButton: string;
        pillActive: string;
        pillInactive: string;
    };
}

export const BREATHING_EXERCISES: BreathingExercise[] = [
    {
        id: 'box',
        name: 'Box breathing',
        badge: 'Focus & clarity (4-4-4-4)',
        subtitle: 'Navy SEAL cadence for extreme calm, mental focus, and stress mitigation.',
        iconEmoji: '⏹️',
        cyclesRequired: 2,
        totalSeconds: 32, // (4+4+4+4) * 2 = 32s
        theme: {
            dialogBorder: 'border-indigo-900/40',
            dialogShadow: 'shadow-indigo-900/25',
            topGradient: 'from-indigo-950/30',
            titleColor: 'text-indigo-200',
            circleBorder: 'border-indigo-500/40',
            iconColor: 'text-indigo-300',
            dividerGlow: 'via-indigo-500/50',
            progressBar: 'bg-indigo-500/60',
            claimButton: 'bg-indigo-800 hover:bg-indigo-700 text-indigo-50 shadow-indigo-900/40 border-indigo-600',
            pillActive: 'bg-indigo-950/80 text-indigo-200 border-indigo-500/50 shadow-md',
            pillInactive: 'bg-zinc-900/60 text-zinc-400 border-zinc-800 hover:text-zinc-200'
        },
        phases: [
            {
                name: 'inhale',
                label: 'Inhale',
                duration: 4,
                scale: 'scale-150',
                circleBg: 'bg-indigo-500/10',
                glowBg: 'bg-indigo-400 scale-125',
                iconRotation: 'rotate-0',
                iconOpacity: 'opacity-70'
            },
            {
                name: 'hold',
                label: 'Hold full',
                duration: 4,
                scale: 'scale-150',
                circleBg: 'bg-indigo-500/25',
                glowBg: 'bg-blue-400 scale-150',
                iconRotation: 'rotate-12',
                iconOpacity: 'opacity-100'
            },
            {
                name: 'exhale',
                label: 'Exhale',
                duration: 4,
                scale: 'scale-100',
                circleBg: 'bg-transparent',
                glowBg: 'bg-slate-400 scale-100',
                iconRotation: 'rotate-0',
                iconOpacity: 'opacity-60'
            },
            {
                name: 'hold_empty',
                label: 'Hold empty',
                duration: 4,
                scale: 'scale-90',
                circleBg: 'bg-indigo-950/40',
                glowBg: 'bg-indigo-600/20 scale-90',
                iconRotation: '-rotate-12',
                iconOpacity: 'opacity-40'
            }
        ]
    },
    {
        id: 'calm_478',
        name: '4-7-8 Deep calm',
        badge: 'Deep relaxation (4-7-8)',
        subtitle: 'Natural tranquilizer that resets the autonomic nervous system into pure stillness.',
        iconEmoji: '🌙',
        cyclesRequired: 2,
        totalSeconds: 38, // (4+7+8) * 2 = 38s
        theme: {
            dialogBorder: 'border-purple-900/40',
            dialogShadow: 'shadow-purple-900/25',
            topGradient: 'from-purple-950/30',
            titleColor: 'text-purple-200',
            circleBorder: 'border-purple-500/40',
            iconColor: 'text-purple-300',
            dividerGlow: 'via-purple-500/50',
            progressBar: 'bg-purple-500/60',
            claimButton: 'bg-purple-800 hover:bg-purple-700 text-purple-50 shadow-purple-900/40 border-purple-600',
            pillActive: 'bg-purple-950/80 text-purple-200 border-purple-500/50 shadow-md',
            pillInactive: 'bg-zinc-900/60 text-zinc-400 border-zinc-800 hover:text-zinc-200'
        },
        phases: [
            {
                name: 'inhale',
                label: 'Inhale deeply',
                duration: 4,
                scale: 'scale-150',
                circleBg: 'bg-purple-500/10',
                glowBg: 'bg-purple-400 scale-125',
                iconRotation: 'rotate-0',
                iconOpacity: 'opacity-70'
            },
            {
                name: 'hold',
                label: 'Hold gentle',
                duration: 7,
                scale: 'scale-150',
                circleBg: 'bg-purple-500/25',
                glowBg: 'bg-fuchsia-400 scale-150',
                iconRotation: 'rotate-12',
                iconOpacity: 'opacity-100'
            },
            {
                name: 'exhale',
                label: 'Exhale slowly',
                duration: 8,
                scale: 'scale-100',
                circleBg: 'bg-transparent',
                glowBg: 'bg-indigo-400 scale-100',
                iconRotation: 'rotate-0',
                iconOpacity: 'opacity-50'
            }
        ]
    },
    {
        id: 'coherent',
        name: 'Coherent rhythm',
        badge: 'Heart coherence (6-6)',
        subtitle: 'Continuous wave of air synchronizing heart rate variability and mental harmony.',
        iconEmoji: '🌊',
        cyclesRequired: 3,
        totalSeconds: 36, // (6+6) * 3 = 36s
        theme: {
            dialogBorder: 'border-emerald-900/40',
            dialogShadow: 'shadow-emerald-900/25',
            topGradient: 'from-emerald-950/30',
            titleColor: 'text-emerald-200',
            circleBorder: 'border-emerald-500/40',
            iconColor: 'text-emerald-300',
            dividerGlow: 'via-emerald-500/50',
            progressBar: 'bg-emerald-500/60',
            claimButton: 'bg-emerald-800 hover:bg-emerald-700 text-emerald-50 shadow-emerald-900/40 border-emerald-600',
            pillActive: 'bg-emerald-950/80 text-emerald-200 border-emerald-500/50 shadow-md',
            pillInactive: 'bg-zinc-900/60 text-zinc-400 border-zinc-800 hover:text-zinc-200'
        },
        phases: [
            {
                name: 'inhale',
                label: 'Inhale smooth',
                duration: 6,
                scale: 'scale-150',
                circleBg: 'bg-emerald-500/10',
                glowBg: 'bg-emerald-400 scale-125',
                iconRotation: 'rotate-0',
                iconOpacity: 'opacity-70'
            },
            {
                name: 'exhale',
                label: 'Exhale smooth',
                duration: 6,
                scale: 'scale-100',
                circleBg: 'bg-transparent',
                glowBg: 'bg-teal-400 scale-100',
                iconRotation: 'rotate-0',
                iconOpacity: 'opacity-60'
            }
        ]
    },
    {
        id: 'equanimity',
        name: 'Equanimity breath',
        badge: 'Centered presence (4-4-4)',
        subtitle: 'Classic triangle breath returning the wandering mind to peace and balance.',
        iconEmoji: '🍃',
        cyclesRequired: 3,
        totalSeconds: 36, // (4+4+4) * 3 = 36s
        theme: {
            dialogBorder: 'border-teal-900/40',
            dialogShadow: 'shadow-teal-900/25',
            topGradient: 'from-teal-950/30',
            titleColor: 'text-teal-200',
            circleBorder: 'border-teal-500/40',
            iconColor: 'text-teal-300',
            dividerGlow: 'via-teal-500/50',
            progressBar: 'bg-teal-500/60',
            claimButton: 'bg-teal-800 hover:bg-teal-700 text-teal-50 shadow-teal-900/40 border-teal-600',
            pillActive: 'bg-teal-950/80 text-teal-200 border-teal-500/50 shadow-md',
            pillInactive: 'bg-zinc-900/60 text-zinc-400 border-zinc-800 hover:text-zinc-200'
        },
        phases: [
            {
                name: 'inhale',
                label: 'Inhale',
                duration: 4,
                scale: 'scale-150',
                circleBg: 'bg-teal-500/10',
                glowBg: 'bg-teal-400 scale-125',
                iconRotation: 'rotate-0',
                iconOpacity: 'opacity-70'
            },
            {
                name: 'hold',
                label: 'Hold',
                duration: 4,
                scale: 'scale-150',
                circleBg: 'bg-teal-500/25',
                glowBg: 'bg-emerald-400 scale-150',
                iconRotation: 'rotate-12',
                iconOpacity: 'opacity-100'
            },
            {
                name: 'exhale',
                label: 'Exhale',
                duration: 4,
                scale: 'scale-100',
                circleBg: 'bg-transparent',
                glowBg: 'bg-blue-400 scale-100',
                iconRotation: 'rotate-0',
                iconOpacity: 'opacity-60'
            }
        ]
    }
];

interface ZenMeditateModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function ZenMeditateModal({ isOpen, onClose }: ZenMeditateModalProps) {
    const [exerciseIndex, setExerciseIndex] = useState(0);
    const [phaseIndex, setPhaseIndex] = useState(0);
    const [phaseSecondsLeft, setPhaseSecondsLeft] = useState(4);
    const [canClaim, setCanClaim] = useState(false);
    const [seconds, setSeconds] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const activeExercise = BREATHING_EXERCISES[exerciseIndex] || BREATHING_EXERCISES[0]!;
    const currentPhase = activeExercise.phases[phaseIndex] || activeExercise.phases[0]!;

    // Auto-rotate exercise index on each modal open
    useEffect(() => {
        if (isOpen) {
            try {
                const last = parseInt(localStorage.getItem('thrivehaven_zen_exercise_index') || '-1', 10);
                const next = (last + 1) % BREATHING_EXERCISES.length;
                localStorage.setItem('thrivehaven_zen_exercise_index', String(next));
                setExerciseIndex(next);
            } catch {
                setExerciseIndex(0);
            }

            setPhaseIndex(0);
            setSeconds(0);
            setCanClaim(false);
            setIsSubmitting(false);

            // Auto-initialize meditation quest if it doesn't exist
            fetchWithAuth('/api/quests/init-special', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'meditation' })
            }).catch(err => logger.error('Failed to init meditation quest:', err));
        }
    }, [isOpen]);

    // Reset phase pacing whenever exercise changes
    useEffect(() => {
        setPhaseIndex(0);
        setPhaseSecondsLeft(activeExercise.phases[0]?.duration || 4);
        setSeconds(0);
        setCanClaim(false);
    }, [exerciseIndex, activeExercise]);

    // Dynamic phase and timer ticker
    useEffect(() => {
        if (!isOpen) return;

        const timer = setInterval(() => {
            setSeconds((prevSec) => prevSec + 1);

            setPhaseSecondsLeft((prevLeft) => {
                if (prevLeft <= 1) {
                    setPhaseIndex((prevPIndex) => {
                        const nextPIndex = (prevPIndex + 1) % activeExercise.phases.length;
                        return nextPIndex;
                    });
                    const nextPhase = activeExercise.phases[(phaseIndex + 1) % activeExercise.phases.length];
                    return nextPhase?.duration || 4;
                }
                return prevLeft - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [isOpen, activeExercise, phaseIndex]);

    // Unlock claim when total required exercise seconds are reached
    useEffect(() => {
        if (seconds >= activeExercise.totalSeconds) {
            setCanClaim(true);
        }
    }, [seconds, activeExercise.totalSeconds]);

    const handleSelectExercise = (idx: number) => {
        if (idx === exerciseIndex) return;
        setExerciseIndex(idx);
        try {
            localStorage.setItem('thrivehaven_zen_exercise_index', String(idx));
        } catch {}
    };

    const handleMeditate = async () => {
        if (isSubmitting) return;
        setIsSubmitting(true);
        playSFX('sparkle');

        try {
            // 1. Record meditation in database for Journey stats
            await fetchWithAuth('/api/meditations', { method: 'POST' });

            // 2. Try to auto-complete the "Daily Meditation" quest if it exists
            try {
                const questsRes = await fetchWithAuth('/api/quests');
                if (questsRes.ok) {
                    const quests = await questsRes.json();
                    const allQuests = Array.isArray(quests) ? quests : (quests.quests || []);
                    const meditationQuest = allQuests.find((q: any) => 
                        q.name === 'Daily Meditation' && !q.completed
                    );
                    
                    if (meditationQuest) {
                        logger.debug('[ZenMeditate] Auto-completing meditation quest:', meditationQuest.id);
                        await fetchWithAuth('/api/quests/smart-completion', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                questId: meditationQuest.id,
                                completed: true
                            })
                        });
                        if (typeof window !== 'undefined') {
                            window.dispatchEvent(new CustomEvent('quest-completed', { detail: { questId: meditationQuest.id } }));
                        }
                    }
                }
            } catch (qErr) {
                logger.error('[ZenMeditate] Failed to auto-complete quest:', qErr);
            }

            await updateCharacterStats({ experience: 30 });
            toast.success("You feel deeply centered.", { description: "+30 XP" });
            
            // Auto-complete Zen Garden Meditation quest
            try {
              const { recordZenMeditationCompletion } = await import('@/lib/tile-quest-service');
              await recordZenMeditationCompletion();
            } catch (err) {
              logger.warn('Zen meditation quest auto-complete error:', err);
            }

            notificationService.addNotification(
                "Meditation complete 🧘",
                `Completed ${activeExercise.name.toLowerCase()} and gained +30 XP!`,
                "success",
                "high",
                {
                    label: "View Character",
                    href: "/character"
                }
            );

            onClose();

            // Trigger random encounter check for meditation
            try {
              const { checkAndTriggerEncounter } = await import('@/lib/encounter-trigger-service');
              checkAndTriggerEncounter('meditation');
            } catch (e) {
              logger.warn('Meditation encounter check error:', e);
            }
        } catch (error) {
            logger.error("Failed to record meditation:", error);
            onClose();
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className={cn("max-w-md bg-zinc-950 text-zinc-100 overflow-hidden shadow-2xl transition-colors duration-700", activeExercise.theme.dialogBorder, activeExercise.theme.dialogShadow)}>
                <div className={cn("absolute inset-0 bg-gradient-to-b to-transparent pointer-events-none transition-colors duration-700", activeExercise.theme.topGradient)} />

                <DialogHeader className="relative z-10 space-y-1">
                    <DialogTitle className={cn("text-center font-serif text-3xl transition-colors duration-500", activeExercise.theme.titleColor)}>
                        The sacred garden
                    </DialogTitle>
                    <DialogDescription className="text-center text-zinc-400 text-xs italic font-light">
                        Leave the chaos of the realm behind.
                    </DialogDescription>
                </DialogHeader>

                {/* 4 Exercise Selector Tabs */}
                <div className="relative z-10 flex items-center justify-center gap-1.5 pt-1 overflow-x-auto no-scrollbar">
                    {BREATHING_EXERCISES.map((ex, idx) => {
                        const isActive = idx === exerciseIndex;
                        return (
                            <button
                                key={ex.id}
                                type="button"
                                onClick={() => handleSelectExercise(idx)}
                                className={cn(
                                    "px-2.5 py-1 rounded-lg text-[11px] font-serif border transition-all duration-300 flex items-center gap-1 shrink-0",
                                    isActive ? ex.theme.pillActive : ex.theme.pillInactive
                                )}
                            >
                                <span>{ex.iconEmoji}</span>
                                <span className="font-semibold truncate">{ex.name}</span>
                            </button>
                        );
                    })}
                </div>

                <div className="relative z-10 flex flex-col items-center justify-center py-6 space-y-8">
                    {/* Exercise Description / Benefit Banner */}
                    <div className="text-center space-y-1 max-w-xs px-2">
                        <span className="text-[11px] font-mono uppercase tracking-widest text-zinc-400 font-bold block">
                            {activeExercise.badge}
                        </span>
                        <p className="text-xs text-zinc-400 font-light italic leading-relaxed">
                            {activeExercise.subtitle}
                        </p>
                    </div>

                    {/* Breathing Visual */}
                    <div className="relative flex flex-col items-center justify-center">
                        {/* Outer Glows */}
                        <div 
                            className={cn(
                                "absolute w-48 h-48 rounded-full transition-all blur-3xl opacity-20",
                                currentPhase.glowBg
                            )} 
                            style={{ transitionDuration: `${currentPhase.duration}s` }}
                        />

                        {/* The Actual Breathing Circle */}
                        <div 
                            className={cn(
                                "relative w-32 h-32 rounded-full border flex items-center justify-center transition-all ease-in-out shadow-inner",
                                activeExercise.theme.circleBorder,
                                currentPhase.scale,
                                currentPhase.circleBg
                            )}
                            style={{ transitionDuration: `${currentPhase.duration}s` }}
                        >
                            <div className="flex flex-col items-center justify-center">
                                <Wind className={cn(
                                    "w-12 h-12 transition-all duration-700",
                                    activeExercise.theme.iconColor,
                                    currentPhase.iconRotation,
                                    currentPhase.iconOpacity
                                )} />
                            </div>
                        </div>

                        {/* Phase Text & Seconds Countdown */}
                        <div className="mt-10 flex flex-col items-center gap-1">
                            <span className="text-xl font-serif text-zinc-100 tracking-[0.25em] uppercase transition-all duration-500">
                                {currentPhase.label}
                            </span>
                            <span className="text-xs font-mono text-zinc-400">
                                {phaseSecondsLeft}s
                            </span>
                            <div className={cn("w-14 h-px bg-gradient-to-r from-transparent to-transparent mt-1", activeExercise.theme.dividerGlow)} />
                        </div>
                    </div>

                    {/* Progress Bar & Status */}
                    <div className="w-full max-w-[220px] flex flex-col items-center space-y-2">
                        <div className="w-full h-1.5 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800">
                            <div
                                className={cn("h-full transition-all duration-1000", activeExercise.theme.progressBar)}
                                style={{ width: `${Math.min(100, (seconds / activeExercise.totalSeconds) * 100)}%` }}
                            />
                        </div>
                        <div className="flex justify-between items-center w-full text-[10px] text-zinc-500 uppercase tracking-widest font-mono">
                            <span>{seconds}s / {activeExercise.totalSeconds}s</span>
                            <span>{seconds < activeExercise.totalSeconds ? "Centering..." : "Spirit aligned"}</span>
                        </div>
                    </div>

                    <Button
                        onClick={handleMeditate}
                        disabled={!canClaim || isSubmitting}
                        className={cn(
                            "w-full py-6 transition-all duration-500 font-serif text-lg rounded-xl",
                            canClaim
                                ? cn(activeExercise.theme.claimButton, "shadow-lg")
                                : "bg-zinc-900 text-zinc-600 border-zinc-800 grayscale cursor-not-allowed"
                        )}
                    >
                        {isSubmitting ? (
                            <span className="flex items-center gap-2">
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Centering spirit...
                            </span>
                        ) : canClaim ? (
                            <span className="flex items-center gap-2">
                                <Sparkles className="w-5 h-5 text-amber-300" />
                                Claim serenity (+30 XP)
                            </span>
                        ) : (
                            `Complete ${activeExercise.cyclesRequired} cycles...`
                        )}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}

