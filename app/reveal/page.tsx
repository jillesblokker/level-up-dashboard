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
      <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none overflow-hidden">
        <Image
          src="/images/Reveal/reveal-background.png"
          alt="Reveal Background"
          fill
          className="object-cover w-full h-full"
          priority
        />
        {/* Door image layered above, clipped to background */}
        <div
          className={`absolute inset-0 flex items-center justify-center z-20 pointer-events-none transition-transform duration-[2000ms] ease-in-out`}
          style={{
            transform: doorOpen ? 'translateY(-100%)' : 'translateY(0)',
            transitionProperty: 'transform',
            willChange: 'transform',
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