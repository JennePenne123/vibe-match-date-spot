import { useEffect, useState, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';

const SETTING_KEY = 'hioutz-auto-location-enabled';

export const getAutoLocationEnabled = (): boolean => {
  try {
    return localStorage.getItem(SETTING_KEY) === 'true';
  } catch {
    return false;
  }
};

/** Toggle-Setting für automatische Standortaktualisierung */
export const useAutoLocationSetting = () => {
  const [enabled, setEnabledState] = useState<boolean>(() => getAutoLocationEnabled());

  const setEnabled = useCallback((value: boolean) => {
    try {
      localStorage.setItem(SETTING_KEY, String(value));
    } catch { /* ignore */ }
    setEnabledState(value);
  }, []);

  return { enabled, setEnabled };
};

/**
 * Aktualisiert beim App-Start automatisch den Standort,
 * wenn der Nutzer die Berechtigung dauerhaft erteilt hat
 * und die Einstellung aktiv ist.
 */
export const useAutoLocationUpdate = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { enabled } = useAutoLocationSetting();
  const hasRun = useRef(false);

  useEffect(() => {
    if (!user || !enabled || hasRun.current) return;
    if (!navigator.geolocation || !navigator.permissions) return;
    hasRun.current = true;

    let cancelled = false;

    (async () => {
      try {
        const perm = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
        if (perm.state !== 'granted' || cancelled) return;

        navigator.geolocation.getCurrentPosition(
          async (pos) => {
            if (cancelled) return;
            try {
              const { error } = await supabase
                .from('user_preferences')
                .update({
                  home_latitude: pos.coords.latitude,
                  home_longitude: pos.coords.longitude,
                })
                .eq('user_id', user.id);
              if (error) throw error;
              await queryClient.invalidateQueries({ queryKey: ['user-preferences', user.id] });
            } catch (err) {
              console.warn('Auto location update failed:', err);
            }
          },
          (err) => console.warn('Auto location denied:', err.message),
          { timeout: 10000, enableHighAccuracy: false, maximumAge: 300000 }
        );
      } catch {
        /* permissions API not available */
      }
    })();

    return () => { cancelled = true; };
  }, [user, enabled, queryClient]);
};
