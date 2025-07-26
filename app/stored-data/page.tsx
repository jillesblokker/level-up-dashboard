"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { toast } from 'sonner';
import { MigrationStatus } from '@/components/migration-status'
import { HealthCheck } from '@/components/health-check'
import { useSupabase } from '@/lib/hooks/useSupabase';
import { useAuth, useUser } from '@clerk/nextjs';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { getCharacterStats } from '@/lib/character-data-manager';
import { getInventory } from '@/lib/inventory-manager';
import { getUserAchievements } from '@/lib/achievements-manager';
import { useTitleEvolution } from '@/hooks/use-title-evolution'

interface SupabaseData {
  table: string;
  count: number;
  lastUpdated: string;
}

export default function StoredDataPage() {
  const [supabaseData, setSupabaseData] = useState<SupabaseData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [characterStats, setCharacterStats] = useState<any>(null);
  const [inventoryItems, setInventoryItems] = useState<any[]>([]);
  const [achievements, setAchievements] = useState<any[]>([]);
  
  const { user } = useUser();
  const { supabase } = useSupabase();
  const { triggerTestModal, triggerTestModal2, triggerTestModal3, triggerTestModal4, triggerTestModal5, triggerTestModal6, triggerTestModal7, triggerTestModal8, triggerTestModal9, triggerTestModal10 } = useTitleEvolution()

  useEffect(() => {
    async function loadSupabaseData() {
      if (!user?.id || !supabase) return;
      
      setIsLoading(true);
      try {
        // Load character stats
        const stats = await getCharacterStats(user.id);
        setCharacterStats(stats);

        // Load inventory
        const inventory = await getInventory(user.id);
        setInventoryItems(inventory || []);

        // Load achievements
        const userAchievements = await getUserAchievements();
        setAchievements(userAchievements || []);

        // Set summary data
        setSupabaseData([
          { table: 'Character Stats', count: stats ? 1 : 0, lastUpdated: new Date().toISOString() },
          { table: 'Inventory Items', count: inventory?.length || 0, lastUpdated: new Date().toISOString() },
          { table: 'Achievements', count: userAchievements?.length || 0, lastUpdated: new Date().toISOString() },
        ]);
      } catch (error) {
        console.error('Error loading Supabase data:', error);
        toast.error('Failed to load data');
      } finally {
        setIsLoading(false);
      }
    }

    loadSupabaseData();
  }, [user?.id, supabase]);

  const clearAllData = () => {
    localStorage.clear()
    sessionStorage.clear()
  }

  return (
    <main className="container mx-auto p-4" aria-label="stored-data-section">
      <h1 className="text-2xl font-bold mb-4">Stored Data (Supabase)</h1>
      
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="p-4" aria-label="supabase-data-card">
          <CardHeader>
            <CardTitle>Supabase Data Overview</CardTitle>
            <CardDescription>Your data stored in Supabase</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div>Loading...</div>
            ) : (
              <ScrollArea className="h-[300px]" aria-label="supabase-data-scroll-area">
                {supabaseData.map((item) => (
                  <div key={item.table} className="flex justify-between items-center p-2 border-b">
                    <span className="font-medium">{item.table}</span>
                    <Badge variant="secondary">{item.count} items</Badge>
                  </div>
                ))}
              </ScrollArea>
            )}
          </CardContent>
        </Card>

        <Card className="p-4" aria-label="character-stats-card">
          <CardHeader>
            <CardTitle>Character Stats</CardTitle>
          </CardHeader>
          <CardContent>
            {characterStats ? (
              <div className="space-y-2">
                <p>Level: {characterStats.level}</p>
                <p>Gold: {characterStats.gold}</p>
                <p>Experience: {characterStats.experience}</p>
              </div>
            ) : (
              <p>No character stats found</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mt-6">
        <MigrationStatus />
      </div>
      
      <div className="mt-6">
        <HealthCheck />
      </div>

      <div className="mt-6">
        <h3 className="text-lg font-semibold mb-4">Test Title Evolution Modal</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
          <Button onClick={triggerTestModal} variant="outline" className="text-xs">
            Squire → Knight (L10)
          </Button>
          <Button onClick={triggerTestModal2} variant="outline" className="text-xs">
            Knight → Baron (L20)
          </Button>
          <Button onClick={triggerTestModal3} variant="outline" className="text-xs">
            Baron → Viscount (L30)
          </Button>
          <Button onClick={triggerTestModal4} variant="outline" className="text-xs">
            Viscount → Count (L40)
          </Button>
          <Button onClick={triggerTestModal5} variant="outline" className="text-xs">
            Count → Marquis (L50)
          </Button>
          <Button onClick={triggerTestModal6} variant="outline" className="text-xs">
            Marquis → Duke (L60)
          </Button>
          <Button onClick={triggerTestModal7} variant="outline" className="text-xs">
            Duke → Prince (L70)
          </Button>
          <Button onClick={triggerTestModal8} variant="outline" className="text-xs">
            Prince → King (L80)
          </Button>
          <Button onClick={triggerTestModal9} variant="outline" className="text-xs">
            King → Emperor (L90)
          </Button>
          <Button onClick={triggerTestModal10} variant="outline" className="text-xs">
            Emperor → God (L100)
          </Button>
        </div>
      </div>

      <div className="mt-6">
        <Button onClick={clearAllData} variant="destructive">
          Clear All Data
        </Button>
      </div>
    </main>
  );
} 