"use client"

import React from 'react';
import { NavBar } from '@/components/nav-bar';
import { useAuth } from '@/components/providers';

export function AuthContent({ children }: { children: React.ReactNode }) {
  const { session, isLoading, goldBalance } = useAuth();

  if (isLoading) {
    // Optional: Render a loading state or null while auth is checking
    return null;
  }

  return (
    <>
      <NavBar session={session} goldBalance={goldBalance} />
      <main className="flex-1">{children}</main>
    </>
  );
} 