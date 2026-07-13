import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useOnlineStatusContext } from '@/contexts/OnlineStatusContext';
import { toast } from '@/hooks/use-toast';

/**
 * Guards network-dependent actions while offline. `guard(fn)` returns a handler
 * that runs `fn` only when online, otherwise it shows a toast explaining that
 * the action is temporarily disabled.
 */
export function useOfflineGuard() {
  const { isOnline } = useOnlineStatusContext();
  const { t } = useTranslation();

  const guard = useCallback(
    <A extends unknown[]>(fn?: (...args: A) => void) =>
      (...args: A) => {
        if (!isOnline) {
          toast({
            title: t('offlineBanner.actionDisabledTitle'),
            description: t('offlineBanner.actionDisabled'),
            variant: 'destructive',
          });
          return;
        }
        fn?.(...args);
      },
    [isOnline, t],
  );

  return { isOnline, isOffline: !isOnline, guard };
}
