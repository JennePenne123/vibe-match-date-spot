import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Clock } from 'lucide-react';

/**
 * Live date/time display for the admin header.
 * Updates every second so the admin area always shows the current server/client time.
 */
export function AdminHeaderClock() {
  const { i18n } = useTranslation();
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const interval = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  const locale = i18n.language === 'de' ? 'de-DE' : i18n.language === 'es' ? 'es-ES' : 'en-GB';

  return (
    <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/50 border border-border/40 text-sm text-muted-foreground">
      <Clock className="w-4 h-4 text-primary" />
      <time dateTime={now.toISOString()} className="tabular-nums">
        {now.toLocaleDateString(locale, { day: '2-digit', month: '2-digit', year: 'numeric' })}
        <span className="mx-2 text-border">|</span>
        {now.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
      </time>
    </div>
  );
}
