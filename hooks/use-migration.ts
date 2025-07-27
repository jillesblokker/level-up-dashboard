'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { checkMigrationStatus, showMigrationPrompt } from '@/lib/migration-utils';
import { loadAllUserData } from '@/lib/data-loaders';

interface UseMigrationReturn {
  shouldShowMigration: boolean;
  isChecking: boolean;
  hasMigrated: boolean;
  hasLocalData: boolean;
  triggerMigration: () => void;
  dismissMigration: () => void;
  userData: any;
  isLoadingData: boolean;
}

export function useMigration(): UseMigrationReturn {
  const { user, isLoaded } = useUser();
  const [shouldShowMigration, setShouldShowMigration] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [hasMigrated, setHasMigrated] = useState(false);
  const [hasLocalData, setHasLocalData] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  const [isLoadingData, setIsLoadingData] = useState(false);

  // Check migration status when user loads
  useEffect(() => {
    if (!isLoaded || !user?.id) return;

    const checkStatus = async () => {
      setIsChecking(true);
      try {
        const status = await checkMigrationStatus(user.id);
        setHasMigrated(status.hasMigrated);
        setHasLocalData(status.hasLocalData);

        // Show migration prompt if user has local data but hasn't migrated
        if (status.hasLocalData && !status.hasMigrated) {
          const shouldShow = showMigrationPrompt();
          setShouldShowMigration(shouldShow);
        }

        // Load user data if they have migrated
        if (status.hasMigrated) {
          setIsLoadingData(true);
          try {
            const data = await loadAllUserData(user.id);
            setUserData(data);
          } catch (error) {
            console.error('Error loading user data:', error);
          } finally {
            setIsLoadingData(false);
          }
        }
      } catch (error) {
        console.error('Error checking migration status:', error);
      } finally {
        setIsChecking(false);
      }
    };

    checkStatus();
  }, [isLoaded, user?.id]);

  const triggerMigration = () => {
    setShouldShowMigration(true);
  };

  const dismissMigration = () => {
    setShouldShowMigration(false);
    localStorage.setItem('migration-prompt-shown', 'true');
  };

  return {
    shouldShowMigration,
    isChecking,
    hasMigrated,
    hasLocalData,
    triggerMigration,
    dismissMigration,
    userData,
    isLoadingData
  };
} 