"use client"

import Image from 'next/image';

export default function RevealPage() {
  return (
    <div className="min-h-screen flex items-center justify-center relative" style={{ background: '#10281a' }}>
      {/* Main background image */}
      <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
        <Image
          src="/images/Reveal/reveal-background.png"
          alt="Reveal Background"
          width={600}
          height={800}
          style={{ maxWidth: '90vw', maxHeight: '90vh' }}
          className="object-contain"
          priority
        />
      </div>
      {/* Door image layered above */}
      <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
        <Image
          src="/images/Reveal/reveal-door.png"
          alt="Reveal Door"
          width={600}
          height={800}
          style={{ maxWidth: '90vw', maxHeight: '90vh' }}
          className="object-contain"
          priority
        />
      </div>
    </div>
  );
} 