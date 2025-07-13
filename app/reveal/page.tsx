"use client"

import { useEffect, useState, useRef } from 'react';
import Image from 'next/image';

function Page() {
  const [doorOpen, setDoorOpen] = useState(false);
  const [hideBackground, setHideBackground] = useState(false);
  const [fadeBackground, setFadeBackground] = useState(false);
  const [scaleBackground, setScaleBackground] = useState(false);
  const [showOverlay, setShowOverlay] = useState(true);
  const [announce, setAnnounce] = useState('');
  const prefersReducedMotion = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const containerRef = useRef<HTMLDivElement>(null);

  // Only show the animation once per session
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (sessionStorage.getItem('reveal-animation-shown')) {
        setShowOverlay(false);
        return;
      } else {
        sessionStorage.setItem('reveal-animation-shown', 'true');
        setShowOverlay(true);
      }
    }
  }, []);

  useEffect(() => {
    if (!showOverlay) return;
    if (prefersReducedMotion) {
      setDoorOpen(true);
      setFadeBackground(true);
      setHideBackground(true);
      setAnnounce('World revealed.');
      return;
    }
    const timer = setTimeout(() => {
      setDoorOpen(true);
      setAnnounce('The door is opening.');
      // Wait for door animation (6s), then start background fade
      setTimeout(() => {
        setFadeBackground(true);
        setAnnounce('Entering the world.');
        setTimeout(() => {
          setHideBackground(true);
          setTimeout(() => setShowOverlay(false), 500); // Remove overlay after fade
        }, 2500); // fade duration
      }, 6000); // door animation duration
    }, 2000);
    // Camera move-forward effect: scale background after 3s
    const scaleTimer = setTimeout(() => {
      setScaleBackground(true);
    }, 3000);
    return () => {
      clearTimeout(timer);
      clearTimeout(scaleTimer);
    };
  }, [prefersReducedMotion, showOverlay]);

  // Accessibility: ARIA live region
  useEffect(() => {
    if (announce && containerRef.current) {
      containerRef.current.setAttribute('aria-live', 'polite');
    }
  }, [announce]);

  if (!showOverlay) return null;

  return (
    <div
      ref={containerRef}
      className="min-h-screen min-w-screen flex items-center justify-center relative overflow-hidden"
      style={{}}
      aria-label="reveal-animation-container"
    >
      {/* ARIA live region for screen readers */}
      <div className="sr-only" aria-live="polite">{announce}</div>
      {/* Door image as the bottom layer, animating upwards */}
      <div
        // Door animation logic:
        // - The door starts at translateY(0) (closed)
        // - After 2 seconds, doorOpen becomes true, triggering the transform
        // - The door animates upwards to translateY(-100%) over 6 seconds (6000ms)
        // - Custom cubic-bezier for heavy feel
        // - No shadow or background added
        className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none"
        style={{
          transform: doorOpen ? 'translateY(-100%)' : 'translateY(0)',
          opacity: doorOpen ? 0 : 1,
          transitionProperty: 'transform, opacity',
          transitionDuration: prefersReducedMotion ? '0ms' : '6000ms',
          transitionTimingFunction: prefersReducedMotion ? 'linear' : 'cubic-bezier(0.32, 0.72, 0, 1)',
          willChange: 'transform, opacity',
          width: '100%',
          height: '100%'
        }}
      >
        <img
          src="/images/Reveal/reveal-door.png"
          alt="Reveal Door"
          className="object-cover w-full h-full"
          style={{
            borderRadius: 0
          }}
          draggable={false}
        />
      </div>
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

export default Page; 