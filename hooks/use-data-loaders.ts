"use client"

import { useAuth } from '@clerk/nextjs';
import { useCallback } from 'react';
import { loadDataWithFallback, saveDataWithRedundancy } from '@/lib/migration-utils';

export function useDataLoaders() {
  const { getToken } = useAuth();

  // Helper function to make authenticated API calls
  const apiCall = useCallback(async (endpoint: string, options: RequestInit = {}) => {
    try {
      const token = await getToken({ template: 'supabase' });
      console.log('[useDataLoaders] Token obtained:', token ? 'YES' : 'NO');
      console.log('[useDataLoaders] Token length:', token?.length || 0);
      console.log('[useDataLoaders] Token preview:', token?.substring(0, 20) + '...');
      
      const response = await fetch(`/api/data${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
          ...options.headers,
        },
      });

      console.log('[useDataLoaders] Response status:', response.status);
      console.log('[useDataLoaders] Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[useDataLoaders] Error response body:', errorText);
        throw new Error(`API call failed: ${response.status} - ${errorText}`);
      }

      const responseData = await response.json();
      console.log('[useDataLoaders] Response data:', responseData);
      return responseData;
    } catch (error) {
      console.error('[useDataLoaders] API call error:', error);
      throw error;
    }
  }, [getToken]);

  // Grid/Map Data Loaders
  const loadGridData = useCallback(async (userId: string) => {
    return loadDataWithFallback(
      async () => {
        try {
          const result = await apiCall(`?type=grid&userId=${userId}`);
          // The API returns { data: { grid: gridData } }, so we need to extract the grid data
          const gridData = result.data?.grid || null;
          return { data: gridData, error: null };
        } catch (error) {
          return { data: null, error };
        }
      },
      'grid',
      null
    );
  }, [apiCall]);

  const saveGridData = useCallback(async (userId: string, gridData: any) => {
    return saveDataWithRedundancy(
      async (data) => {
        try {
          await apiCall('', {
            method: 'POST',
            body: JSON.stringify({
              type: 'grid',
              userId,
              data
            })
          });
          return { error: null };
        } catch (error) {
          return { error };
        }
      },
      'grid',
      gridData
    );
  }, [apiCall]);

  // Character Position Loaders
  const loadCharacterPosition = useCallback(async (userId: string) => {
    const position = await loadDataWithFallback(
      async () => {
        try {
          const result = await apiCall(`?type=character&userId=${userId}`);
          return { data: result.data, error: null };
        } catch (error) {
          return { data: null, error };
        }
      },
      'characterPosition',
      null
    );

    return position || { x: 0, y: 0 };
  }, [apiCall]);

  const saveCharacterPosition = useCallback(async (userId: string, position: { x: number; y: number }) => {
    return saveDataWithRedundancy(
      async (data) => {
        try {
          await apiCall('', {
            method: 'POST',
            body: JSON.stringify({
              type: 'character',
              userId,
              data
            })
          });
          return { error: null };
        } catch (error) {
          return { error };
        }
      },
      'characterPosition',
      position
    );
  }, [apiCall]);

  // Tile Inventory Loaders
  const loadTileInventory = useCallback(async (userId: string) => {
    return loadDataWithFallback(
      async () => {
        try {
          const result = await apiCall(`?type=inventory&userId=${userId}`);
          return { data: result.data, error: null };
        } catch (error) {
          return { data: null, error };
        }
      },
      'tileInventory',
      {}
    );
  }, [apiCall]);

  const saveTileInventory = useCallback(async (userId: string, inventory: Record<string, any>) => {
    return saveDataWithRedundancy(
      async (data) => {
        try {
          await apiCall('', {
            method: 'POST',
            body: JSON.stringify({
              type: 'inventory',
              userId,
              data
            })
          });
          return { error: null };
        } catch (error) {
          return { error };
        }
      },
      'tileInventory',
      inventory
    );
  }, [apiCall]);

  // User Preferences Loaders
  const loadUserPreferences = useCallback(async (userId: string) => {
    return loadDataWithFallback(
      async () => {
        try {
          const result = await apiCall(`?type=preferences&userId=${userId}`);
          return { data: result.data, error: null };
        } catch (error) {
          return { data: null, error };
        }
      },
      'userPreferences',
      {}
    );
  }, [apiCall]);

  const saveUserPreferences = useCallback(async (userId: string, preferences: Record<string, any>) => {
    return saveDataWithRedundancy(
      async (data) => {
        try {
          await apiCall('', {
            method: 'POST',
            body: JSON.stringify({
              type: 'preferences',
              userId,
              data
            })
          });
          return { error: null };
        } catch (error) {
          return { error };
        }
      },
      'userPreferences',
      preferences
    );
  }, [apiCall]);

  // Image Descriptions Loaders
  const loadImageDescriptions = useCallback(async (userId: string) => {
    return loadDataWithFallback(
      async () => {
        try {
          const result = await apiCall(`?type=descriptions&userId=${userId}`);
          return { data: result.data, error: null };
        } catch (error) {
          return { data: null, error };
        }
      },
      'imageDescriptions',
      {}
    );
  }, [apiCall]);

  const saveImageDescriptions = useCallback(async (userId: string, descriptions: Record<string, string>) => {
    return saveDataWithRedundancy(
      async (data) => {
        try {
          await apiCall('', {
            method: 'POST',
            body: JSON.stringify({
              type: 'descriptions',
              userId,
              data
            })
          });
          return { error: null };
        } catch (error) {
          return { error };
        }
      },
      'imageDescriptions',
      descriptions
    );
  }, [apiCall]);

  // Game Settings Loaders
  const loadGameSettings = useCallback(async (userId: string) => {
    return loadDataWithFallback(
      async () => {
        try {
          const result = await apiCall(`?type=settings&userId=${userId}`);
          return { data: result.data, error: null };
        } catch (error) {
          return { data: null, error };
        }
      },
      'gameSettings',
      {}
    );
  }, [apiCall]);

  const saveGameSettings = useCallback(async (userId: string, settings: Record<string, any>) => {
    return saveDataWithRedundancy(
      async (data) => {
        try {
          await apiCall('', {
            method: 'POST',
            body: JSON.stringify({
              type: 'settings',
              userId,
              data
            })
          });
          return { error: null };
        } catch (error) {
          return { error };
        }
      },
      'gameSettings',
      settings
    );
  }, [apiCall]);

  return {
    loadGridData,
    saveGridData,
    loadCharacterPosition,
    saveCharacterPosition,
    loadTileInventory,
    saveTileInventory,
    loadUserPreferences,
    saveUserPreferences,
    loadImageDescriptions,
    saveImageDescriptions,
    loadGameSettings,
    saveGameSettings,
  };
} 