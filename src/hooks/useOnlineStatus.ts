
import { useState, useEffect, useCallback } from 'react';

interface OnlineStatus {
  isOnline: boolean;
  wasOffline: boolean;
  lastOnlineTime: number | null;
}

export function useOnlineStatus(): OnlineStatus {
  const [isOnline, setIsOnline] = useState(() => 
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [wasOffline, setWasOffline] = useState(false);
  const [lastOnlineTime, setLastOnlineTime] = useState<number | null>(null);
  
  const handleOnline = useCallback(() => {
    console.log('[Online] Connection restored');
    setIsOnline(true);
    setLastOnlineTime(Date.now());
  }, []);
  
  const handleOffline = useCallback(() => {
    console.log('[Online] Connection lost');
    setIsOnline(false);
    setWasOffline(true);
  }, []);
  
  useEffect(() => {
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Also check connectivity periodically
    const checkConnectivity = async () => {
      try {
        const response = await fetch('/favicon.ico', { 
          method: 'HEAD',
          cache: 'no-store'
        });
        if (response.ok && !isOnline) {
          handleOnline();
        }
      } catch {
        if (isOnline) {
          handleOffline();
        }
      }
    };
    
    const interval = setInterval(checkConnectivity, 30000); // Check every 30s
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, [handleOnline, handleOffline, isOnline]);
  
  return { isOnline, wasOffline, lastOnlineTime };
}
