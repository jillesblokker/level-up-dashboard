import React from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, Wifi, WifiOff, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info' | 'offline' | 'online';
  title: string;
  description?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
  persistent?: boolean;
}

interface ToastProps {
  message: ToastMessage;
  onDismiss: (id: string) => void;
}

export function Toast({ message, onDismiss }: ToastProps) {
  const [isVisible, setIsVisible] = React.useState(true);
  const [isExiting, setIsExiting] = React.useState(false);

  React.useEffect(() => {
    if (message.persistent) return;

    const timer = setTimeout(() => {
      handleDismiss();
    }, message.duration || 5000);

    return () => clearTimeout(timer);
  }, [message.duration, message.persistent]);

  const handleDismiss = () => {
    setIsExiting(true);
    setTimeout(() => {
      setIsVisible(false);
      onDismiss(message.id);
    }, 300);
  };

  const getIcon = () => {
    switch (message.type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-400" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-400" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-amber-400" />;
      case 'info':
        return <Info className="h-5 w-5 text-blue-400" />;
      case 'offline':
        return <WifiOff className="h-5 w-5 text-amber-400" />;
      case 'online':
        return <Wifi className="h-5 w-5 text-green-400" />;
      default:
        return <Info className="h-5 w-5 text-gray-400" />;
    }
  };

  const getBorderColor = () => {
    switch (message.type) {
      case 'success':
        return 'border-green-500/30';
      case 'error':
        return 'border-red-500/30';
      case 'warning':
        return 'border-amber-500/30';
      case 'info':
        return 'border-blue-500/30';
      case 'offline':
        return 'border-amber-500/30';
      case 'online':
        return 'border-green-500/30';
      default:
        return 'border-gray-500/30';
    }
  };

  const getBackgroundColor = () => {
    switch (message.type) {
      case 'success':
        return 'bg-green-900/20';
      case 'error':
        return 'bg-red-900/20';
      case 'warning':
        return 'bg-amber-900/20';
      case 'info':
        return 'bg-blue-900/20';
      case 'offline':
        return 'bg-amber-900/20';
      case 'online':
        return 'bg-green-900/20';
      default:
        return 'bg-gray-900/20';
    }
  };

  if (!isVisible) return null;

  return (
    <div
      className={cn(
        'fixed top-4 right-4 z-50 max-w-sm w-full',
        'transform transition-all duration-300 ease-in-out',
        isExiting ? 'translate-x-full opacity-0' : 'translate-x-0 opacity-100'
      )}
    >
      <div
        className={cn(
          'border rounded-lg p-4 shadow-lg backdrop-blur-sm',
          getBorderColor(),
          getBackgroundColor()
        )}
      >
        <div className="flex items-start gap-3">
          {getIcon()}
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-semibold text-white">
              {message.title}
            </h4>
            {message.description && (
              <p className="text-sm text-gray-300 mt-1">
                {message.description}
              </p>
            )}
            {message.action && (
              <button
                onClick={message.action.onClick}
                className="text-sm text-amber-400 hover:text-amber-300 mt-2 underline"
              >
                {message.action.label}
              </button>
            )}
          </div>
          <button
            onClick={handleDismiss}
            className="text-gray-400 hover:text-gray-300 transition-colors"
            aria-label="Dismiss notification"
            title="Dismiss notification"
          >
            <XCircle className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

interface ToastContainerProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast}
          onDismiss={onDismiss}
        />
      ))}
    </div>
  );
}

// Hook for managing toasts
export function useToast() {
  const [toasts, setToasts] = React.useState<ToastMessage[]>([]);

  const addToast = React.useCallback((message: Omit<ToastMessage, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast: ToastMessage = { ...message, id };
    
    setToasts(prev => [...prev, newToast]);
    
    return id;
  }, []);

  const dismissToast = React.useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const clearAllToasts = React.useCallback(() => {
    setToasts([]);
  }, []);

  // Convenience methods
  const showSuccess = React.useCallback((title: string, description?: string) => {
    return addToast({ type: 'success', title, ...(description && { description }) });
  }, [addToast]);

  const showError = React.useCallback((title: string, description?: string) => {
    return addToast({ type: 'error', title, ...(description && { description }) });
  }, [addToast]);

  const showWarning = React.useCallback((title: string, description?: string) => {
    return addToast({ type: 'warning', title, ...(description && { description }) });
  }, [addToast]);

  const showInfo = React.useCallback((title: string, description?: string) => {
    return addToast({ type: 'info', title, ...(description && { description }) });
  }, [addToast]);

  const showOffline = React.useCallback((title: string, description?: string) => {
    return addToast({ 
      type: 'offline', 
      title, 
      ...(description && { description }),
      persistent: true 
    });
  }, [addToast]);

  const showOnline = React.useCallback((title: string, description?: string) => {
    return addToast({ 
      type: 'online', 
      title, 
      ...(description && { description }),
      duration: 3000 
    });
  }, [addToast]);

  return {
    toasts,
    addToast,
    dismissToast,
    clearAllToasts,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showOffline,
    showOnline,
  };
}

// Quest-specific toast helpers
export function useQuestToasts() {
  const toast = useToast();

  const showQuestCompleted = React.useCallback((questName: string, xp: number, gold: number) => {
    return toast.showSuccess(
      'Quest Completed! 🎉',
      `${questName} completed! +${xp} XP, +${gold} Gold`
    );
  }, [toast]);

  const showQuestError = React.useCallback((questName: string, error: string) => {
    return toast.showError(
      'Quest Error',
      `Failed to complete ${questName}: ${error}`
    );
  }, [toast]);

  const showOfflineQuest = React.useCallback((questName: string) => {
    return toast.showOffline(
      'Offline Mode',
      `${questName} will be synced when you're back online`
    );
  }, [toast]);

  const showSyncSuccess = React.useCallback((count: number) => {
    return toast.showSuccess(
      'Sync Complete',
      `Successfully synced ${count} quest${count === 1 ? '' : 's'}`
    );
  }, [toast]);

  const showSyncError = React.useCallback((error: string) => {
    return toast.showError(
      'Sync Failed',
      `Failed to sync quests: ${error}`
    );
  }, [toast]);

  return {
    showQuestCompleted,
    showQuestError,
    showOfflineQuest,
    showSyncSuccess,
    showSyncError,
    ...toast,
  };
}
