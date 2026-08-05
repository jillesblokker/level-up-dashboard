"use client";

import React, { useEffect, useState, useRef } from "react";

interface AnimatedCharacterSpriteProps {
  playerLevel: number;
  tileSize: number;
  playerPosition: { x: number; y: number };
}

// Map level ranges to exact evolution sprite sheet PNGs
const getSpriteSheetForLevel = (level: number) => {
  if (level >= 100) return "/images/character/sprites/god.png";
  if (level >= 90) return "/images/character/sprites/emperor.png";
  if (level >= 80) return "/images/character/sprites/king.png";
  if (level >= 70) return "/images/character/sprites/prince.png";
  if (level >= 60) return "/images/character/sprites/duke.png";
  if (level >= 50) return "/images/character/sprites/marquis.png";
  if (level >= 40) return "/images/character/sprites/count.png";
  if (level >= 30) return "/images/character/sprites/viscount.png";
  if (level >= 20) return "/images/character/sprites/baron.png";
  if (level >= 10) return "/images/character/sprites/knight.png";
  return "/images/character/sprites/squire.png";
};

export const AnimatedCharacterSprite: React.FC<AnimatedCharacterSpriteProps> = ({
  playerLevel,
  tileSize,
  playerPosition
}) => {
  // Facing direction: 0 = Up (back), 1 = Down (front), 2 = Left, 3 = Right
  const [directionRow, setDirectionRow] = useState<number>(1);
  const [frameCol, setFrameCol] = useState<number>(0);
  const [isMoving, setIsMoving] = useState<boolean>(false);
  const prevPosRef = useRef<{ x: number; y: number }>(playerPosition);
  const moveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Detect position change to trigger movement facing & walking physics
  useEffect(() => {
    const prev = prevPosRef.current;
    const dx = playerPosition.x - prev.x;
    const dy = playerPosition.y - prev.y;

    if (dx !== 0 || dy !== 0) {
      if (dx > 0) {
        setDirectionRow(3); // Right
      } else if (dx < 0) {
        setDirectionRow(2); // Left
      } else if (dy > 0) {
        setDirectionRow(1); // Down
      } else if (dy < 0) {
        setDirectionRow(0); // Up
      }

      setIsMoving(true);

      if (moveTimerRef.current) clearTimeout(moveTimerRef.current);
      moveTimerRef.current = setTimeout(() => {
        setIsMoving(false);
        setFrameCol(0); // Return to idle standing posture
      }, 750);
    }

    prevPosRef.current = playerPosition;
  }, [playerPosition]);

  // Leg animation cycle (only runs while moving)
  useEffect(() => {
    if (!isMoving) {
      setFrameCol(0);
      return;
    }

    const interval = setInterval(() => {
      setFrameCol((prev) => (prev + 1) % 3);
    }, 160);

    return () => clearInterval(interval);
  }, [isMoving]);

  const spriteSheetUrl = getSpriteSheetForLevel(playerLevel);
  const characterSize = Math.floor(tileSize * 0.75);

  // 3 columns (0%, 50%, 100%), 4 rows (0%, 33.333%, 66.666%, 100%)
  const backgroundPositionX = `${(isMoving ? frameCol : 0) * 50}%`;
  const backgroundPositionY = `${directionRow * 33.333}%`;

  return (
    <div
      className="relative z-10 pointer-events-none transition-all duration-300 ease-out flex items-center justify-center"
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
