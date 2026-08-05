"use client";

import React, { useEffect, useState, useRef } from "react";

interface AnimatedCharacterSpriteProps {
  playerLevel: number;
  tileSize: number;
  playerPosition: { x: number; y: number };
}

// Map level ranges to evolution sprite sheets
const getSpriteSheetForLevel = (level: number) => {
  if (level >= 75) return "/images/sprites/lion_king_spritesheet.png";
  if (level >= 50) return "/images/sprites/lion_guardian_spritesheet.png";
  if (level >= 25) return "/images/sprites/lion_knight_spritesheet.png";
  return "/images/sprites/lion_novice_spritesheet.png";
};

export const AnimatedCharacterSprite: React.FC<AnimatedCharacterSpriteProps> = ({
  playerLevel,
  tileSize,
  playerPosition
}) => {
  // Facing direction: 0 = Up (back), 1 = Down (front), 2 = Left, 3 = Right
  const [directionRow, setDirectionRow] = useState<number>(1);
  const [frameCol, setFrameCol] = useState<number>(0);
  const prevPosRef = useRef<{ x: number; y: number }>(playerPosition);

  // Update direction row based on movement vector
  useEffect(() => {
    const prev = prevPosRef.current;
    const dx = playerPosition.x - prev.x;
    const dy = playerPosition.y - prev.y;

    if (dx > 0) {
      setDirectionRow(3); // Right
    } else if (dx < 0) {
      setDirectionRow(2); // Left
    } else if (dy > 0) {
      setDirectionRow(1); // Down
    } else if (dy < 0) {
      setDirectionRow(0); // Up
    }

    prevPosRef.current = playerPosition;
  }, [playerPosition]);

  // Walking animation loop (cycles 0 -> 1 -> 2 -> 1 -> 0 every 180ms)
  useEffect(() => {
    const interval = setInterval(() => {
      setFrameCol((prev) => (prev + 1) % 3);
    }, 180);
    return () => clearInterval(interval);
  }, []);

  const spriteSheetUrl = getSpriteSheetForLevel(playerLevel);
  const characterSize = Math.floor(tileSize * 0.7);

  // 3 columns (X = 0%, 50%, 100%), 4 rows (Y = 0%, 33.333%, 66.666%, 100%)
  const backgroundPositionX = `${frameCol * 50}%`;
  const backgroundPositionY = `${directionRow * 33.333}%`;

  return (
    <div
      className="relative z-10 pointer-events-none transition-transform duration-300 ease-out flex items-center justify-center"
      style={{
        width: `${characterSize}px`,
        height: `${characterSize}px`
      }}
    >
      <div
        className="w-full h-full"
        style={{
          backgroundImage: `url(${spriteSheetUrl})`,
          backgroundSize: "300% 400%",
          backgroundPosition: `${backgroundPositionX} ${backgroundPositionY}`,
          imageRendering: "pixelated",
          filter: "drop-shadow(0 4px 6px rgba(0,0,0,0.5))"
        }}
      />
    </div>
  );
};
