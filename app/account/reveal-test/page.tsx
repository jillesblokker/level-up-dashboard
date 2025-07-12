"use client"
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

export default function RevealTestPage() {
  const [doorOpen, setDoorOpen] = useState(false);
  const [zoomed, setZoomed] = useState(false);
  const doorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Start door animation after mount
    const timeout1 = setTimeout(() => setDoorOpen(true), 500);
    // Start zoom after door is open
    const timeout2 = setTimeout(() => setZoomed(true), 2200);
    return () => {
      clearTimeout(timeout1);
      clearTimeout(timeout2);
    };
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-green-950 transition-colors duration-700" style={{ background: zoomed ? '#0a2d1a' : '#111' }}>
      <div className="relative w-[340px] h-[480px] md:w-[480px] md:h-[640px] flex items-center justify-center overflow-hidden" style={{ transition: 'transform 1.2s cubic-bezier(0.4,0,0.2,1)', transform: zoomed ? 'scale(1.2)' : 'scale(1)' }}>
        {/* Background image */}
        <Image
          src="/images/Reveal/reveal-background.png"
          alt="Reveal Background"
          fill
          style={{ objectFit: 'cover', zIndex: 1 }}
          priority
        />
        {/* Door image, animated upwards */}
        <div
          ref={doorRef}
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: '100%',
            height: '100%',
            overflow: 'hidden',
            zIndex: 2,
            pointerEvents: 'none',
          }}
        >
          <Image
            src="/images/Reveal/reveal-door.png"
            alt="Reveal Door"
            fill
            style={{
              objectFit: 'cover',
              transition: 'transform 1.5s cubic-bezier(0.4,0,0.2,1)',
              transform: doorOpen ? 'translateY(-90%)' : 'translateY(0%)',
            }}
            priority
          />
        </div>
      </div>
    </div>
  );
} 