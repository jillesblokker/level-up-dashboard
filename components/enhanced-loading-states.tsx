import React from 'react';
import { Loader2, CheckCircle, XCircle, Clock, Wifi, WifiOff } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoadingStateProps {
  isLoading: boolean;
  isSuccess?: boolean;
  isError?: boolean;
  isOffline?: boolean;
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function LoadingState({
  isLoading,
  isSuccess = false,
  isError = false,
  isOffline = false,
  message,
  size = 'md',
  className,
}: LoadingStateProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
  };

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  if (isOffline) {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <WifiOff className={cn(sizeClasses[size], 'text-amber-400')} />
        {message && (
          <span className={cn(textSizeClasses[size], 'text-amber-400')}>
            {message}
          </span>
        )}
      </div>
    );
  }

  if (isError) {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <XCircle className={cn(sizeClasses[size], 'text-red-400')} />
        {message && (
          <span className={cn(textSizeClasses[size], 'text-red-400')}>
            {message}
          </span>
        )}
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <CheckCircle className={cn(sizeClasses[size], 'text-green-400')} />
        {message && (
          <span className={cn(textSizeClasses[size], 'text-green-400')}>
            {message}
          </span>
        )}
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <Loader2 className={cn(sizeClasses[size], 'text-blue-400 animate-spin')} />
        {message && (
          <span className={cn(textSizeClasses[size], 'text-blue-400')}>
            {message}
          </span>
        )}
      </div>
    );
  }

  return null;
}

interface QuestLoadingStateProps {
  questId: string;
  isPending: boolean;
  isOffline?: boolean;
  className?: string;
}

export function QuestLoadingState({
  questId,
  isPending,
  isOffline = false,
  className,
}: QuestLoadingStateProps) {
  if (!isPending && !isOffline) return null;

  return (
    <div className={cn('flex items-center gap-1', className)}>
      {isOffline ? (
        <WifiOff className="h-3 w-3 text-amber-400" />
      ) : (
        <Loader2 className="h-3 w-3 text-blue-400 animate-spin" />
      )}
    </div>
  );
}

interface SyncLoadingStateProps {
  isSyncing: boolean;
  isOffline: boolean;
  lastSync: number;
  className?: string;
}

export function SyncLoadingState({
  isSyncing,
  isOffline,
  lastSync,
  className,
}: SyncLoadingStateProps) {
  const getStatusMessage = () => {
    if (isOffline) return 'Offline';
    if (isSyncing) return 'Syncing...';
    
    const timeSinceLastSync = Date.now() - lastSync;
    if (timeSinceLastSync < 60000) return 'Live';
    return 'Offline';
  };

  const getStatusIcon = () => {
    if (isOffline) return <WifiOff className="h-3 w-3 text-red-400" />;
    if (isSyncing) return <Loader2 className="h-3 w-3 text-blue-400 animate-spin" />;
    
    const timeSinceLastSync = Date.now() - lastSync;
    if (timeSinceLastSync < 60000) return <Wifi className="h-3 w-3 text-green-400" />;
    return <Clock className="h-3 w-3 text-gray-400" />;
  };

  return (
    <div className={cn('flex items-center gap-1', className)}>
      {getStatusIcon()}
      <span className="text-xs text-gray-400">{getStatusMessage()}</span>
    </div>
  );
}

interface ProgressIndicatorProps {
  progress: number;
  total: number;
  label?: string;
  showPercentage?: boolean;
  className?: string;
}

export function ProgressIndicator({
  progress,
  total,
  label,
  showPercentage = true,
  className,
}: ProgressIndicatorProps) {
  const percentage = total > 0 ? Math.round((progress / total) * 100) : 0;

  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <div className="flex justify-between text-sm">
          <span className="text-gray-300">{label}</span>
          {showPercentage && (
            <span className="text-gray-400">{percentage}%</span>
          )}
        </div>
      )}
      <div className="w-full bg-gray-700 rounded-full h-2">
        <div
          className="bg-amber-500 h-2 rounded-full transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <div className="flex justify-between text-xs text-gray-400">
        <span>{progress}</span>
        <span>{total}</span>
      </div>
    </div>
  );
}
