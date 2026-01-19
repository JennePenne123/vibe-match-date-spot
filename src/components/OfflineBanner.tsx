
import React from 'react';
import { WifiOff, RefreshCw } from 'lucide-react';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { Button } from '@/components/ui/button';

export const OfflineBanner: React.FC = () => {
  const { isOnline, wasOffline, lastOnlineTime } = useOnlineStatus();
  
  // Show reconnected message briefly after coming back online
  const showReconnected = isOnline && wasOffline && lastOnlineTime && 
    (Date.now() - lastOnlineTime < 5000);
  
  if (isOnline && !showReconnected) {
    return null;
  }
  
  if (showReconnected) {
    return (
      <div className="fixed top-0 left-0 right-0 z-50 bg-green-600 text-white py-2 px-4 text-center animate-in slide-in-from-top duration-300">
        <div className="flex items-center justify-center gap-2">
          <RefreshCw className="h-4 w-4" />
          <span className="text-sm font-medium">You're back online!</span>
        </div>
      </div>
    );
  }
  
  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-destructive text-destructive-foreground py-3 px-4 animate-in slide-in-from-top duration-300">
      <div className="flex items-center justify-center gap-3">
        <WifiOff className="h-4 w-4" />
        <span className="text-sm font-medium">You're offline. Some features may be limited.</span>
        <Button 
          variant="secondary" 
          size="sm" 
          onClick={() => window.location.reload()}
          className="ml-2 h-7"
        >
          <RefreshCw className="h-3 w-3 mr-1" />
          Retry
        </Button>
      </div>
    </div>
  );
};

export default OfflineBanner;
