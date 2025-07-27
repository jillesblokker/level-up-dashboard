"use client"

import React, { useState } from 'react';
import { NavBar } from '@/components/nav-bar';
import { useAuthContext } from '@/components/providers';
import { MigrationModal } from '@/components/migration-modal';
import { useMigration } from '@/hooks/use-migration';

export function AuthContent({ children }: { children: React.ReactNode }) {
  const { isGuest, isLoading, userId } = useAuthContext();
  const { shouldShowMigration, dismissMigration } = useMigration();
  const [showMigrationModal, setShowMigrationModal] = useState(false);

  // Handle migration modal state
  React.useEffect(() => {
    if (shouldShowMigration) {
      setShowMigrationModal(true);
    }
  }, [shouldShowMigration]);

  const handleMigrationClose = () => {
    setShowMigrationModal(false);
    dismissMigration();
  };

  const handleMigrationComplete = () => {
    // Migration completed successfully
    console.log('Migration completed successfully!');
    // You can add any post-migration logic here
  };

  if (isLoading) {
    // Optional: Render a loading state or null while auth is checking
    return null;
  }

  return (
    <>
      <NavBar session={userId ? { user: { id: userId } } : null} />
      <main className="flex-1">{children}</main>
      
      {/* Migration Modal - only shows for authenticated users */}
      {!isGuest && userId && (
        <MigrationModal 
          isOpen={showMigrationModal}
          onClose={handleMigrationClose}
          onComplete={handleMigrationComplete}
        />
      )}
    </>
  );
} 