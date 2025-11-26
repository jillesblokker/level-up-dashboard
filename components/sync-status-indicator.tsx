import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Loader2, Wifi, WifiOff, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SyncStatusIndicatorProps {
  isSyncing: boolean;
  lastSync: number;
  error?: string | null;
  className?: string;
}

export function SyncStatusIndicator({
  isSyncing,
  lastSync,
  error,
  className
}: SyncStatusIndicatorProps) {
  const getStatusInfo = () => {
    if (error) {
      return {
        icon: AlertCircle,
        text: 'Sync Error',
        variant: 'destructive' as const,
        color: 'text-red-400',
      };
    }

    if (isSyncing) {
      return {
        icon: Loader2,
        text: 'Syncing...',
        variant: 'secondary' as const,
        color: 'text-blue-400',
      };
    }

    const timeSinceLastSync = Date.now() - lastSync;
    const isRecent = timeSinceLastSync < 60000; // Less than 1 minute

    return {
      icon: Wifi,
      text: isRecent ? 'Live' : 'Synced',
      variant: isRecent ? 'default' as const : 'outline' as const,
      color: isRecent ? 'text-green-400' : 'text-amber-400',
    };
  };

  const statusInfo = getStatusInfo();
  const Icon = statusInfo.icon;

  return (
    <Badge
      variant={statusInfo.variant}
      className={cn(
        'flex items-center gap-1 text-xs',
        statusInfo.color,
        className
      )}
    >
      <Icon
        className={cn(
          'h-3 w-3',
          isSyncing && 'animate-spin'
        )}
      />
      {statusInfo.text}
    </Badge>
  );
}
