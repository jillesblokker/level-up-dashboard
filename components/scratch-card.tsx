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
}

const AUTO_CLEAR_THRESHOLD = 0.6;

export function ScratchCard({ cardData, onReveal, isWinner }: ScratchCardProps) {
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
    ctx.font = "bold 16px sans-serif";
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

      ctx.globalCompositeOperation = 'destination-out';
      ctx.beginPath();
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.lineWidth = brushRadius * 2;
      ctx.moveTo(lastPoint.current.x, lastPoint.current.y);
      ctx.lineTo(currentPoint.x, currentPoint.y);
      ctx.stroke();

      lastPoint.current = currentPoint;

      // Haptic feedback every few pixels
      if (Math.random() > 0.8) hapticScratch();
      
      // Calculate scratched roughly (optimised: just count transparent pixels periodically)
      if (Math.random() > 0.9) checkReveal();
    };

    const checkReveal = () => {
      if (revealed) return;
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      let clearPixels = 0;
      // check alpha channel
      for (let i = 3; i < imageData.length; i += 16) { // check every 4th pixel for speed
        if ((imageData[i] ?? 255) < 128) clearPixels++;
      }
      
      const totalChecked = imageData.length / 16;
      if (clearPixels / totalChecked > AUTO_CLEAR_THRESHOLD) {
        revealFull();
      }
    };

    const revealFull = () => {
      setRevealed(true);
      ctx.clearRect(0, 0, width, height);
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
    };

    // Events
    canvas.addEventListener('mousedown', handlePointerDown);
    canvas.addEventListener('mousemove', handlePointerMove, { passive: false });
    window.addEventListener('mouseup', handlePointerUp);

    canvas.addEventListener('touchstart', handlePointerDown, { passive: false });
    canvas.addEventListener('touchmove', handlePointerMove, { passive: false });
    window.addEventListener('touchend', handlePointerUp);

    return () => {
      canvas.removeEventListener('mousedown', handlePointerDown);
      canvas.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('mouseup', handlePointerUp);

      canvas.removeEventListener('touchstart', handlePointerDown);
      canvas.removeEventListener('touchmove', handlePointerMove);
      window.removeEventListener('touchend', handlePointerUp);
    };
  }, []);

  // All 10 categories have 5 variants: Red (0), Green (1), Blue (2), White (3), Black (4)
  const colors = ['red', 'green', 'blue', 'white', 'black'];
  const colorName = colors[cardData.variantIndex] || 'red';
  const hasImage = cardData.number >= 1 && cardData.number <= 10;
  const imagePath = hasImage ? `/images/Mythics/Mythic${cardData.number}${colorName}.png` : null;

  return (
    <article 
      ref={containerRef}
      className={cn(
        "relative w-[160px] h-[220px] sm:w-[180px] sm:h-[260px] md:w-[200px] md:h-[280px] rounded-xl overflow-hidden shadow-xl select-none touch-none",
        isWinner && revealed ? "ring-4 ring-yellow-400 ring-offset-2 ring-offset-black animate-pulse" : "ring-1 ring-white/10"
      )}
    >
      {/* Background Reward Face */}
      {hasImage && imagePath ? (
        <div className="absolute inset-0 w-full h-full overflow-hidden bg-slate-950">
          <Image
            src={imagePath}
            alt={`Mythic Card #${cardData.number}`}
            fill
            className="object-cover"
          />
          {/* Overlay info */}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-3 flex flex-col justify-end h-2/3">
            <span className="text-[10px] font-bold text-amber-200 tracking-wider mb-0.5">{cardData.variantLabel}</span>
            <span className="text-[9px] font-bold text-purple-300 uppercase tracking-widest">{cardData.rarity}</span>
            <div className="flex justify-between items-center mt-1.5 pt-1.5 border-t border-white/10">
              <span className="text-xs font-bold text-white flex items-center gap-1">Card #{cardData.number}</span>
              <span className="text-xs font-bold text-yellow-400">{cardData.price} 🪙</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-4 bg-slate-950 text-white">
          <span className="text-4xl font-black opacity-80">{cardData.number}</span>
          <span className="text-sm font-bold tracking-widest mt-2">{cardData.variantLabel}</span>
          <span className="text-xs font-bold mt-1 opacity-60 uppercase">{cardData.rarity}</span>
          <span className="mt-auto text-lg font-bold">{cardData.price} 🪙</span>
        </div>
      )}

      {/* Canvas Layer */}
      <canvas 
        ref={canvasRef}
        className={cn(
          "absolute inset-0 w-full h-full z-10 transition-opacity duration-500",
          revealed ? "opacity-0 pointer-events-none" : "opacity-100 cursor-crosshair"
        )}
      />
    </article>
  );
}
