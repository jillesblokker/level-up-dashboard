"use client"

import { useEffect, useState, useRef } from 'react';
import Image from 'next/image';

export default function RevealPage() {
  const [doorOpen, setDoorOpen] = useState(false);
  const [hideBackground, setHideBackground] = useState(false);
  const [fadeBackground, setFadeBackground] = useState(false);
  const [showContent, setShowContent] = useState(false);
  const [cameraPan, setCameraPan] = useState(false);
  const [announce, setAnnounce] = useState('');
  const prefersReducedMotion = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (prefersReducedMotion) {
      setDoorOpen(true);
      setFadeBackground(true);
      setHideBackground(true);
      setShowContent(true);
      setCameraPan(false);
      setAnnounce('World revealed.');
      return;
    }
    const timer = setTimeout(() => {
      setDoorOpen(true);
      setAnnounce('The door is opening.');
      setTimeout(() => {
        setFadeBackground(true);
        setAnnounce('Entering the world.');
        setTimeout(() => {
          setHideBackground(true);
          setShowContent(true);
          setCameraPan(true);
        }, 1200); // fade duration
      }, 6000); // door animation duration
    }, 5000);
    return () => clearTimeout(timer);
  }, [prefersReducedMotion]);

  // Accessibility: ARIA live region
  useEffect(() => {
    if (announce && containerRef.current) {
      containerRef.current.setAttribute('aria-live', 'polite');
    }
  }, [announce]);

  return (
    <div
      ref={containerRef}
      className={`min-h-screen min-w-screen flex items-center justify-center relative overflow-hidden transition-transform duration-[1800ms] ease-in-out ${cameraPan ? 'scale-[1.08]' : 'scale-100'}`}
      style={{ background: '#10281a' }}
      aria-label="reveal-animation-container"
    >
      {/* ARIA live region for screen readers */}
      <div className="sr-only" aria-live="polite">{announce}</div>
      {/* Door image as the bottom layer, animating upwards */}
      <div
        // Door animation logic:
        // - The door starts at translateY(0) (closed)
        // - After 5 seconds, doorOpen becomes true, triggering the transform
        // - The door animates upwards to translateY(-100%) over 6 seconds (6000ms)
        // - Custom cubic-bezier for heavy feel
        // - Drop shadow for depth
        className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none"
        style={{
          transform: doorOpen ? 'translateY(-100%)' : 'translateY(0)',
          transitionProperty: 'transform',
          transitionDuration: prefersReducedMotion ? '0ms' : '6000ms',
          transitionTimingFunction: prefersReducedMotion ? 'linear' : 'cubic-bezier(0.32, 0.72, 0, 1)',
          willChange: 'transform',
          width: '100%',
          height: '100%'
        }}
      >
        <img
          src="/images/Reveal/reveal-door.png"
          alt="Reveal Door"
          className="object-cover w-full h-full shadow-2xl"
          style={{
            boxShadow: '0 24px 64px 0 rgba(0,0,0,0.7)',
            transition: 'box-shadow 0.6s',
            borderRadius: 0
          }}
          draggable={false}
        />
      </div>
      {/* Main background image above the door, fade out after animation */}
      {!hideBackground && (
        <div className={`absolute inset-0 flex items-center justify-center z-20 pointer-events-none overflow-hidden w-full h-full transition-opacity duration-[1200ms] ${fadeBackground ? 'opacity-0' : 'opacity-100'}`}>
          <img
            src="/images/Reveal/reveal-background.png"
            alt="Reveal Background"
            className="object-cover w-full h-full"
            draggable={false}
            style={{
              transition: 'opacity 1.2s',
              borderRadius: 0
            }}
          />
        </div>
      )}
      {/* Next content, animates in after reveal */}
      {showContent && (
        <div className="absolute inset-0 flex items-center justify-center z-30 animate-fade-in pointer-events-auto">
          <div className="bg-black/60 rounded-xl p-12 text-white text-3xl font-bold shadow-xl animate-fade-in" style={{ animationDuration: '1200ms' }}>
            Welcome to the world!
          </div>
        </div>
      )}
      {/* Fade-in animation keyframes */}
      <style jsx global>{`
        @keyframes fade-in {
          from { opacity: 0; transform: scale(0.98); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fade-in {
          animation: fade-in 1.2s cubic-bezier(0.32, 0.72, 0, 1) both;
        }
      `}</style>
    </div>
  );
} 