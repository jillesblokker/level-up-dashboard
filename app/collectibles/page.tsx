import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function CollectiblesRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/game-center?tab=collectibles');
  }, [router]);
  return <div className="p-8 text-center">Collectibles have moved to the <b>Game Center</b>. Redirecting...</div>;
} 