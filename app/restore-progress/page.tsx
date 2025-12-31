"use client"

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { ArrowLeft, RotateCcw, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { TEXT_CONTENT } from "@/lib/text-content"

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
          title: TEXT_CONTENT.restoreProgress.toast.successTitle,
          description: TEXT_CONTENT.restoreProgress.toast.successDesc
            .replace('{count}', data.restored)
            .replace('{xp}', data.totalXP)
            .replace('{gold}', data.totalGold),
        });
      } else {
        throw new Error(data.error || TEXT_CONTENT.restoreProgress.toast.failDesc);
      }
    } catch (error) {
      console.error('Restore error:', error);
      toast({
        title: TEXT_CONTENT.restoreProgress.toast.failTitle,
        description: error instanceof Error ? error.message : TEXT_CONTENT.restoreProgress.toast.failDesc,
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
            {TEXT_CONTENT.restoreProgress.backLink}
          </Link>
          <h1 className="text-3xl font-bold text-white mb-2">{TEXT_CONTENT.restoreProgress.title}</h1>
          <p className="text-gray-300">
            {TEXT_CONTENT.restoreProgress.description}
          </p>
        </div>

        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <RotateCcw className="w-5 h-5 mr-2" />
              {TEXT_CONTENT.restoreProgress.cardTitle}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-gray-300">
              <p className="mb-2">
                {TEXT_CONTENT.restoreProgress.explanation.main}
              </p>
              <p className="text-sm text-gray-400">
                {TEXT_CONTENT.restoreProgress.explanation.sub}
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
                  {TEXT_CONTENT.restoreProgress.button.loading}
                </>
              ) : (
                <>
                  <RotateCcw className="w-4 h-4 mr-2" />
                  {TEXT_CONTENT.restoreProgress.button.idle}
                </>
              )}
            </Button>

            {restoreResult && (
              <div className="mt-4 p-4 bg-green-900/20 border border-green-500/30 rounded-lg">
                <div className="flex items-center text-green-400 mb-2">
                  <CheckCircle className="w-5 h-5 mr-2" />
                  <span className="font-semibold">{TEXT_CONTENT.restoreProgress.result.success}</span>
                </div>
                <div className="text-sm text-gray-300 space-y-1">
                  <p>• {TEXT_CONTENT.restoreProgress.result.restored.replace('{count}', restoreResult.restored)}</p>
                  <p>• {TEXT_CONTENT.restoreProgress.result.xpAdded.replace('{xp}', restoreResult.totalXP)}</p>
                  <p>• {TEXT_CONTENT.restoreProgress.result.goldAdded.replace('{gold}', restoreResult.totalGold)}</p>
                  <p>• {TEXT_CONTENT.restoreProgress.result.newTotal.replace('{xp}', restoreResult.newStats?.experience).replace('{gold}', restoreResult.newStats?.gold)}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
