"use client";
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function EventsRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/game-center?tab=events');
  }, [router]);
  return <div className="p-8 text-center">Events have moved to the <b>Game Center</b>. Redirecting...</div>;
}

