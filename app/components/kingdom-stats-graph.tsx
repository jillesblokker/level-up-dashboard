import React, { useEffect } from 'react';

interface KingdomStatsGraphProps {
  userId: string | null;
}

export const KingdomStatsGraph: React.FC<KingdomStatsGraphProps> = ({ userId }) => {
  useEffect(() => {
    async function fetchStats() {
      console.log('[KingdomStatsGraph] Fetching stats for user:', userId);
      // ... existing fetch logic ...
      // After fetching:
      // console.log('[KingdomStatsGraph] Fetched data:', data);
    }
    fetchStats();
  }, [userId]);

  return (
    <div>
      {/* Kingdom stats graph rendering here */}
      <p>Kingdom stats graph debug: userId={userId}</p>
    </div>
  );
}; 