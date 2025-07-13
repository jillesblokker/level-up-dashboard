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
      {/* Main background image above static, fade out after animation */}
      {!hideBackground && (
        <div className={`absolute inset-0 flex items-center justify-center z-20 pointer-events-none overflow-hidden w-full h-full transition-opacity duration-[2500ms] ${fadeBackground ? 'opacity-0' : 'opacity-100'}`}>
          <img
            src="/images/Reveal/reveal-background.png"
            alt="Reveal Background"
            className={`object-cover w-full h-full transition-transform duration-[4000ms] ease-in-out ${scaleBackground ? 'scale-[4.5]' : 'scale-100'}`}
            draggable={false}
            style={{
              transition: 'opacity 2.5s, transform 4s cubic-bezier(0.32, 0.72, 0, 1)',
              borderRadius: 0
            }}
          />
        </div>
      )}
      {/* Door image as the top layer, animating upwards */}
      <div
        className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none"
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