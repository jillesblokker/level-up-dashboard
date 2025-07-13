"use client"

import { useEffect, useState } from 'react';
import Image from 'next/image';

export default function RevealPage() {
  const [doorOpen, setDoorOpen] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setDoorOpen(true), 5000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen min-w-screen flex items-center justify-center relative overflow-hidden" style={{ background: '#10281a' }}>
      {/* Main background image (clipping container) */}
      <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none overflow-hidden w-full h-full">
        <Image
          src="/images/Reveal/reveal-background.png"
          alt="Reveal Background"
          fill
          className="object-cover w-full h-full"
          priority
        />
        {/* Door image layered above, clipped to background */}
        <div
          // Door animation logic:
          // - The door starts at translateY(0) (closed)
          // - After 5 seconds, doorOpen becomes true, triggering the transform
          // - The door animates upwards to translateY(-100%) over 6 seconds (6000ms)
          // - You can tweak the speed by changing the transitionDuration below
          className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none"
          style={{
            transform: doorOpen ? 'translateY(-100%)' : 'translateY(0)',
            transitionProperty: 'transform',
            transitionDuration: '6000ms',
            transitionTimingFunction: 'ease-in-out',
            willChange: 'transform',
            width: '100%',
            height: '100%'
          }}
        >
          <Image
            src="/images/Reveal/reveal-door.png"
            alt="Reveal Door"
            fill
            className="object-cover w-full h-full"
            priority
          />
        </div>
      </div>
    </div>
  );
} 