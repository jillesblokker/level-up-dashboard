"use client";
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function MiniGamesRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/game-center?tab=mini-games');
  }, [router]);
  return <div className="p-8 text-center">Mini Games have moved to the <b>Game Center</b>. Redirecting...</div>;
} 