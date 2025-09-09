"use client"

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { ArrowLeft, RotateCcw, CheckCircle } from 'lucide-react';
import Link from 'next/link';

export default function RestoreProgressPage() {
  const [isRestoring, setIsRestoring] = useState(false);
  const [restoreResult, setRestoreResult] = useState<any>(null);
  const { toast } = useToast();

  const handleRestore = async () => {
    setIsRestoring(true);
    setRestoreResult(null);

    try {
      const response = await fetch('/api/quests/restore-completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok) {
        setRestoreResult(data);
        toast({
          title: "Progress Restored!",
          description: `Successfully restored ${data.restored} quest completions with ${data.totalXP} XP and ${data.totalGold} gold!`,
        });
      } else {
        throw new Error(data.error || 'Failed to restore progress');
      }
    } catch (error) {
      console.error('Restore error:', error);
      toast({
        title: "Restore Failed",
        description: error instanceof Error ? error.message : 'Failed to restore progress',
        variant: "destructive",
      });
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <Link href="/quests" className="inline-flex items-center text-amber-400 hover:text-amber-300 mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Quests
          </Link>
          <h1 className="text-3xl font-bold text-white mb-2">Restore Quest Progress</h1>
          <p className="text-gray-300">
            Restore your quest completion progress and rewards from the database.
          </p>
        </div>

        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <RotateCcw className="w-5 h-5 mr-2" />
              Quest Progress Restore
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-gray-300">
              <p className="mb-2">
                This will restore your quest completion progress and add the corresponding XP and gold rewards to your character.
              </p>
              <p className="text-sm text-gray-400">
                The system will find all completed quests in your database and restore the rewards.
              </p>
            </div>

            <Button 
              onClick={handleRestore}
              disabled={isRestoring}
              className="w-full bg-amber-600 hover:bg-amber-700 text-white"
            >
              {isRestoring ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Restoring Progress...
                </>
              ) : (
                <>
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Restore Quest Progress
                </>
              )}
            </Button>

            {restoreResult && (
              <div className="mt-4 p-4 bg-green-900/20 border border-green-500/30 rounded-lg">
                <div className="flex items-center text-green-400 mb-2">
                  <CheckCircle className="w-5 h-5 mr-2" />
                  <span className="font-semibold">Restore Successful!</span>
                </div>
                <div className="text-sm text-gray-300 space-y-1">
                  <p>• Restored {restoreResult.restored} quest completions</p>
                  <p>• Added {restoreResult.totalXP} XP to your character</p>
                  <p>• Added {restoreResult.totalGold} gold to your character</p>
                  <p>• New total: {restoreResult.newStats?.experience} XP, {restoreResult.newStats?.gold} gold</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
