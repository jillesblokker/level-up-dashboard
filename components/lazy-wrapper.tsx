import React, { Suspense, lazy } from 'react';
import { Loader2 } from 'lucide-react';

// Medieval-themed loading component
function MedievalLoading({ message }: { message?: string | undefined }) {
  return (
    <div className="flex items-center justify-center p-8">
      <div className="text-center space-y-4">
        <div className="relative">
          <div className="w-12 h-12 border-4 border-amber-500/30 border-t-amber-500 rounded-full animate-spin mx-auto"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-amber-500 text-lg">⚔️</span>
          </div>
        </div>
        <p className="text-amber-200 text-sm font-medium">{message ?? "Loading..."}</p>
      </div>
    </div>
  );
}

// Generic loading component
function GenericLoading({ message }: { message?: string | undefined }) {
  return (
    <div className="flex items-center justify-center p-8">
      <div className="flex items-center space-x-2">
        <Loader2 className="h-4 w-4 animate-spin text-blue-400" />
        <span className="text-gray-400 text-sm">{message ?? "Loading..."}</span>
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
  const LoadingComponent = medieval ? MedievalLoading : GenericLoading;
  return (
    <Suspense fallback={fallback || <LoadingComponent message={loadingMessage} />}>
      {children}
    </Suspense>
  );
}

// =============================================================================
// Lazy-loaded components for better bundle splitting
// =============================================================================

// Heavy kingdom components
export const LazyKingdomGrid = lazy(() => import('@/components/kingdom-grid').then(module => ({ default: module.KingdomGrid })));
export const LazyKingdomStatsBlock = lazy(() => import('@/components/kingdom-stats-graph').then(module => ({ default: module.KingdomStatsBlock })));
export const LazyTileInventory = lazy(() => import('@/components/tile-inventory').then(module => ({ default: module.TileInventory })));

// Quest components
export const LazyQuestOrganization = lazy(() => import('@/components/quest-organization').then(module => ({ default: module.QuestOrganization })));
export const LazyDailyQuests = lazy(() => import('@/components/daily-quests').then(module => ({ default: module.DailyQuests })));
export const LazyMilestones = lazy(() => import('@/components/milestones').then(module => ({ default: module.Milestones })));

// Modal components
export const LazyAchievementUnlockModal = lazy(() => import('@/components/achievement-unlock-modal').then(module => ({ default: module.AchievementUnlockModal })));
export const LazyOnboardingModal = lazy(() => import('@/components/onboarding/OnboardingModal').then(module => ({ default: module.OnboardingModal })));

// =============================================================================
// Pre-wrapped components for common use cases
// =============================================================================

// Kingdom Stats - accepts userId prop
export function MedievalKingdomStatsGraph({ userId }: { userId: string | null }) {
  return (
    <LazyWrapper medieval={true} loadingMessage="Calculating realm statistics...">
      <LazyKingdomStatsBlock userId={userId} />
    </LazyWrapper>
  );
}

// Daily Quests - no props needed
export function MedievalDailyQuests() {
  return (
    <LazyWrapper medieval={true} loadingMessage="Loading daily quests...">
      <LazyDailyQuests />
    </LazyWrapper>
  );
}
