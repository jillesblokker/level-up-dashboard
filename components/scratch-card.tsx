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
  isRevealed?: boolean;
  onReveal?: (cardId: string) => void;
  isWinner?: boolean;
  fullscreen?: boolean;
}

// Exactly 90% threshold: user must scratch away 90% of the foil,
// leaving 10% tolerance for missed edge or corner pixels
const AUTO_CLEAR_THRESHOLD = 0.90;

const calculateScratchedPercentage = (ctx: CanvasRenderingContext2D, width: number, height: number): number => {
  try {
    const dpr = typeof window !== 'undefined' ? (window.devicePixelRatio || 1) : 1;
    const w = Math.floor(width * dpr);
    const h = Math.floor(height * dpr);
    if (w <= 0 || h <= 0) return 0;
    
    // Sample a uniform grid of 24x36 (864 points) across the canvas for instant execution (<0.2ms)
    const sampleStepX = Math.max(2, Math.floor(w / 24));
    const sampleStepY = Math.max(2, Math.floor(h / 36));
    
    const imgData = ctx.getImageData(0, 0, w, h);
    const data = imgData.data;
    
    let totalSamples = 0;
    let clearedSamples = 0;
    
    for (let y = Math.floor(sampleStepY / 2); y < h; y += sampleStepY) {
      const rowOffset = y * w * 4;
      for (let x = Math.floor(sampleStepX / 2); x < w; x += sampleStepX) {
        const index = rowOffset + x * 4 + 3; // Alpha channel
        if (index < data.length) {
          totalSamples++;
          if (data[index]! < 64) { // Transparent / cleared pixel
            clearedSamples++;
          }
        }
      }
    }
    
    return totalSamples > 0 ? clearedSamples / totalSamples : 0;
  } catch (err) {
    return 0;
  }
};

export function ScratchCard({ cardData, isRevealed, onReveal, isWinner, fullscreen }: ScratchCardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [revealed, setRevealed] = useState(isRevealed ?? false);
  const isPointerDown = useRef(false);
  const lastPoint = useRef<{ x: number, y: number } | null>(null);

  const onRevealRef = useRef(onReveal);
  const isWinnerRef = useRef(isWinner);
  const cardDataRef = useRef(cardData);
  
  useEffect(() => {
    onRevealRef.current = onReveal;
    isWinnerRef.current = isWinner;
    cardDataRef.current = cardData;
  }, [onReveal, isWinner, cardData]);

  useEffect(() => {
    if (isRevealed && !revealed) {
      setRevealed(true);
    }
  }, [isRevealed, revealed]);

  // Vibrate helpers
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
    
    // Add fine metallic texture
    ctx.fillStyle = "rgba(0,0,0,0.05)";
    for (let i = 0; i < 120; i++) {
      ctx.fillRect(Math.random() * width, Math.random() * height, 2, 2);
    }
    
    // Subtle border stamp
    ctx.strokeStyle = "rgba(255,255,255,0.4)";
    ctx.lineWidth = 2;
    ctx.strokeRect(6, 6, width - 12, height - 12);

    // Write centered sentence case text
    ctx.fillStyle = "#6b7280";
    const fontSize = Math.max(12, Math.floor(width * 0.11));
    ctx.font = `bold ${fontSize}px sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("Scratch", width / 2, height / 2);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    let { width, height } = container.getBoundingClientRect();
    if (width <= 0 || height <= 0) {
      width = fullscreen ? 320 : 180;
      height = fullscreen ? 440 : 270;
    }

    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);

    if (revealed || isRevealed) {
      ctx.clearRect(0, 0, width, height);
      return;
    }

    fillCoating(ctx, width, height);

    // Sizing brush for satisfying scratching
    const brushRadius = Math.max(14, Math.min(width, height) * (fullscreen ? 0.09 : 0.12));

    const getPointerPos = (e: MouseEvent | TouchEvent) => {
      const rect = canvas.getBoundingClientRect();
      const clientX = 'touches' in e ? (e.touches[0]?.clientX ?? 0) : (e as MouseEvent).clientX;
      const clientY = 'touches' in e ? (e.touches[0]?.clientY ?? 0) : (e as MouseEvent).clientY;
      return {
        x: clientX - rect.left,
        y: clientY - rect.top
      };
    };

    let moveCounter = 0;

    const checkRevealProgress = () => {
      const ratio = calculateScratchedPercentage(ctx, width, height);
      if (ratio >= AUTO_CLEAR_THRESHOLD) {
        setRevealed(true);
      }
    };

    const scratch = (e: MouseEvent | TouchEvent) => {
      const currentPoint = getPointerPos(e);
      if (!lastPoint.current) lastPoint.current = currentPoint;

      ctx.save();
      ctx.globalCompositeOperation = 'destination-out';
      ctx.beginPath();
      ctx.arc(currentPoint.x, currentPoint.y, brushRadius, 0, Math.PI * 2);
      ctx.fill();

      // Smooth line between consecutive pointer points
      ctx.beginPath();
      ctx.lineWidth = brushRadius * 2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.moveTo(lastPoint.current.x, lastPoint.current.y);
      ctx.lineTo(currentPoint.x, currentPoint.y);
      ctx.stroke();
      ctx.restore();

      lastPoint.current = currentPoint;

      // Haptic feedback during active scratching
      if (Math.random() > 0.75) hapticScratch();
      
      moveCounter++;
      // Check true scratched percentage every 4 strokes
      if (moveCounter % 4 === 0) {
        checkRevealProgress();
      }
    };

    const handlePointerDown = (e: MouseEvent | TouchEvent) => {
      if (revealed || isRevealed) return;
      isPointerDown.current = true;
      lastPoint.current = getPointerPos(e);
      scratch(e);
    };

    const handlePointerMove = (e: MouseEvent | TouchEvent) => {
      if (!isPointerDown.current || revealed || isRevealed) return;
      if (e.cancelable) e.preventDefault();
      scratch(e);
    };

    const handlePointerUp = () => {
      if (!isPointerDown.current) return;
      isPointerDown.current = false;
      lastPoint.current = null;
      checkRevealProgress();
    };

    // Handle container resize
    const handleResize = () => {
      if (!container || !canvas) return;
      const rect = container.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        width = rect.width;
        height = rect.height;
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
        const newCtx = canvas.getContext('2d', { willReadFrequently: true });
        if (newCtx) {
          newCtx.scale(dpr, dpr);
          if (!revealed && !isRevealed) {
            fillCoating(newCtx, width, height);
          } else {
            newCtx.clearRect(0, 0, width, height);
          }
        }
      }
    };

    window.addEventListener('resize', handleResize);

    // Mouse Events
    canvas.addEventListener('mousedown', handlePointerDown);
    canvas.addEventListener('mousemove', handlePointerMove, { passive: false });
    window.addEventListener('mouseup', handlePointerUp);

    // Touch Events
    canvas.addEventListener('touchstart', handlePointerDown, { passive: false });
    canvas.addEventListener('touchmove', handlePointerMove, { passive: false });
    window.addEventListener('touchend', handlePointerUp);

    return () => {
      window.removeEventListener('resize', handleResize);
      canvas.removeEventListener('mousedown', handlePointerDown);
      canvas.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('mouseup', handlePointerUp);

      canvas.removeEventListener('touchstart', handlePointerDown);
      canvas.removeEventListener('touchmove', handlePointerMove);
      window.removeEventListener('touchend', handlePointerUp);
    };
  }, [revealed, isRevealed, fullscreen]);

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
  const imagePath = hasImage ? `/images/Mythics/Mythic${cardData.number}${colorName}.webp?v=2` : null;

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
        "relative rounded-2xl overflow-hidden shadow-2xl select-none touch-none transition-all duration-300 border-2 border-amber-800/40 bg-zinc-950",
        fullscreen
          ? "w-full h-full min-h-[340px] sm:min-h-[420px] max-w-none"
          : "w-full aspect-[2/3] max-w-[125px] min-[390px]:max-w-[140px] sm:max-w-[170px] md:max-w-[210px] min-h-[160px] sm:min-h-[220px] md:min-h-[280px] hover:scale-[1.02] active:scale-95",
        getRarityGlowClass()
      )}
    >
      {/* Victory Unveil Particle Radial Flare */}
      {isWinner && (
        <div className="absolute inset-0 bg-radial from-amber-400/30 via-transparent to-transparent blur-xl animate-pulse pointer-events-none z-20" />
      )}

      {/* Layout-Safe Winner Banner Overlay */}
      {revealed && isWinner && (
        <div className="absolute top-2 inset-x-2 z-30 bg-amber-950/90 border border-amber-400 text-amber-300 text-[9px] font-medium py-1 px-1.5 rounded-lg text-center shadow-lg animate-in zoom-in-95 pointer-events-none truncate">
          🎉 Winner uncovered!
        </div>
      )}

      {/* Background Reward Face */}
      {hasImage && imagePath ? (
        <div className="absolute inset-0 w-full h-full overflow-hidden bg-gradient-to-b from-zinc-900 via-zinc-950 to-amber-950/40">
          {/* Ornate Card Frame Texture behind Mythic cutout */}
          <div className="absolute inset-0 z-0 opacity-40 mix-blend-luminosity pointer-events-none">
            <Image
              src="/images/headers/undiscovered.webp"
              alt="Card frame texture"
              fill
              className="object-cover"
              unoptimized
            />
          </div>
          <Image
            src={imagePath}
            alt={`Mythic card #${cardData.number}`}
            fill
            className="object-contain p-1.5 sm:p-2 relative z-10 drop-shadow-md"
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
