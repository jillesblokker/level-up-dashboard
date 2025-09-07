import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, WifiOff, CheckCircle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface OfflineQueueIndicatorProps {
  isOnline: boolean;
  queueStats: {
    total: number;
    pending: number;
    retrying: number;
    oldestItem: number | null;
  };
  isProcessing: boolean;
  onProcessQueue?: () => void;
  onClearQueue?: () => void;
  className?: string;
}

export function OfflineQueueIndicator({
  isOnline,
  queueStats,
  isProcessing,
  onProcessQueue,
  onClearQueue,
  className,
}: OfflineQueueIndicatorProps) {
  if (isOnline && queueStats.total === 0) {
    return null; // Don't show when online and no queue
  }

  const getStatusInfo = () => {
    if (!isOnline) {
      return {
        icon: WifiOff,
        text: 'Offline',
        variant: 'destructive' as const,
        color: 'text-red-400',
      };
    }

    if (isProcessing) {
      return {
        icon: Clock,
        text: 'Syncing...',
        variant: 'secondary' as const,
        color: 'text-blue-400',
      };
    }

    if (queueStats.retrying > 0) {
      return {
        icon: AlertCircle,
        text: `${queueStats.total} Failed`,
        variant: 'destructive' as const,
        color: 'text-red-400',
      };
    }

    return {
      icon: Clock,
      text: `${queueStats.total} Pending`,
      variant: 'outline' as const,
      color: 'text-amber-400',
    };
  };

  const statusInfo = getStatusInfo();
  const Icon = statusInfo.icon;

  const formatAge = (timestamp: number | null) => {
    if (!timestamp) return '';
    const age = Date.now() - timestamp;
    const minutes = Math.floor(age / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Badge 
        variant={statusInfo.variant}
        className={cn(
          'flex items-center gap-1 text-xs',
          statusInfo.color
        )}
      >
        <Icon className="h-3 w-3" />
        {statusInfo.text}
      </Badge>

      {queueStats.total > 0 && (
        <div className="flex items-center gap-1">
          {queueStats.oldestItem && (
            <span className="text-xs text-gray-400">
              {formatAge(queueStats.oldestItem)}
            </span>
          )}
          
          {isOnline && !isProcessing && onProcessQueue && (
            <Button
              size="sm"
              variant="outline"
              onClick={onProcessQueue}
              className="h-6 px-2 text-xs"
            >
              Sync
            </Button>
          )}
          
          {queueStats.total > 0 && onClearQueue && (
            <Button
              size="sm"
              variant="ghost"
              onClick={onClearQueue}
              className="h-6 px-2 text-xs text-gray-400 hover:text-red-400"
            >
              Clear
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
