import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  subscribeBackgroundSave,
  flushBackgroundSave,
  type BackgroundSaveStatus,
} from '@/lib/backgroundProfileSave';

/** Shows a discreet hint while a background profile update retries or fails. */
const BackgroundSaveBanner: React.FC = () => {
  const { t } = useTranslation();
  const [status, setStatus] = useState<BackgroundSaveStatus | null>(null);

  useEffect(() => subscribeBackgroundSave(setStatus), []);

  if (!status || !status.pending) return null;

  const isRetrying = status.state === 'saving' || status.state === 'retrying';

  return (
    <div
      role="status"
      aria-live="polite"
      className="mb-4 flex items-center gap-3 rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm"
    >
      {isRetrying ? (
        <Loader2 className="h-4 w-4 shrink-0 animate-spin text-muted-foreground" />
      ) : (
        <AlertTriangle className="h-4 w-4 shrink-0 text-destructive" />
      )}
      <span className="flex-1 text-foreground/90">
        {isRetrying
          ? t('preferences.bgSaveRetrying', 'Deine Angaben werden erneut gespeichert …')
          : status.error === 'offline'
            ? t('preferences.bgSaveOffline', 'Keine Verbindung – deine Angaben werden gespeichert, sobald du wieder online bist.')
            : t('preferences.bgSaveFailed', 'Speichern im Hintergrund fehlgeschlagen. Deine Angaben bleiben erhalten.')}
      </span>
      {!isRetrying && (
        <Button size="sm" variant="outline" onClick={() => void flushBackgroundSave()}>
          <RefreshCw className="mr-1 h-3.5 w-3.5" />
          {t('common.tryAgain', 'Erneut versuchen')}
        </Button>
      )}
    </div>
  );
};

export default BackgroundSaveBanner;
