import { LoadingScreen } from '@/components/loading-screen';
import { Trophy } from 'lucide-react';

export default function LoadingAchievements() {
  return (
    <LoadingScreen
      title="searching the treasury..."
      icon={<Trophy className="w-12 h-12 md:w-16 md:h-16 animate-pulse opacity-50 text-amber-500" />}
      content={
        <>
          In the shadowed halls of Necrion&apos;s keep,<br />
          Where ancient treasures lie in slumber deep,<br />
          A seeker of glory and renown,<br />
          Searches for achievements to call their own.<br />
          <br />
          Through trials of might and tests of will,<br />
          They climb the ladder, higher still,<br />
          Each milestone reached, a story to tell,<br />
          Of perseverance and triumph as well.<br />
          <br />
          So let us search these hallowed grounds,<br />
          Where legends and achievements can be found,<br />
          For every step forward, no matter how small,<br />
          Brings us closer to achieving it all.
        </>
      }
    />
  );
} 