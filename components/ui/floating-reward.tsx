"use client"

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface FloatingRewardItem {
  id: string;
  text: string;
  x: number;
  y: number;
  color?: string;
}

interface FloatingRewardOverlayProps {
  rewards: FloatingRewardItem[];
}

export function FloatingRewardOverlay({ rewards }: FloatingRewardOverlayProps) {
  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      <AnimatePresence>
        {rewards.map(item => (
          <motion.div
            key={item.id}
            initial={{ opacity: 1, y: item.y, x: item.x, scale: 0.8 }}
            animate={{ opacity: 0, y: item.y - 70, scale: 1.3 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            className={`absolute font-extrabold text-lg drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)] ${item.color || 'text-amber-400'}`}
          >
            {item.text}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
