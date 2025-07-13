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
  const [isMobilePortrait, setIsMobilePortrait] = useState(false);
  const prefersReducedMotion = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const containerRef = useRef<HTMLDivElement>(null);

  // Detect mobile portrait mode
  useEffect(() => {
    function checkMobilePortrait() {
      if (typeof window === 'undefined') return;
      const isPortrait = window.matchMedia('(orientation: portrait)').matches;
      const isMobile = window.innerWidth <= 600; // You can adjust this threshold
      setIsMobilePortrait(isMobile && isPortrait);
    }
    checkMobilePortrait();
    window.addEventListener('resize', checkMobilePortrait);
    window.addEventListener('orientationchange', checkMobilePortrait);
    return () => {
      window.removeEventListener('resize', checkMobilePortrait);
      window.removeEventListener('orientationchange', checkMobilePortrait);
    };
  }, []);

  // Always show the animation on mount
  useEffect(() => {
    setShowOverlay(true);
  }, []);

  useEffect(() => {
    if (!showOverlay) return;
    if (prefersReducedMotion) {
      setDoorOpen(true);
      setFadeBackground(true);
      setHideBackground(true);
      setAnnounce('World revealed.');
      setTimeout(() => setShowOverlay(false), 500); // Remove overlay quickly
      return;
    }
    // Door animation: 3s, background scale starts after 2s and lasts 2s
    const DOOR_ANIMATION_DURATION = 3000; // 3s
    const BG_SCALE_START = 2000; // Start scaling background after 2s
    const BG_SCALE_DURATION = 2000; // 2s

    const timer = setTimeout(() => {
      setDoorOpen(true);
      setAnnounce('The door is opening.');
      // Wait for door animation (3s), then remove overlay immediately
      setTimeout(() => {
        setShowOverlay(false); // Remove overlay as soon as door is gone
        setFadeBackground(true);
        setHideBackground(true);
      }, DOOR_ANIMATION_DURATION); // door animation duration
    }, 500); // Initial delay before door starts opening
    // Camera move-forward effect: scale background after 2s
    const scaleTimer = setTimeout(() => {
      setScaleBackground(true);
    }, BG_SCALE_START);
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

  if (!showOverlay || isMobilePortrait) return null;

  return (
    <div
      ref={containerRef}
      className="min-h-screen min-w-screen flex items-center justify-center relative overflow-hidden"
      style={{}}
      aria-label="reveal-animation-container"
    >
      {/* ARIA live region for screen readers */}
      <div className="sr-only" aria-live="polite">{announce}</div>
      {/* Static image as the very bottom layer, always visible until overlay is removed */}
      <div className="absolute inset-0 z-0 pointer-events-none w-full h-full">
        <img
          src="/images/Reveal/reveal-static.png"
          alt="Reveal Static Background"
          className="object-cover w-full h-full"
          draggable={false}
          style={{ borderRadius: 0 }}
        />
      </div>
      {/* Door image as the middle layer, animating upwards */}
      <div
        className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none"
        style={{
          transform: doorOpen ? 'translateY(-100%)' : 'translateY(0)',
          opacity: doorOpen ? 0 : 1,
          transitionProperty: 'transform, opacity',
          transitionDuration: prefersReducedMotion ? '0ms' : '3000ms',
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
      {/* Main background image above door, fade out after animation */}
      {!hideBackground && (
        <div className={`absolute inset-0 flex items-center justify-center z-20 pointer-events-none overflow-hidden w-full h-full transition-opacity duration-[2500ms] ${fadeBackground ? 'opacity-0' : 'opacity-100'}`}>
          <img
            src="/images/Reveal/reveal-background.png"
            alt="Reveal Background"
            className={`object-cover w-full h-full transition-transform duration-[2000ms] ease-in-out ${scaleBackground ? 'scale-[4.5]' : 'scale-100'}`}
            draggable={false}
            style={{
              transition: 'opacity 1s, transform 2s cubic-bezier(0.32, 0.72, 0, 1)',
              borderRadius: 0
            }}
          />
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

export default Page; 