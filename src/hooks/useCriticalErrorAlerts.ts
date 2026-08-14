import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

const POLL_MS = 30_000;
const SEEN_KEY = 'hioutz-admin-last-error-alert';

/**
 * Polls `error_logs` for new unresolved critical/error entries while an admin
 * is inside the admin area and raises a toast with a jump link so crashes are
 * visible immediately instead of only on the errors page.
 */
export function useCriticalErrorAlerts(enabled: boolean) {
  const navigate = useNavigate();
  const runningRef = useRef(false);

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;

    const check = async () => {
      if (runningRef.current) return;
      runningRef.current = true;
      try {
        const since =
          localStorage.getItem(SEEN_KEY) ||
          new Date(Date.now() - POLL_MS).toISOString();

        const { data, error } = await supabase
          .from('error_logs' as any)
          .select('id, error_message, severity, route, created_at')
          .eq('resolved', false)
          .in('severity', ['critical', 'error'])
          .gt('created_at', since)
          .order('created_at', { ascending: false })
          .limit(5);

        if (cancelled || error || !data?.length) return;

        const rows = data as any[];
        localStorage.setItem(SEEN_KEY, rows[0].created_at);

        const criticalCount = rows.filter((r) => r.severity === 'critical').length;
        const title =
          rows.length === 1
            ? criticalCount
              ? 'Neuer kritischer Fehler'
              : 'Neuer Fehler'
            : `${rows.length} neue Fehler`;

        toast.error(title, {
          description: rows[0].error_message?.slice(0, 140),
          duration: 10_000,
          action: {
            label: 'Ansehen',
            onClick: () => navigate('/admin/errors'),
          },
        });
      } finally {
        runningRef.current = false;
      }
    };

    void check();
    const interval = window.setInterval(check, POLL_MS);
    const onFocus = () => void check();
    window.addEventListener('focus', onFocus);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
      window.removeEventListener('focus', onFocus);
    };
  }, [enabled, navigate]);
}