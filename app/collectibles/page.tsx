"use client";
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function CollectiblesRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/kingdom');
  }, [router]);
  return <div className="p-8 text-center bg-black text-amber-500 font-cardo">Collectibles are managed in your Kingdom Bag. Redirecting...</div>;
} 