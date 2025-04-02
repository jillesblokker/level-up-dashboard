"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { db, initializeDatabase } from '@/lib/db';
import { useToast } from '@/components/ui/use-toast';

type DbContextType = {
  isDbInitialized: boolean;
  isLoading: boolean;
  error: Error | null;
};

const DbContext = createContext<DbContextType>({
  isDbInitialized: false,
  isLoading: true,
  error: null,
});

export const useDb = () => useContext(DbContext);

export function DbProvider({ children }: { children: ReactNode }) {
  const [isDbInitialized, setIsDbInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const initDb = async () => {
      try {
        await initializeDatabase();
        setIsDbInitialized(true);
      } catch (err) {
        console.error('Failed to initialize database:', err);
        setError(err instanceof Error ? err : new Error('Unknown database error'));
        toast({
          title: 'Database Error',
          description: 'Failed to initialize the application database. Some features may not work correctly.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    initDb();
  }, [toast]);

  return (
    <DbContext.Provider value={{ isDbInitialized, isLoading, error }}>
      {children}
    </DbContext.Provider>
  );
} 