"use client";

import React, { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import canvasConfetti from 'canvas-confetti';
import Image from 'next/image';

interface ScratchCardProps {
  cardData: {
    id: string;
    number: number;
    rarity: string;
    color: string;
    background: string;
    ink: string;
    price: number;
    variantLabel: string;
    variantIndex: number;
  };
  onReveal?: (cardId: string) => void;
  isWinner?: boolean;
  fullscreen?: boolean;
}

const AUTO_CLEAR_THRESHOLD = 0.6;

export function ScratchCard({ cardData, onReveal, isWinner, fullscreen }: ScratchCardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [revealed, setRevealed] = useState(false);
  const isPointerDown = useRef(false);
  const lastPoint = useRef<{ x: number, y: number } | null>(null);
  const pixelsScratched = useRef(0);
  const totalPixels = useRef(0);

  const onRevealRef = useRef(onReveal);
  const isWinnerRef = useRef(isWinner);
  const cardDataRef = useRef(cardData);
  
  useEffect(() => {
    onRevealRef.current = onReveal;
    isWinnerRef.current = isWinner;
    cardDataRef.current = cardData;
  }, [onReveal, isWinner, cardData]);

  // Vibrate helper
  const hapticScratch = () => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(5);
    }
  };

  const hapticReveal = () => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([30, 50, 40]);
    }
  };

  const fillCoating = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.globalCompositeOperation = "source-over";
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, "#f1f3f8");
    gradient.addColorStop(0.18, "#aeb5c0");
    gradient.addColorStop(0.44, "#dce0e7");
    gradient.addColorStop(0.72, "#8f98a6");
    gradient.addColorStop(1, "#edf0f5");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    
    // Add some noise/texture pattern if desired
    ctx.fillStyle = "rgba(0,0,0,0.05)";
    for (let i = 0; i < 100; i++) {
        ctx.fillRect(Math.random() * width, Math.random() * height, 2, 2);
    }
    
    // Write text
    ctx.fillStyle = "#888";
    const fontSize = Math.max(12, Math.floor(width * 0.1));
    ctx.font = `bold ${fontSize}px sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("SCRATCH", width / 2, height / 2);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    let { width, height } = container.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);

    fillCoating(ctx, width, height);
    
    // Calculate pixels for threshold
    totalPixels.current = width * height;
    pixelsScratched.current = 0;

    const brushRadius = Math.max(20, Math.min(width, height) * 0.12);

    const getPointerPos = (e: MouseEvent | TouchEvent) => {
      const rect = canvas.getBoundingClientRect();
      const clientX = 'touches' in e ? (e.touches[0]?.clientX ?? 0) : (e as MouseEvent).clientX;
      const clientY = 'touches' in e ? (e.touches[0]?.clientY ?? 0) : (e as MouseEvent).clientY;
      return {
        x: clientX - rect.left,
        y: clientY - rect.top
      };
    };

    const handlePointerDown = (e: MouseEvent | TouchEvent) => {
      if (revealed) return;
      isPointerDown.current = true;
      lastPoint.current = getPointerPos(e);
      scratch(e);
    };

    const handlePointerMove = (e: MouseEvent | TouchEvent) => {
      if (!isPointerDown.current || revealed) return;
      e.preventDefault(); // prevent scrolling while scratching
      scratch(e);
    };

    const handlePointerUp = () => {
      isPointerDown.current = false;
      lastPoint.current = null;
      checkReveal();
    };

    const scratch = (e: MouseEvent | TouchEvent) => {
      const currentPoint = getPointerPos(e);
      if (!lastPoint.current) lastPoint.current = currentPoint;

      ctx.save();
      ctx.globalCompositeOperation = 'destination-out';
      ctx.beginPath();
      ctx.arc(currentPoint.x, currentPoint.y, brushRadius, 0, Math.PI * 2);
      ctx.fill();

      // Draw line between points for smooth scratching
      ctx.beginPath();
      ctx.lineWidth = brushRadius * 2;
      ctx.lineCap = 'round';
      ctx.moveTo(lastPoint.current.x, lastPoint.current.y);
      ctx.lineTo(currentPoint.x, currentPoint.y);
      ctx.stroke();
      ctx.restore();

      lastPoint.current = currentPoint;

      // Haptic feedback every few pixels
      if (Math.random() > 0.8) hapticScratch();
      
      // Count transparent pixels periodically
      pixelsScratched.current += brushRadius * brushRadius * Math.PI * 0.4;
      if (pixelsScratched.current > totalPixels.current * AUTO_CLEAR_THRESHOLD) {
        setRevealed(true);
      }
    };

    const checkReveal = () => {
      if (pixelsScratched.current > totalPixels.current * AUTO_CLEAR_THRESHOLD) {
        setRevealed(true);
      }
    };

    // Handle resize
    const handleResize = () => {
      if (!container || !canvas) return;
      const rect = container.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        canvas.style.width = `${rect.width}px`;
        canvas.style.height = `${rect.height}px`;
        const newCtx = canvas.getContext('2d', { willReadFrequently: true });
        if (newCtx) {
          newCtx.scale(dpr, dpr);
          if (!revealed) fillCoating(newCtx, rect.width, rect.height);
        }
      }
    };

    window.addEventListener('resize', handleResize);

    // Events
    canvas.addEventListener('mousedown', handlePointerDown);
    canvas.addEventListener('mousemove', handlePointerMove, { passive: false });
    window.addEventListener('mouseup', handlePointerUp);

    canvas.addEventListener('touchstart', handlePointerDown, { passive: false });
    canvas.addEventListener('touchmove', handlePointerMove, { passive: false });
    canvas.addEventListener('touchend', handlePointerUp);

    return () => {
      window.removeEventListener('resize', handleResize);
      canvas.removeEventListener('mousedown', handlePointerDown);
      canvas.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('mouseup', handlePointerUp);

      canvas.removeEventListener('touchstart', handlePointerDown);
      canvas.removeEventListener('touchmove', handlePointerMove);
      window.removeEventListener('touchend', handlePointerUp);
    };
  }, [revealed]);

  useEffect(() => {
    if (revealed) {
      hapticReveal();
      
      if (isWinnerRef.current) {
        canvasConfetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#f59e0b', '#fbbf24', '#fcd34d']
        });
      }

      if (onRevealRef.current) {
        onRevealRef.current(cardDataRef.current.id);
      }
    }
  }, [revealed]);

  // All 10 categories have 5 variants: Red (0), Green (1), Blue (2), White (3), Black (4)
  const colors = ['red', 'green', 'blue', 'white', 'black'];
  const colorName = colors[cardData.variantIndex] || 'red';
  const hasImage = cardData.number >= 1 && cardData.number <= 10;
  const imagePath = hasImage ? `/images/Mythics/Mythic${cardData.number}${colorName}.png?v=2` : null;

  const getRarityGlowClass = () => {
    if (!revealed) return "ring-1 ring-white/10";
    if (isWinner) {
      return "ring-2 sm:ring-4 ring-yellow-400 ring-offset-1 sm:ring-offset-2 ring-offset-black shadow-[0_0_22px_rgba(251,191,36,0.95)] animate-pulse";
    }
    
    const rarity = cardData.rarity.toLowerCase();
    if (rarity.includes('mythic')) {
      return "ring-2 ring-amber-500 border border-yellow-300 shadow-[0_0_20px_rgba(245,158,11,0.85)] animate-pulse";
    }
    if (rarity.includes('epic')) {
      return "ring-2 ring-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.65)]";
    }
    if (rarity.includes('rare')) {
      return "ring-2 ring-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.55)]";
    }
    return "ring-1 ring-zinc-700/60 shadow-[0_0_8px_rgba(113,113,122,0.35)]";
  };

  return (
    <article 
      ref={containerRef}
      role="region"
      aria-label={`Scratch card #${cardData.number}: ${cardData.variantLabel} (${cardData.rarity}). ${revealed ? 'Revealed reward' : 'Scratch to reveal'}`}
      className={cn(
        "relative rounded-2xl overflow-hidden shadow-2xl select-none touch-none transition-all duration-300 border-2 border-amber-800/40",
        fullscreen
          ? "w-full h-full min-h-[340px] sm:min-h-[420px] max-w-none"
          : "w-full aspect-[2/3] max-w-[125px] min-[390px]:max-w-[130px] sm:max-w-[160px] md:max-w-[200px] hover:scale-[1.02] active:scale-95",
        getRarityGlowClass()
      )}
    >
      {/* Victory Unveil Particle Radial Flare */}
      {isWinner && (
        <div className="absolute inset-0 bg-radial from-amber-400/30 via-transparent to-transparent blur-xl animate-pulse pointer-events-none z-20" />
      )}
      {/* Layout-Safe Winner Banner Overlay */}
      {revealed && isWinner && (
        <div className="absolute top-2 inset-x-2 z-30 bg-amber-950/90 border border-amber-400 text-amber-300 text-[9px] font-mono font-bold py-1 px-1.5 rounded-lg text-center shadow-lg animate-in zoom-in-95 pointer-events-none truncate">
          🎉 Winner Uncovered!
        </div>
      )}
      {/* Background Reward Face */}
      {hasImage && imagePath ? (
        <div className="absolute inset-0 w-full h-full overflow-hidden bg-gradient-to-b from-zinc-900 via-zinc-950 to-amber-950/40">
          <Image
            src={imagePath}
            alt={`Mythic Card #${cardData.number}`}
            fill
            className="object-contain p-1.5 sm:p-2"
          />
          {/* Overlay info */}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-zinc-950 via-zinc-950/90 to-transparent p-2 sm:p-3 flex flex-col justify-end h-2/3">
            <span className="text-[8px] sm:text-[11px] font-serif font-bold text-amber-200 tracking-wider mb-0.5 truncate drop-shadow">{cardData.variantLabel}</span>
            <span className="text-[7px] sm:text-[10px] font-bold text-purple-300 capitalize truncate">{cardData.rarity}</span>
            <div className="flex justify-between items-center mt-1 pt-1 sm:mt-1.5 sm:pt-1.5 border-t border-amber-900/30">
              <span className="text-[9px] sm:text-xs font-bold font-mono text-zinc-200 truncate">#{cardData.number}</span>
              <span className="text-[9px] sm:text-xs font-bold font-mono text-amber-300 flex items-center gap-0.5 truncate">{cardData.price}🪙</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-2.5 sm:p-4 bg-gradient-to-b from-amber-950/50 via-zinc-950 to-zinc-950 text-white">
          <span className="text-xl sm:text-3xl md:text-4xl font-serif font-bold text-amber-300 drop-shadow">{cardData.number}</span>
          <span className="text-[9px] sm:text-sm font-bold text-amber-100 tracking-wider sm:tracking-widest mt-1 sm:mt-2 truncate w-full text-center">{cardData.variantLabel}</span>
          <span className="text-[8px] sm:text-xs font-bold mt-0.5 text-purple-300 capitalize truncate">{cardData.rarity}</span>
          <span className="mt-auto text-[11px] sm:text-lg font-bold font-mono text-amber-300">{cardData.price} 🪙</span>
        </div>
      )}

      {/* Canvas Layer */}
      <canvas 
        ref={canvasRef}
        aria-hidden="true"
        className={cn(
          "absolute inset-0 w-full h-full z-10 transition-opacity duration-500 touch-none",
          revealed ? "opacity-0 pointer-events-none" : "opacity-100 cursor-crosshair"
        )}
        style={{ touchAction: 'none' }}
      />
    </article>
  );
}
