import React from 'react';
import { WifiOff, RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useOnlineStatusContext } from '@/contexts/OnlineStatusContext';
import { Button } from '@/components/ui/button';

export const OfflineBanner: React.FC = () => {
  const { isOnline, wasOffline, lastOnlineTime } = useOnlineStatusContext();
  const { t } = useTranslation();

  // Show reconnected message briefly after coming back online
  const showReconnected =
    isOnline && wasOffline && lastOnlineTime && Date.now() - lastOnlineTime < 5000;

  if (isOnline && !showReconnected) {
    return null;
  }

  if (showReconnected) {
    return (
      <div className="fixed top-0 left-0 right-0 z-[60] bg-green-600 text-white py-2 px-4 text-center animate-in slide-in-from-top duration-300">
        <div className="flex items-center justify-center gap-2">
          <RefreshCw className="h-4 w-4" />
          <span className="text-sm font-medium">{t('offlineBanner.reconnected')}</span>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[60] bg-destructive text-destructive-foreground py-2.5 px-4 animate-in slide-in-from-top duration-300"
      role="status"
      aria-live="polite"
    >
      <div className="max-w-md mx-auto flex items-center justify-center gap-3">
        <WifiOff className="h-4 w-4 shrink-0" />
        <div className="flex-1 min-w-0 text-center sm:text-left">
          <p className="text-sm font-semibold leading-tight">{t('offlineBanner.offline')}</p>
          <p className="text-[11px] opacity-90 leading-tight">{t('offlineBanner.limited')}</p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => window.location.reload()}
          className="ml-1 h-7 shrink-0"
        >
          <RefreshCw className="h-3 w-3 mr-1" />
          {t('offlineBanner.retry')}
        </Button>
      </div>
    </div>
  );
};

export default OfflineBanner;
