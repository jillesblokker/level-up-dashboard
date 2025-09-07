import React, { Suspense, lazy } from 'react';
import { Loader2 } from 'lucide-react';

// Medieval-themed loading component
function MedievalLoading({ message = "Loading..." }: { message?: string }) {
  return (
    <div className="flex items-center justify-center p-8">
      <div className="text-center space-y-4">
        <div className="relative">
          <div className="w-12 h-12 border-4 border-amber-500/30 border-t-amber-500 rounded-full animate-spin mx-auto"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-amber-500 text-lg">⚔️</span>
          </div>
        </div>
        <p className="text-amber-200 text-sm font-medium">{message}</p>
      </div>
    </div>
  );
}

// Generic loading component
function GenericLoading({ message = "Loading..." }: { message?: string }) {
  return (
    <div className="flex items-center justify-center p-8">
      <div className="flex items-center space-x-2">
        <Loader2 className="h-4 w-4 animate-spin text-blue-400" />
        <span className="text-gray-400 text-sm">{message}</span>
      </div>
    </div>
  );
}

interface LazyWrapperProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  medieval?: boolean;
  loadingMessage?: string;
}

export function LazyWrapper({ 
  children, 
  fallback, 
  medieval = false, 
  loadingMessage 
}: LazyWrapperProps) {
  return (
    <Suspense fallback={fallback || (medieval ? <MedievalLoading {...(loadingMessage && { message: loadingMessage })} /> : <GenericLoading {...(loadingMessage && { message: loadingMessage })} />)}>
      {children}
    </Suspense>
  );
}

// Lazy-loaded components for better bundle splitting
export const LazyKingdomGrid = lazy(() => import('@/components/kingdom-grid').then(module => ({ default: module.KingdomGrid })));
export const LazyKingdomStatsBlock = lazy(() => import('@/components/kingdom-stats-graph').then(module => ({ default: module.KingdomStatsBlock })));
export const LazyQuestOrganization = lazy(() => import('@/components/quest-organization').then(module => ({ default: module.QuestOrganization })));
export const LazyAchievementUnlockModal = lazy(() => import('@/components/achievement-unlock-modal').then(module => ({ default: module.AchievementUnlockModal })));
export const LazyOnboardingModal = lazy(() => import('@/components/onboarding/OnboardingModal').then(module => ({ default: module.OnboardingModal })));

// Wrapped lazy components with medieval loading
export const MedievalKingdomGrid = ({ grid, onTilePlace, selectedTile, setSelectedTile, onGridExpand }: any) => (
  <LazyWrapper medieval={true} loadingMessage="Building your kingdom...">
    <LazyKingdomGrid 
      grid={grid} 
      onTilePlace={onTilePlace} 
      selectedTile={selectedTile} 
      setSelectedTile={setSelectedTile} 
      onGridExpand={onGridExpand}
    />
  </LazyWrapper>
);

export const MedievalKingdomStatsGraph = ({ userId }: { userId: string | null }) => (
  <LazyWrapper medieval={true} loadingMessage="Calculating realm statistics...">
    <LazyKingdomStatsBlock userId={userId} />
  </LazyWrapper>
);

export const MedievalQuestOrganization = (props: any) => (
  <LazyWrapper medieval={true} loadingMessage="Organizing your quests...">
    <LazyQuestOrganization {...props} />
  </LazyWrapper>
);

export const MedievalAchievementUnlockModal = (props: any) => (
  <LazyWrapper medieval={true} loadingMessage="Unlocking achievement...">
    <LazyAchievementUnlockModal {...props} />
  </LazyWrapper>
);

export const MedievalOnboardingModal = (props: any) => (
  <LazyWrapper medieval={true} loadingMessage="Preparing your adventure...">
    <LazyOnboardingModal {...props} />
  </LazyWrapper>
);
