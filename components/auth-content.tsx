"use client"

import React from 'react';
import { NavBar } from '@/components/nav-bar';
import { useAuthContext } from '@/components/providers';

export function AuthContent({ children }: { children: React.ReactNode }) {
  const { isGuest, isLoading, userId } = useAuthContext();

  if (isLoading) {
    // Optional: Render a loading state or null while auth is checking
    return null;
  }

  return (
    <>
      <NavBar goldBalance={0} session={userId ? { user: { id: userId } } : null} />
      <main className="flex-1">{children}</main>
    </>
  );
} 