import { useCallback, useEffect, useState } from 'react';

export const TRAFFIC_LIGHT_NOTIFICATIONS_KEY = 'hioutz-trafficlight-notifications';
const EVENT_NAME = 'hioutz-trafficlight-notifications-changed';

function read(): boolean {
  try {
    return localStorage.getItem(TRAFFIC_LIGHT_NOTIFICATIONS_KEY) !== 'false';
  } catch {
    return true;
  }
}

/** Nutzer-Einstellung: Benachrichtigungen bei Ampelwechsel (Standard: an). */
export function useTrafficLightNotificationSetting() {
  const [enabled, setEnabledState] = useState<boolean>(read);

  useEffect(() => {
    const sync = () => setEnabledState(read());
    window.addEventListener(EVENT_NAME, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(EVENT_NAME, sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  const setEnabled = useCallback((value: boolean) => {
    try {
      localStorage.setItem(TRAFFIC_LIGHT_NOTIFICATIONS_KEY, String(value));
    } catch {
      /* ignore */
    }
    setEnabledState(value);
    window.dispatchEvent(new Event(EVENT_NAME));
  }, []);

  return { enabled, setEnabled };
}
