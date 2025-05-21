'use client';

import { useCallback, useEffect, useRef, useState, MouseEvent, KeyboardEvent } from 'react';
import { Position } from '@/types/game';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';

interface MinimapProps {
  gridSize: number;
  tileSize?: number;
  characterPosition: Position;
  onPan?: (dx: number, dy: number) => void;
}

export function Minimap({ gridSize, tileSize = 16, characterPosition, onPan }: MinimapProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = useCallback((e: MouseEvent<HTMLDivElement>): void => {
    setIsDragging(true);
    const rect = containerRef.current?.getBoundingClientRect();
    if (rect) {
      setStartPos({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
    }
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent<HTMLDivElement>): void => {
    if (!isDragging || !onPan) return;
    
    const rect = containerRef.current?.getBoundingClientRect();
    if (rect) {
      const dx = e.clientX - rect.left - startPos.x;
      const dy = e.clientY - rect.top - startPos.y;
      onPan(dx, dy);
    }
  }, [isDragging, onPan, startPos]);

  const handleMouseUp = useCallback((): void => {
    setIsDragging(false);
  }, []);

  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLDivElement>): void => {
    if (!onPan) return;
    
    const PAN_AMOUNT = 10;
    switch (e.key) {
      case 'ArrowLeft':
        onPan(-PAN_AMOUNT, 0);
        break;
      case 'ArrowRight':
        onPan(PAN_AMOUNT, 0);
        break;
      case 'ArrowUp':
        onPan(0, -PAN_AMOUNT);
        break;
      case 'ArrowDown':
        onPan(0, PAN_AMOUNT);
        break;
    }
  }, [onPan]);

  useEffect(() => {
    const handleGlobalKeyDown = (e: globalThis.KeyboardEvent): void => {
      if (isDragging && containerRef.current) {
        const PAN_AMOUNT = 10;
        switch (e.key) {
          case 'ArrowLeft':
            onPan?.(-PAN_AMOUNT, 0);
            break;
          case 'ArrowRight':
            onPan?.(PAN_AMOUNT, 0);
            break;
          case 'ArrowUp':
            onPan?.(0, -PAN_AMOUNT);
            break;
          case 'ArrowDown':
            onPan?.(0, PAN_AMOUNT);
            break;
        }
      }
    };

    if (isDragging) {
      window.addEventListener('keydown', handleGlobalKeyDown);
    }

    return () => {
      window.removeEventListener('keydown', handleGlobalKeyDown);
    };
  }, [isDragging, onPan]);

  return (
    <Card 
      className="w-[320px] h-[320px] bg-gradient-to-br from-amber-900/20 to-amber-700/30 border-amber-800/50"
      aria-label="Minimap card"
    >
      <ScrollArea 
        className="w-full h-full p-2"
        aria-label="Minimap scroll area"
      >
        <div
          ref={containerRef}
          role="grid"
          tabIndex={0}
          aria-label="Minimap grid"
          aria-description="Draggable minimap grid showing your current position and explored tiles. Use arrow keys or click and drag to navigate."
          onKeyDown={handleKeyDown}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          className={`relative grid grid-cols-12 gap-[2px] p-2 cursor-grab ${isDragging ? 'cursor-grabbing' : ''}`}
          style={{
            width: `${gridSize}px`,
            height: `${gridSize}px`,
          }}
        >
          {/* Background grid - decorative */}
          <div 
            aria-hidden="true" 
            className="absolute inset-0 grid grid-cols-12 gap-[2px]"
          >
            {Array.from({ length: 144 }).map((_, i) => (
              <div
                key={`grid-${i}`}
                className="bg-amber-800/20 border border-amber-700/30 transition-colors hover:bg-amber-700/30"
              />
            ))}
          </div>

          {/* Character marker */}
          <div
            role="presentation"
            aria-label={`Character position: ${characterPosition.x}, ${characterPosition.y}`}
            className="absolute w-3 h-3 bg-amber-400 rounded-full shadow-md ring-2 ring-amber-200 animate-pulse character-marker"
            style={{
              left: `${characterPosition.x * (gridSize / 12)}px`,
              top: `${characterPosition.y * (gridSize / 12)}px`,
              transform: 'translate(-50%, -50%)',
            }}
          />
        </div>
      </ScrollArea>
    </Card>
  );
}