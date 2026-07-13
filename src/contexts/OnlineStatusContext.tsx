import React, { createContext, useContext } from 'react';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';

interface OnlineStatusValue {
  isOnline: boolean;
  wasOffline: boolean;
  lastOnlineTime: number | null;
}

const OnlineStatusContext = createContext<OnlineStatusValue>({
  isOnline: true,
  wasOffline: false,
  lastOnlineTime: null,
});

/**
 * Single source of truth for connectivity across the app so we only run one
 * connectivity poller and every consumer stays in sync.
 */
export const OnlineStatusProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const status = useOnlineStatus();
  return (
    <OnlineStatusContext.Provider value={status}>
      {children}
    </OnlineStatusContext.Provider>
  );
};

export const useOnlineStatusContext = () => useContext(OnlineStatusContext);
